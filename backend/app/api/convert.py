"""
Conversion API endpoints.

Handles all document format conversion operations with end-to-end
processing: file validation, conversion via ConversionService,
upload to R2 via StorageService, and job tracking via JobManager.
"""

import logging
import re
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from app.core.auth import UserClaims
from app.core.dependencies import get_optional_user
from app.core.tier_middleware import check_tier_limit
from app.core.exceptions import (
    ConversionError,
    FileValidationError,
    StorageError,
    handle_docuconversion_error,
)
from app.models.schemas import JobStatus, ProcessingResponse
from app.services.converter import ConversionService
from app.services.job_manager import job_manager
from app.services.storage import get_storage
from app.utils.file_validation import (
    validate_file_extension,
    validate_pdf_upload,
    validate_upload_file,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Accepted input types per conversion direction
DOCUMENT_EXTENSIONS = [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"]
IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp"]


@router.post("/pdf-to-word", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def convert_pdf_to_word(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
    _tier_check: None = Depends(check_tier_limit),
) -> ProcessingResponse:
    """Convert a PDF document to Word (.docx) format.

    Extracts text from the PDF and produces an editable Word document.
    Processing is synchronous in Phase 1 but uses job tracking so the
    frontend pattern is ready for async in Phase 2.

    Args:
        file: The PDF file to convert (multipart upload).

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
        logger.info("PDF to Word conversion started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.docx"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Converting PDF to Word...")

            await ConversionService.pdf_to_word(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"conversions/{job_id}/output.docx"
            await storage.upload_local_file(output_path, r2_key, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="PDF converted to Word format successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/pdf-to-text", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def convert_pdf_to_text(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Convert a PDF document to plain text (.txt) format.

    Extracts all text content from the PDF and saves it as a UTF-8
    encoded text file.

    Args:
        file: The PDF file to convert (multipart upload).

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
        logger.info("PDF to Text conversion started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.txt"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Extracting text from PDF...")

            await ConversionService.pdf_to_text_file(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"conversions/{job_id}/output.txt"
            await storage.upload_local_file(output_path, r2_key, "text/plain")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="PDF converted to text format successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/pdf-to-excel", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def convert_pdf_to_excel(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
    _tier_check: None = Depends(check_tier_limit),
) -> ProcessingResponse:
    """Convert a PDF document to Excel (.xlsx) format.

    Detects and extracts tabular data from the PDF into spreadsheet cells.
    Uses PyMuPDF's table detection with fallback to line-by-line text extraction.

    Args:
        file: The PDF file to convert (multipart upload).

    Returns:
        ProcessingResponse with job ID for status tracking.
    """
    try:
        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info("PDF to Excel conversion started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.xlsx"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Extracting tables from PDF...")

            await ConversionService.pdf_to_excel(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"conversions/{job_id}/output.xlsx"
            await storage.upload_local_file(output_path, r2_key, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="PDF converted to Excel format successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/pdf-to-image", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def convert_pdf_to_image(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
    _tier_check: None = Depends(check_tier_limit),
) -> ProcessingResponse:
    """Convert PDF pages to high-quality PNG images bundled as a ZIP.

    Each page is rendered as a separate PNG file at 200 DPI.
    The result is a ZIP archive containing all page images.

    Args:
        file: The PDF file to convert (multipart upload).

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
        logger.info("PDF to Image conversion started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "pages.zip"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Rendering PDF pages as images...")

            await ConversionService.pdf_to_images_zip(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"conversions/{job_id}/pages.zip"
            await storage.upload_local_file(output_path, r2_key, "application/zip")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="PDF pages converted to images successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/word-to-pdf", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def convert_word_to_pdf(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Convert a Word document (.doc, .docx) to PDF format.

    Phase 1: Uses text extraction and ReportLab for basic conversion.
    Full fidelity conversion with LibreOffice will be available in Phase 2.

    Args:
        file: The Word document to convert (multipart upload).

    Returns:
        ProcessingResponse with job ID and download URL on success.
    """
    try:
        validate_file_extension(file.filename or "", DOCUMENT_EXTENSIONS[:2])
        file_content = await validate_upload_file(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.docx",
            user_id=user.user_id if user else None,
        )
        logger.info("Word to PDF conversion started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.docx"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Converting Word to PDF...")

            await ConversionService.word_to_pdf(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"conversions/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Word document converted to PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/image-to-pdf", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def convert_image_to_pdf(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Convert an image file (PNG, JPG, etc.) to PDF format.

    The image is embedded in a PDF page sized to match the image dimensions.

    Args:
        file: The image file to convert (multipart upload).

    Returns:
        ProcessingResponse with job ID and download URL on success.
    """
    try:
        validate_file_extension(file.filename or "", IMAGE_EXTENSIONS)
        file_content = await validate_upload_file(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "image.png",
            user_id=user.user_id if user else None,
        )
        logger.info("Image to PDF conversion started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            ext = Path(file.filename or "image.png").suffix.lower()
            input_path = tmp_path / f"input{ext}"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Converting image to PDF...")

            await ConversionService.image_to_pdf(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"conversions/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Image converted to PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/pdf-to-powerpoint", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def convert_pdf_to_powerpoint(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Convert a PDF document to PowerPoint (.pptx) format.

    Renders each page as a slide background image with extracted text
    placed in speaker notes for accessibility and searchability.

    Args:
        file: The PDF file to convert (multipart upload).

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
        logger.info("PDF to PowerPoint conversion started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.pptx"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Converting PDF to PowerPoint...")

            await ConversionService.pdf_to_powerpoint(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"conversions/{job_id}/output.pptx"
            await storage.upload_local_file(output_path, r2_key, "application/vnd.openxmlformats-officedocument.presentationml.presentation")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="PDF converted to PowerPoint format successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


EXCEL_EXTENSIONS = [".xls", ".xlsx"]
PPTX_EXTENSIONS = [".ppt", ".pptx"]
HTML_EXTENSIONS = [".html", ".htm"]


@router.post("/excel-to-pdf", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def convert_excel_to_pdf(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
    _tier_check: None = Depends(check_tier_limit),
) -> ProcessingResponse:
    """Convert an Excel workbook (.xlsx) to PDF format."""
    try:
        validate_file_extension(file.filename or "", EXCEL_EXTENSIONS)
        file_content = await validate_upload_file(file)
        job_id, _ = job_manager.create_job(
            file.filename or "workbook.xlsx",
            user_id=user.user_id if user else None,
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.xlsx"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Converting Excel to PDF...")
            await ConversionService.excel_to_pdf(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")
            storage = get_storage()
            r2_key = f"conversions/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")
            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Excel converted to PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/pptx-to-pdf", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def convert_pptx_to_pdf(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
    _tier_check: None = Depends(check_tier_limit),
) -> ProcessingResponse:
    """Convert a PowerPoint presentation (.pptx) to PDF format."""
    try:
        validate_file_extension(file.filename or "", PPTX_EXTENSIONS)
        file_content = await validate_upload_file(file)
        job_id, _ = job_manager.create_job(
            file.filename or "presentation.pptx",
            user_id=user.user_id if user else None,
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pptx"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Converting PowerPoint to PDF...")
            await ConversionService.pptx_to_pdf(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")
            storage = get_storage()
            r2_key = f"conversions/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")
            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="PowerPoint converted to PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/html-to-pdf", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def convert_html_to_pdf(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
    _tier_check: None = Depends(check_tier_limit),
) -> ProcessingResponse:
    """Convert an HTML file to PDF format."""
    try:
        validate_file_extension(file.filename or "", HTML_EXTENSIONS)
        file_content = await validate_upload_file(file)
        job_id, _ = job_manager.create_job(
            file.filename or "page.html",
            user_id=user.user_id if user else None,
        )

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.html"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Converting HTML to PDF...")
            await ConversionService.html_to_pdf(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")
            storage = get_storage()
            r2_key = f"conversions/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")
            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="HTML converted to PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ConversionError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e
