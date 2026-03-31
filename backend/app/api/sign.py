"""
E-signature API endpoints.

Handles electronic signature operations: placing uploaded signature
images onto PDF documents at specified coordinates, and generating
signature images from text. Accepts both the PDF and signature image
as separate multipart uploads for placement.
"""

import logging
import re
import tempfile
from pathlib import Path

import fitz  # PyMuPDF
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from app.core.auth import UserClaims
from app.core.dependencies import get_optional_user
from app.core.exceptions import (
    FileValidationError,
    SignatureError,
    StorageError,
    handle_docuconversion_error,
)
from app.models.schemas import JobStatus, ProcessingResponse, SignatureRequest
from app.services.job_manager import job_manager
from app.services.signer import SignatureService
from app.services.storage import get_storage
from app.utils.file_validation import validate_file_extension, validate_upload_file

logger = logging.getLogger(__name__)
router = APIRouter()

PDF_EXTENSIONS = [".pdf"]
IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"]


@router.post("/apply", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def apply_signature(
    request: Request,
    file: UploadFile = File(...),
    signature: UploadFile = File(...),
    page: int = Form(1),
    x: float = Form(0.6),
    y: float = Form(0.8),
    width: float = Form(0.2),
    height: float = Form(0.1),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Apply a signature image to a PDF page.

    Accepts both the PDF document and the signature image as separate
    multipart file uploads. The signature is overlaid at the specified
    normalized coordinates, which are converted to absolute points
    based on the target page dimensions.

    Args:
        file: The PDF file to sign (multipart upload).
        signature: The signature image file (PNG recommended for transparency).
        page: Target page number (1-indexed).
        x: Horizontal position (0-1 normalized).
        y: Vertical position (0-1 normalized).
        width: Signature width (0-1 normalized).
        height: Signature height (0-1 normalized).

    Returns:
        ProcessingResponse with job ID and status.
    """
    try:
        # Validate parameters via Pydantic
        params = SignatureRequest(
            page=page, x=x, y=y, width=width, height=height
        )

        # Validate PDF upload
        validate_file_extension(file.filename or "", PDF_EXTENSIONS)
        pdf_content = await validate_upload_file(file)

        # Validate signature image upload
        validate_file_extension(signature.filename or "", IMAGE_EXTENSIONS)
        sig_content = await validate_upload_file(signature)

        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        safe_sig_name = re.sub(r'[^\x20-\x7E]', '?', signature.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info(
            "Apply signature started: job_id=%s, pdf=%s, sig=%s",
            job_id,
            safe_name,
            safe_sig_name,
        )

        job_manager.update_progress(job_id, 10, "Validating files...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            sig_path = tmp_path / f"signature{Path(signature.filename or 'sig.png').suffix.lower()}"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(pdf_content)
            with open(sig_path, "wb") as f:
                f.write(sig_content)

            job_manager.update_progress(job_id, 30, "Applying signature...")

            # Convert normalized coordinates to absolute points.
            # SignatureService expects absolute coordinates, so we read
            # page dimensions first.
            with fitz.open(str(input_path)) as doc:
                if params.page < 1 or params.page > len(doc):
                    raise SignatureError(
                        f"Page {params.page} is out of range. "
                        f"The document has {len(doc)} pages."
                    )
                target_page = doc[params.page - 1]
                page_width = target_page.rect.width
                page_height = target_page.rect.height

            abs_x = params.x * page_width
            abs_y = params.y * page_height
            abs_w = params.width * page_width
            abs_h = params.height * page_height

            await SignatureService.apply_signature(
                pdf_path=input_path,
                signature_image_path=sig_path,
                page=params.page - 1,  # Service expects 0-indexed
                x=abs_x,
                y=abs_y,
                width=abs_w,
                height=abs_h,
                output_path=output_path,
            )

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"signatures/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Signature applied to the PDF successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (SignatureError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/generate-signature", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def generate_text_signature(
    request: Request,
    text: str = Form(...),
    font_style: str = Form(default="cursive"),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Generate a signature image from text.

    Renders the provided text in a calligraphic/script style and
    returns a transparent PNG image. The generated image can then
    be used with the ``/apply`` endpoint to place it on a PDF.

    Args:
        request: The incoming HTTP request (required for rate limiting).
        text: The signature text to render (e.g. a person's name).
        font_style: Visual style -- ``"cursive"``, ``"formal"``, or
            ``"casual"``.

    Returns:
        ProcessingResponse with job ID and download URL for the PNG.
    """
    try:
        if not text or not text.strip():
            raise FileValidationError(
                "Signature text must not be empty."
            )

        if len(text) > 200:
            raise FileValidationError(
                "Signature text must be 200 characters or fewer."
            )

        valid_styles = ("cursive", "formal", "casual")
        if font_style not in valid_styles:
            raise FileValidationError(
                f"Invalid font style '{font_style}'. "
                f"Choose from: {', '.join(valid_styles)}."
            )

        job_id, _client_token = job_manager.create_job(
            "text_signature.png",
            user_id=user.user_id if user else None,
        )
        logger.info(
            "Generate text signature started: job_id=%s, style=%s",
            job_id, font_style,
        )

        job_manager.update_progress(job_id, 10, "Generating signature...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            output_path = tmp_path / "signature.png"

            job_manager.update_progress(job_id, 30, "Rendering text...")

            await SignatureService.generate_text_signature(
                text=text.strip(),
                output_path=output_path,
                font_style=font_style,
            )

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"signatures/{job_id}/signature.png"
            await storage.upload_local_file(output_path, r2_key, "image/png")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="Signature image generated successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (SignatureError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e
