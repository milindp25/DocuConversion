"""
Developer API key management endpoints.

Provides CRUD operations for API keys that enable programmatic access
to the DocuConversion API. All endpoints require authentication.
"""

import logging

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from app.core.auth import UserClaims
from app.core.dependencies import get_current_user
from app.core.exceptions import (
    AuthenticationError,
    handle_docuconversion_error,
)
from app.models.schemas import ApiKeyListResponse, ApiKeyResponse, ApiUsageResponse
from app.services.api_key_service import api_key_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/keys")
@limiter.limit("10/minute")
async def create_api_key(
    request: Request,
    name: str = Form(...),
    user: UserClaims = Depends(get_current_user),
) -> JSONResponse:
    """Create a new API key for programmatic access.

    The API key is shown only once in the response. It cannot be
    retrieved again after creation — the user must store it securely.

    Args:
        name: A human-readable name for identifying the key.

    Returns:
        JSONResponse with ApiKeyResponse containing the new key.
    """
    try:
        record = api_key_service.create_key(user.user_id, name)

        response = ApiKeyResponse(
            key=record.key,
            name=record.name,
            created_at=record.created_at.isoformat(),
        )
        logger.info("API key created: name=%s, user=%s", name, user.user_id)
        return JSONResponse(content=response.model_dump())

    except AuthenticationError as e:
        raise handle_docuconversion_error(e) from e


@router.get("/keys")
@limiter.limit("10/minute")
async def list_api_keys(
    request: Request,
    user: UserClaims = Depends(get_current_user),
) -> JSONResponse:
    """List all API keys for the authenticated user.

    Returns all keys including revoked ones. The key string is masked
    in list responses for security — only the first 8 characters are shown.

    Returns:
        JSONResponse with ApiKeyListResponse.
    """
    records = api_key_service.list_keys(user.user_id)

    keys = [
        ApiKeyResponse(
            key=f"{record.key[:8]}...",  # Mask key in list
            name=record.name,
            created_at=record.created_at.isoformat(),
        )
        for record in records
    ]

    response = ApiKeyListResponse(keys=keys)
    return JSONResponse(content=response.model_dump())


@router.delete("/keys/{key}")
@limiter.limit("10/minute")
async def revoke_api_key(
    request: Request,
    key: str,
    user: UserClaims = Depends(get_current_user),
) -> JSONResponse:
    """Revoke an API key.

    Once revoked, the key can no longer be used for API access.
    This action cannot be undone.

    Args:
        key: The API key string to revoke.

    Returns:
        JSONResponse confirming the revocation.
    """
    success = api_key_service.revoke_key(key, user.user_id)

    if not success:
        raise handle_docuconversion_error(
            AuthenticationError("API key not found or you do not have permission to revoke it.")
        )

    logger.info("API key revoked: user=%s", user.user_id)
    return JSONResponse(content={"message": "API key revoked successfully."})


@router.get("/usage/{key}")
@limiter.limit("10/minute")
async def get_api_key_usage(
    request: Request,
    key: str,
    user: UserClaims = Depends(get_current_user),
) -> JSONResponse:
    """Get usage statistics for an API key.

    Returns the number of requests made today and the daily limit.

    Args:
        key: The API key string to check usage for.

    Returns:
        JSONResponse with ApiUsageResponse.
    """
    record = api_key_service.get_usage(key, user.user_id)

    if record is None:
        raise handle_docuconversion_error(
            AuthenticationError("API key not found or you do not have permission to view it.")
        )

    response = ApiUsageResponse(
        key_name=record.name,
        requests_today=record.requests_today,
        daily_limit=1000,
    )
    return JSONResponse(content=response.model_dump())
