"""
Shareable link endpoints.

Provides creation of time-limited download links and access to shared
files via unique tokens. Uses rate limiting and optional authentication.
"""

import logging
import re
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import JSONResponse, RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from app.core.auth import UserClaims
from app.core.config import settings
from app.core.dependencies import get_optional_user
from app.core.exceptions import (
    FileValidationError,
    ShareError,
    StorageError,
    handle_docuconversion_error,
)
from app.models.schemas import ShareLinkInfoResponse, ShareLinkResponse
from app.services.share_service import share_service
from app.services.storage import get_storage
from app.utils.file_validation import validate_pdf_upload

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create-link")
@limiter.limit("10/minute")
async def create_share_link(
    request: Request,
    file: UploadFile = File(...),
    ttl_hours: int = Form(default=24),
    user: UserClaims | None = Depends(get_optional_user),
) -> JSONResponse:
    """Create a shareable download link for a PDF file.

    Uploads the file to storage and creates a time-limited link
    that can be shared with others for downloading.

    Args:
        file: The PDF file to share (multipart upload).
        ttl_hours: How many hours the link should remain valid (1-72).

    Returns:
        JSONResponse with ShareLinkResponse containing the share URL.
    """
    try:
        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        logger.info("Share link creation started: file=%s, ttl=%dh", safe_name, ttl_hours)

        # Upload file to storage
        storage = get_storage()
        import uuid

        # Sanitize filename to prevent path traversal in storage keys
        raw_name = file.filename or "document.pdf"
        safe_filename = Path(raw_name).name  # Strips directory components
        safe_filename = re.sub(r'[^\w.\-]', '_', safe_filename) or "document.pdf"
        storage_key = f"shared/{uuid.uuid4()}/{safe_filename}"
        await storage.upload_file(file_content, storage_key, "application/pdf")

        # Create share record
        record = share_service.create_link(
            storage_key=storage_key,
            filename=file.filename or "document.pdf",
            ttl_hours=ttl_hours,
        )

        share_url = f"{settings.share_link_base_url}/{record.token}"

        response = ShareLinkResponse(
            token=record.token,
            url=share_url,
            expires_at=record.expires_at.isoformat(),
            filename=record.filename,
        )
        return JSONResponse(content=response.model_dump())

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (ShareError, StorageError) as e:
        raise handle_docuconversion_error(e) from e


@router.get("/{token}")
@limiter.limit("10/minute")
async def access_share_link(
    request: Request,
    token: str,
) -> RedirectResponse:
    """Access a shared file via its unique token.

    Looks up the share link and redirects to the file's download URL.
    Increments the download counter on each access.

    Args:
        token: The unique share link token.

    Returns:
        RedirectResponse to the file's download URL.

    Raises:
        HTTPException: 404 if the link is not found or expired.
    """
    record = share_service.get_link(token)
    if record is None:
        raise handle_docuconversion_error(
            ShareError("Share link not found or has expired.")
        )

    try:
        storage = get_storage()
        download_url = await storage.generate_download_url(record.storage_key)
        return RedirectResponse(url=download_url)
    except StorageError as e:
        raise handle_docuconversion_error(e) from e


@router.get("/{token}/info")
@limiter.limit("10/minute")
async def get_share_link_info(
    request: Request,
    token: str,
) -> JSONResponse:
    """Get metadata about a share link without downloading.

    Returns information about the shared file including its filename,
    expiration time, download count, and whether it has expired.

    Args:
        token: The unique share link token.

    Returns:
        JSONResponse with ShareLinkInfoResponse.

    Raises:
        HTTPException: 404 if the link is not found.
    """
    record = share_service.get_link_info(token)
    if record is None:
        raise handle_docuconversion_error(
            ShareError("Share link not found.")
        )

    response = ShareLinkInfoResponse(
        filename=record.filename,
        expires_at=record.expires_at.isoformat(),
        download_count=record.download_count,
        is_expired=record.is_expired,
    )
    return JSONResponse(content=response.model_dump())
