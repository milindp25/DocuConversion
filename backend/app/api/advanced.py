"""
Advanced PDF processing endpoints.

Provides PDF comparison, flattening, and batch operations for
processing multiple files at once. All endpoints use rate limiting
and optional authentication.
"""

import asyncio
import logging
import re
import tempfile
import zipfile
from pathlib import Path

import fitz  # PyMuPDF

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from app.core.auth import UserClaims
from app.core.dependencies import get_optional_user
from app.core.exceptions import (
    ConversionError,
    FileValidationError,
    StorageError,
    handle_docuconversion_error,
)
from app.models.schemas import JobStatus, PdfDiffResponse, ProcessingResponse
from app.services.job_manager import job_manager
from app.services.pdf_diff import PdfDiffService
from app.services.storage import get_storage
from app.utils.file_validation import validate_pdf_upload

logger = logging.getLogger(__name__)
router = APIRouter()

# Maximum files allowed in a batch operation
_MAX_BATCH_FILES = 10

# Supported batch operations
_BATCH_OPERATIONS = {"compress", "flatten"}


@router.post("/compare")
@limiter.limit("10/minute")
async def compare_pdfs(
    request: Request,
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> JSONResponse:
    """Compare two PDF documents by text content.

    Extracts text from both files and computes a diff showing additions,
    deletions, and an overall similarity score.

    Args:
        file1: The first (original) PDF file.
        file2: The second (modified) PDF file.

    Returns:
        JSONResponse with PdfDiffResponse containing the comparison.
    """
    try:
        file1_content = await validate_pdf_upload(file1)
        file2_content = await validate_pdf_upload(file2)
        safe_name1 = re.sub(r'[^\x20-\x7E]', '?', file1.filename or 'unknown')
        safe_name2 = re.sub(r'[^\x20-\x7E]', '?', file2.filename or 'unknown')
        logger.info("PDF comparison started: file1=%s, file2=%s", safe_name1, safe_name2)

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            file1_path = tmp_path / "file1.pdf"
            file2_path = tmp_path / "file2.pdf"

            with open(file1_path, "wb") as f:
                f.write(file1_content)
            with open(file2_path, "wb") as f:
                f.write(file2_content)

            result = await PdfDiffService.compare_pdfs(file1_path, file2_path)

        response = PdfDiffResponse(**result)
        return JSONResponse(content=response.model_dump())

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except ConversionError as e:
        raise handle_docuconversion_error(e) from e


@router.post("/flatten", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def flatten_pdf(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Flatten a PDF by baking annotations into page content.

    Renders each page as an image and rebuilds the PDF, effectively
    removing all interactive annotation layers. The result is tracked
    via the standard job system.

    Args:
        file: The PDF file to flatten (multipart upload).

    Returns:
        ProcessingResponse with job ID and download URL on success.
    """
    try:
        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info("PDF flatten started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Flattening PDF...")

            await PdfDiffService.flatten_pdf(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"advanced/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="PDF flattened successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/batch", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def batch_process(
    request: Request,
    files: list[UploadFile] = File(...),
    operation: str = Form(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Process multiple PDF files in a batch operation.

    Applies the specified operation to each uploaded file and returns
    the results bundled in a ZIP archive. Supported operations are
    'compress' and 'flatten'.

    Args:
        files: List of PDF files to process (max 10).
        operation: The operation to apply — 'compress' or 'flatten'.

    Returns:
        ProcessingResponse with job ID and download URL for the ZIP.
    """
    try:
        if operation not in _BATCH_OPERATIONS:
            raise FileValidationError(
                f"Unsupported batch operation '{operation}'. "
                f"Supported operations: {', '.join(sorted(_BATCH_OPERATIONS))}"
            )

        if len(files) > _MAX_BATCH_FILES:
            raise FileValidationError(
                f"Too many files ({len(files)}). "
                f"Maximum {_MAX_BATCH_FILES} files per batch."
            )

        if len(files) == 0:
            raise FileValidationError("At least one file is required.")

        # Validate all files first
        file_contents: list[tuple[str, bytes]] = []
        for upload_file in files:
            content = await validate_pdf_upload(upload_file)
            file_contents.append((upload_file.filename or "document.pdf", content))

        job_id, _client_token = job_manager.create_job(
            f"batch_{operation}_{len(files)}_files",
            user_id=user.user_id if user else None,
        )
        logger.info(
            "Batch %s started: job_id=%s, %d files",
            operation, job_id, len(files),
        )

        job_manager.update_progress(job_id, 10, "Validating files...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            output_zip_path = tmp_path / "batch_result.zip"
            results_dir = tmp_path / "results"
            results_dir.mkdir()

            total_files = len(file_contents)

            for i, (filename, content) in enumerate(file_contents):
                progress = 10 + int((i / total_files) * 60)
                job_manager.update_progress(
                    job_id, progress,
                    f"Processing file {i + 1} of {total_files}...",
                )

                input_path = tmp_path / f"input_{i}.pdf"
                safe_stem = Path(filename).stem
                # Include index to prevent filename collisions when multiple
                # uploads share the same name (e.g., two files named "report.pdf")
                output_path = results_dir / f"{i + 1}_{safe_stem}_{operation}.pdf"

                with open(input_path, "wb") as f:
                    f.write(content)

                if operation == "flatten":
                    await PdfDiffService.flatten_pdf(input_path, output_path)
                elif operation == "compress":
                    await _compress_pdf(input_path, output_path)

            # Bundle results into ZIP
            job_manager.update_progress(job_id, 75, "Creating ZIP archive...")

            with zipfile.ZipFile(str(output_zip_path), "w", zipfile.ZIP_DEFLATED) as zf:
                for result_file in sorted(results_dir.iterdir()):
                    zf.write(str(result_file), result_file.name)

            job_manager.update_progress(job_id, 85, "Uploading result...")

            storage = get_storage()
            r2_key = f"advanced/{job_id}/batch_result.zip"
            await storage.upload_local_file(output_zip_path, r2_key, "application/zip")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message=f"Batch {operation} complete. {total_files} files processed.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


async def _compress_pdf(input_path: Path, output_path: Path) -> Path:
    """Compress a PDF using PyMuPDF's garbage collection and deflation.

    Args:
        input_path: Path to the source PDF.
        output_path: Path for the compressed output.

    Returns:
        Path to the compressed PDF file.

    Raises:
        ConversionError: If compression fails.
    """
    try:
        def _do_compress() -> None:
            with fitz.open(str(input_path)) as doc:
                doc.save(
                    str(output_path),
                    garbage=4,
                    deflate=True,
                    clean=True,
                )

        await asyncio.to_thread(_do_compress)
        return output_path

    except Exception as e:
        logger.error("Batch compress failed: %s", str(e))
        raise ConversionError(
            "Failed to compress PDF. The file may be corrupted."
        ) from e
