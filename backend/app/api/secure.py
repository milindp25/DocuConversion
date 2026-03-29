"""
PDF security API endpoints.

Handles password protection (encryption) and unlocking (decryption)
of PDF documents. Uses SecurityService with AES-256 encryption via PyMuPDF.
"""

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
    FileValidationError,
    SecurityError,
    StorageError,
    handle_docuconversion_error,
)
from app.models.schemas import JobStatus, ProcessingResponse
from app.services.job_manager import job_manager
from app.services.security import SecurityService
from app.services.storage import get_storage
from app.utils.file_validation import validate_pdf_upload

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/protect", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def protect_pdf(
    request: Request,
    file: UploadFile = File(...),
    user_password: str = Form(..., min_length=1, max_length=128),
    owner_password: str | None = Form(None, max_length=128),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Add password protection to a PDF document.

    Sets a user password (required to open the document) and optionally
    an owner password (required for full editing access). Uses AES-256
    encryption for strong security.

    Args:
        file: The PDF file to protect (multipart upload).
        user_password: Password required to open the document.
        owner_password: Password for full access. Defaults to user_password.

    Returns:
        ProcessingResponse with job ID and status.
    """
    try:
        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info(
            "Protect PDF started: job_id=%s, file=%s", job_id, safe_name
        )

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Encrypting PDF...")

            await SecurityService.protect_pdf(
                input_path,
                output_path,
                user_password=user_password,
                owner_password=owner_password,
            )

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"security/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="PDF protected with password successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (SecurityError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/unlock", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def unlock_pdf(
    request: Request,
    file: UploadFile = File(...),
    password: str = Form(..., min_length=1, max_length=128),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """Remove password protection from a PDF document.

    Opens the encrypted PDF with the provided password and saves
    an unprotected copy. The password must be correct for the
    operation to succeed.

    Args:
        file: The encrypted PDF file (multipart upload).
        password: The password to decrypt the document.

    Returns:
        ProcessingResponse with job ID and status.
    """
    try:
        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info(
            "Unlock PDF started: job_id=%s, file=%s", job_id, safe_name
        )

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Decrypting PDF...")

            await SecurityService.unlock_pdf(
                input_path,
                output_path,
                password=password,
            )

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"security/{job_id}/output.pdf"
            await storage.upload_local_file(output_path, r2_key, "application/pdf")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="PDF unlocked successfully.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (SecurityError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e


@router.post("/redact", response_model=ProcessingResponse)
async def redact_content() -> ProcessingResponse:
    """Permanently redact sensitive content from a PDF.

    Removes text, images, or annotations from specified areas.
    This operation is irreversible -- redacted content cannot be recovered.

    Returns:
        ProcessingResponse indicating this feature is not yet available.
    """
    # Phase 2: Requires redaction annotation support
    return ProcessingResponse(
        job_id="pending",
        status=JobStatus.FAILED,
        message="PDF content redaction is not yet available. Coming in Phase 2.",
    )
