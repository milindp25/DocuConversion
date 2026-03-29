"""
PDF editing API endpoints.

Handles operations that modify PDF content: adding text annotations,
watermarks, page numbers, highlights, and geometric shapes. Each
endpoint validates the upload, tracks the job, processes via
EditingService, uploads to R2, and returns a ProcessingResponse.
"""

import json
import logging
import re
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from app.core.auth import UserClaims
from app.core.dependencies import get_optional_user
from app.core.exceptions import (
    EditingError,
    FileValidationError,
    StorageError,
    handle_docuconversion_error,
)
from app.models.schemas import (
    HighlightAnnotation,
    JobStatus,
    ProcessingResponse,
    ShapeAnnotation,
    TextAnnotation,
    WatermarkRequest,
    PageNumbersRequest,
)
from app.services.editor import EditingService
from app.services.job_manager import job_manager
from app.services.storage import get_storage
from app.utils.file_validation import validate_pdf_upload

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/add-text", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def add_text_to_pdf(
    request: Request,
    file: UploadFile = File(...),
    annotations: str = Form(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Add text annotations to a PDF document at specified coordinates.

    The annotations parameter is a JSON string containing an array of
    TextAnnotation objects with page, position, content, and styling.

    Args:
        file: The PDF file to annotate (multipart upload).
        annotations: JSON string array of TextAnnotation objects.

    Returns:
        ProcessingResponse with job ID and status.
    """
    try:
        # Parse and validate annotations JSON
        try:
            annot_list = json.loads(annotations)
        except json.JSONDecodeError as e:
            raise FileValidationError(
                "Invalid annotations JSON. Please provide a valid JSON array."
            ) from e

        if len(annot_list) > 500:
            raise FileValidationError("Maximum 500 annotations allowed per request.")

        validated = [TextAnnotation(**a).model_dump() for a in annot_list]

        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info("Add text started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Adding text annotations...")

            await EditingService.add_text(input_path, output_path, validated)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"edits/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Text annotations added to the PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (EditingError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/add-watermark", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def add_watermark(
    request: Request,
    file: UploadFile = File(...),
    text: str = Form(...),
    opacity: float = Form(0.3),
    position: str = Form("center"),
    font_size: int = Form(60),
    color: str = Form("#808080"),
    rotation: float = Form(-45),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Add a text watermark to every page of a PDF.

    Supports customizable opacity, position, rotation, font size, and color.

    Args:
        file: The PDF file to watermark (multipart upload).
        text: Watermark text to display.
        opacity: Transparency level (0.05 to 1.0).
        position: Named position on the page.
        font_size: Font size in points.
        color: Hex color string.
        rotation: Rotation angle in degrees.

    Returns:
        ProcessingResponse with job ID and status.
    """
    try:
        # Validate parameters via Pydantic
        params = WatermarkRequest(
            text=text,
            opacity=opacity,
            position=position,
            font_size=font_size,
            color=color,
            rotation=rotation,
        )

        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info("Add watermark started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Adding watermark...")

            await EditingService.add_watermark(
                input_path,
                output_path,
                text=params.text,
                opacity=params.opacity,
                position=params.position,
                font_size=params.font_size,
                color=params.color,
                rotation=params.rotation,
            )

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"edits/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Watermark added to the PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (EditingError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/add-page-numbers", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def add_page_numbers(
    request: Request,
    file: UploadFile = File(...),
    position: str = Form("bottom-center"),
    start_number: int = Form(1),
    font_size: int = Form(12),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Add page numbers to every page of a PDF.

    Numbers are placed at the specified position starting from the
    given start number.

    Args:
        file: The PDF file to number (multipart upload).
        position: Named position for the page number.
        start_number: First page number.
        font_size: Font size for the numbers.

    Returns:
        ProcessingResponse with job ID and status.
    """
    try:
        # Validate parameters via Pydantic
        params = PageNumbersRequest(
            position=position,
            start_number=start_number,
            font_size=font_size,
        )

        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info("Add page numbers started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Adding page numbers...")

            await EditingService.add_page_numbers(
                input_path,
                output_path,
                position=params.position,
                start_number=params.start_number,
                font_size=params.font_size,
            )

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"edits/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Page numbers added to the PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (EditingError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/add-highlight", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def add_highlight(
    request: Request,
    file: UploadFile = File(...),
    annotations: str = Form(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Add highlight annotations (colored rectangles) to a PDF.

    The annotations parameter is a JSON string containing an array of
    HighlightAnnotation objects.

    Args:
        file: The PDF file to highlight (multipart upload).
        annotations: JSON string array of HighlightAnnotation objects.

    Returns:
        ProcessingResponse with job ID and status.
    """
    try:
        try:
            annot_list = json.loads(annotations)
        except json.JSONDecodeError as e:
            raise FileValidationError(
                "Invalid annotations JSON. Please provide a valid JSON array."
            ) from e

        if len(annot_list) > 500:
            raise FileValidationError("Maximum 500 annotations allowed per request.")

        validated = [HighlightAnnotation(**a).model_dump() for a in annot_list]

        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info("Add highlight started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Adding highlights...")

            await EditingService.add_highlight(input_path, output_path, validated)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"edits/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Highlights added to the PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (EditingError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/add-shapes", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def add_shapes(
    request: Request,
    file: UploadFile = File(...),
    shapes: str = Form(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Add geometric shapes (rectangles, circles, lines, arrows) to a PDF.

    The shapes parameter is a JSON string containing an array of
    ShapeAnnotation objects.

    Args:
        file: The PDF file to modify (multipart upload).
        shapes: JSON string array of ShapeAnnotation objects.

    Returns:
        ProcessingResponse with job ID and status.
    """
    try:
        try:
            shapes_list = json.loads(shapes)
        except json.JSONDecodeError as e:
            raise FileValidationError(
                "Invalid shapes JSON. Please provide a valid JSON array."
            ) from e

        if len(shapes_list) > 500:
            raise FileValidationError("Maximum 500 annotations allowed per request.")

        validated = [ShapeAnnotation(**s).model_dump() for s in shapes_list]

        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info("Add shapes started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Adding shapes...")

            await EditingService.add_shapes(input_path, output_path, validated)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"edits/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Shapes added to the PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (EditingError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e
