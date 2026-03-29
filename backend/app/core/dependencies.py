"""
FastAPI dependency injection functions for authentication.

These are used with FastAPI's Depends() system to inject user
information into endpoint handlers. Two flavors:
- get_current_user: Requires authentication (raises 401 if missing)
- get_optional_user: Allows anonymous access (returns None if no token)
"""

import logging

from fastapi import Request

from app.core.auth import UserClaims, decode_nextauth_jwt
from app.core.config import settings
from app.core.exceptions import AuthenticationError

logger = logging.getLogger(__name__)


def _extract_bearer_token(request: Request) -> str | None:
    """Extract the Bearer token from the Authorization header.

    Args:
        request: The incoming FastAPI request.

    Returns:
        The token string, or None if no Authorization header is present.
    """
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


async def get_current_user(request: Request) -> UserClaims:
    """Dependency that requires an authenticated user.

    Extracts and validates the JWT from the Authorization header.

    Args:
        request: The incoming FastAPI request.

    Returns:
        UserClaims for the authenticated user.

    Raises:
        AuthenticationError: If no token is present or it's invalid.
    """
    if not settings.auth_enabled:
        # When auth is disabled (dev mode), return a mock user so
        # endpoints that require auth still function for testing.
        logger.debug("Auth disabled — returning anonymous dev user")
        return UserClaims(
            user_id="dev-user",
            email="dev@localhost",
            name="Dev User",
            tier="premium",
        )

    token = _extract_bearer_token(request)
    if token is None:
        raise AuthenticationError("Authentication required. Please log in.")

    return decode_nextauth_jwt(token)


async def get_optional_user(request: Request) -> UserClaims | None:
    """Dependency that allows both authenticated and anonymous access.

    Checks for user identity in this order:
    1. Bearer JWT token in Authorization header (direct API auth)
    2. X-User-* headers forwarded by the Next.js proxy (session-based auth)
    3. Returns None if neither is present (anonymous access)

    Args:
        request: The incoming FastAPI request.

    Returns:
        UserClaims if authenticated, None if anonymous.

    Raises:
        AuthenticationError: Only if a Bearer token is present but invalid.
    """
    if not settings.auth_enabled:
        # Even with auth disabled, check for proxy-forwarded headers
        # so user tracking works in dev mode
        user_id = request.headers.get("x-user-id")
        if user_id:
            return UserClaims(
                user_id=user_id,
                email=request.headers.get("x-user-email", ""),
                name=request.headers.get("x-user-name", ""),
                tier=request.headers.get("x-user-tier", "free"),
            )
        return None

    # Check for JWT Bearer token first
    token = _extract_bearer_token(request)
    if token is not None:
        return decode_nextauth_jwt(token)

    # Fall back to proxy-forwarded headers
    user_id = request.headers.get("x-user-id")
    if user_id:
        return UserClaims(
            user_id=user_id,
            email=request.headers.get("x-user-email", ""),
            name=request.headers.get("x-user-name", ""),
            tier=request.headers.get("x-user-tier", "free"),
        )

    return None
