"""
PDF organization API endpoints.

Handles structural operations: merge, split, compress, rotate, reorder,
add pages, and remove pages. These operations manipulate pages without
changing page content. All endpoints perform end-to-end processing with
job tracking and R2 upload.
"""

import json as json_module
import logging
import re
import tempfile
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from app.core.auth import UserClaims
from app.core.dependencies import get_optional_user
from app.core.exceptions import (
    FileValidationError,
    OrganizationError,
    StorageError,
    handle_docuconversion_error,
)
from app.models.schemas import JobStatus, ProcessingResponse
from app.services.job_manager import job_manager
from app.services.organizer import OrganizationService
from app.services.storage import get_storage
from app.utils.file_validation import validate_file_extension, validate_upload_file

logger = logging.getLogger(__name__)
router = APIRouter()


def _parse_page_ranges(pages_str: str) -> list[tuple[int, int]]:
    """Parse a page range string into a list of (start, end) tuples.

    Accepts formats like '1-3', '1-3,5-7', '1,3,5'. Page numbers are
    converted from 1-indexed (user-facing) to 0-indexed (internal).

    Args:
        pages_str: Comma-separated page ranges (e.g. '1-3,5-7').

    Returns:
        List of (start, end) tuples, 0-indexed and inclusive.

    Raises:
        ValueError: If the format is invalid.
    """
    ranges: list[tuple[int, int]] = []
    for part in pages_str.split(","):
        part = part.strip()
        if "-" in part:
            start_str, end_str = part.split("-", 1)
            start = int(start_str.strip()) - 1
            end = int(end_str.strip()) - 1
        else:
            page = int(part) - 1
            start = end = page

        if start < 0 or end < start:
            raise ValueError(f"Invalid page range: {part}")

        ranges.append((start, end))
    return ranges


@router.post("/merge", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def merge_pdfs(
    request: Request,
    files: list[UploadFile] = File(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Merge multiple PDF files into a single document.

    Files are merged in the order they are received. The resulting PDF
    contains all pages from all input files concatenated sequentially.

    Args:
        request: The incoming HTTP request (required for rate limiting).
        files: List of PDF files to merge (multipart upload).

    Returns:
        ProcessingResponse with job ID and download URL on success.
    """
    try:
        if len(files) < 2:
            raise FileValidationError("At least 2 PDF files are required for merging.")
        if len(files) > 20:
            raise FileValidationError("Maximum 20 files allowed for merging.")

        # Validate all files first
        file_contents: list[bytes] = []
        for f in files:
            validate_file_extension(f.filename or "", [".pdf"])
            content = await validate_upload_file(f)
            file_contents.append(content)

        job_id, _client_token = job_manager.create_job(
            f"merge_{len(files)}_files",
            user_id=user.user_id if user else None,
        )
        logger.info("Merge started: job_id=%s, file_count=%d", job_id, len(files))

        job_manager.update_progress(job_id, 10, "Validating files...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_paths: list[Path] = []

            for idx, content in enumerate(file_contents):
                input_path = tmp_path / f"input_{idx}.pdf"
                with open(input_path, "wb") as f_out:
                    f_out.write(content)
                input_paths.append(input_path)

            output_path = tmp_path / "merged.pdf"

            job_manager.update_progress(job_id, 30, "Merging PDFs...")

            await OrganizationService.merge_pdfs(input_paths, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"organize/{job_id}/merged.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message=f"Successfully merged {len(files)} PDF files.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (OrganizationError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/split", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def split_pdf(
    request: Request,
    file: UploadFile = File(...),
    pages: str = Form(default=""),
    mode: str = Form(default="each"),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Split a PDF into multiple smaller documents.

    Supports splitting by page range or extracting each page as a
    separate PDF file. Results are bundled into a ZIP archive.

    Args:
        file: The PDF file to split (multipart upload).
        pages: Page ranges for 'range' mode (e.g. '1-3,5-7'). Ignored for 'each'.
        mode: Split mode -- 'range' (by page range) or 'each' (each page separate).

    Returns:
        ProcessingResponse with job ID and download URL on success.
    """
    try:
        validate_file_extension(file.filename or "", [".pdf"])
        file_content = await validate_upload_file(file)

        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info("Split started: job_id=%s, file=%s, mode=%s", job_id, safe_name, mode)

        job_manager.update_progress(job_id, 10, "Validating file...")

        # Parse page ranges if provided
        page_ranges: list[tuple[int, int]] | None = None
        if mode == "range" and pages.strip():
            try:
                page_ranges = _parse_page_ranges(pages)
            except ValueError as ve:
                raise FileValidationError(
                    f"Invalid page range format: {pages}. "
                    "Use formats like '1-3', '1-3,5-7', or '1,3,5'."
                ) from ve

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            split_dir = tmp_path / "split_output"
            split_dir.mkdir()

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Splitting PDF...")

            split_paths = await OrganizationService.split_pdf(
                input_path, split_dir, page_ranges
            )

            job_manager.update_progress(job_id, 60, "Creating ZIP archive...")

            # Bundle split files into a ZIP
            zip_path = tmp_path / "split_result.zip"
            with zipfile.ZipFile(str(zip_path), "w", zipfile.ZIP_DEFLATED) as zf:
                for split_file in split_paths:
                    zf.write(str(split_file), split_file.name)

            job_manager.update_progress(job_id, 80, "Uploading result...")

            storage = get_storage()
            r2_key = f"organize/{job_id}/split_result.zip"
            await storage.upload_local_file(zip_path, r2_key, "application/zip")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message=f"PDF split into {len(split_paths)} parts successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (OrganizationError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/compress", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def compress_pdf(
    request: Request,
    file: UploadFile = File(...),
    level: str = Form(default="recommended"),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Compress a PDF to reduce its file size.

    Reduces size by optimizing images, removing unused objects, and
    compressing streams.

    Args:
        file: The PDF file to compress (multipart upload).
        level: Compression level -- 'low' (best quality), 'recommended'
            (balanced), or 'high' (smallest size).

    Returns:
        ProcessingResponse with job ID and download URL on success.
    """
    try:
        validate_file_extension(file.filename or "", [".pdf"])
        file_content = await validate_upload_file(file)

        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info("Compress started: job_id=%s, file=%s, level=%s", job_id, safe_name, level)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "compressed.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Compressing PDF...")

            result = await OrganizationService.compress_pdf(
                input_path, output_path, quality=level
            )

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"organize/{job_id}/compressed.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        original_kb = result["original_size_kb"]
        compressed_kb = result["compressed_size_kb"]
        reduction = result["reduction_percent"]

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message=(
                f"PDF compressed successfully. "
                f"{original_kb} KB → {compressed_kb} KB "
                f"({reduction}% reduction)."
            ),
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (OrganizationError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/rotate", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def rotate_pdf_pages(
    request: Request,
    file: UploadFile = File(...),
    rotation: int = Form(default=90),
    pages: str = Form(default="all"),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Rotate specific pages of a PDF by 90, 180, or 270 degrees.

    Args:
        request: The incoming HTTP request (required for rate limiting).
        file: The PDF file to rotate (multipart upload).
        rotation: Degrees to rotate -- 90, 180, or 270.
        pages: "all" or comma-separated 1-indexed page numbers (e.g. "1,3,5").

    Returns:
        ProcessingResponse with job ID and download URL on success.
    """
    try:
        validate_file_extension(file.filename or "", [".pdf"])
        file_content = await validate_upload_file(file)

        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info(
            "Rotate started: job_id=%s, file=%s, rotation=%d, pages=%s",
            job_id, safe_name, rotation, pages,
        )

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "rotated.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Rotating pages...")

            await OrganizationService.rotate_pages(
                input_path, output_path, rotation=rotation, pages=pages,
            )

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"organize/{job_id}/rotated.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="PDF pages rotated successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (OrganizationError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/reorder", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def reorder_pages(
    request: Request,
    file: UploadFile = File(...),
    page_order: str = Form(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Reorder pages within a PDF based on a new page sequence.

    Args:
        file: The PDF file to reorder (multipart upload).
        page_order: JSON array of 1-indexed page numbers in desired order,
                    e.g. ``[3, 1, 2]`` puts page 3 first.
    """
    try:
        validate_file_extension(file.filename or "", [".pdf"])
        file_content = await validate_upload_file(file)

        # Parse page order from JSON string
        try:
            order = json_module.loads(page_order)
            if not isinstance(order, list) or not all(isinstance(p, int) for p in order):
                raise ValueError("page_order must be a JSON array of integers")
        except (json_module.JSONDecodeError, ValueError) as e:
            raise FileValidationError(str(e)) from e

        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "reordered.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Reordering pages...")

            await OrganizationService.reorder_pages(input_path, output_path, order)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"organize/{job_id}/reordered.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message=f"PDF pages reordered successfully ({len(order)} pages).",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (OrganizationError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/remove-pages", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def remove_pages_from_pdf(
    request: Request,
    file: UploadFile = File(...),
    pages: str = Form(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Remove specified pages from a PDF document.

    Args:
        request: The incoming HTTP request (required for rate limiting).
        file: The PDF file to modify (multipart upload).
        pages: JSON array of 1-indexed page numbers to remove,
               e.g. ``[1, 3, 5]``.

    Returns:
        ProcessingResponse with job ID and download URL on success.
    """
    try:
        validate_file_extension(file.filename or "", [".pdf"])
        file_content = await validate_upload_file(file)

        # Parse pages from JSON string
        try:
            pages_list = json_module.loads(pages)
            if not isinstance(pages_list, list) or not all(
                isinstance(p, int) for p in pages_list
            ):
                raise ValueError("pages must be a JSON array of integers")
        except (json_module.JSONDecodeError, ValueError) as e:
            raise FileValidationError(
                f"Invalid pages format: {e}. "
                "Provide a JSON array of page numbers, e.g. [1, 3, 5]."
            ) from e

        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info(
            "Remove pages started: job_id=%s, file=%s, pages=%s",
            job_id, safe_name, pages_list,
        )

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "pages_removed.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Removing pages...")

            await OrganizationService.remove_pages(
                input_path, output_path, pages_list
            )

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"organize/{job_id}/pages_removed.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message=f"Successfully removed {len(pages_list)} page(s) from the PDF.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (OrganizationError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/add-pages", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def add_pages_to_pdf(
    request: Request,
    file: UploadFile = File(...),
    insert_file: UploadFile = File(...),
    after_page: int = Form(default=0),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Insert pages from one PDF into another at a specified position.

    Args:
        request: The incoming HTTP request (required for rate limiting).
        file: The main PDF file (multipart upload).
        insert_file: The PDF whose pages will be inserted (multipart upload).
        after_page: Insert after this page number (1-indexed).
                    Use 0 to insert at the beginning.

    Returns:
        ProcessingResponse with job ID and download URL on success.
    """
    try:
        validate_file_extension(file.filename or "", [".pdf"])
        file_content = await validate_upload_file(file)

        validate_file_extension(insert_file.filename or "", [".pdf"])
        insert_content = await validate_upload_file(insert_file)

        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info(
            "Add pages started: job_id=%s, file=%s, after_page=%d",
            job_id, safe_name, after_page,
        )

        job_manager.update_progress(job_id, 10, "Validating files...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            insert_path = tmp_path / "insert.pdf"
            output_path = tmp_path / "pages_added.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)
            with open(insert_path, "wb") as f:
                f.write(insert_content)

            job_manager.update_progress(job_id, 30, "Inserting pages...")

            await OrganizationService.add_pages(
                input_path, insert_path, output_path, after_page=after_page
            )

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"organize/{job_id}/pages_added.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message=f"Pages inserted successfully after page {after_page}.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (OrganizationError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e
