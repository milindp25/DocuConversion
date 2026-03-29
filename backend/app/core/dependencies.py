"""
FastAPI dependency injection functions for authentication.

These are used with FastAPI's Depends() system to inject user
information into endpoint handlers. Two flavors:
- get_current_user: Requires authentication (raises 401 if missing)
- get_optional_user: Allows anonymous access (returns None if no token)

Proxy-forwarded headers (x-user-*) are verified using HMAC signatures
to prevent spoofing. Only the Next.js proxy (which shares the
NEXTAUTH_SECRET) can produce valid signatures.
"""

import hashlib
import hmac
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


def _verify_proxy_headers(request: Request) -> UserClaims | None:
    """Extract and verify proxy-forwarded user headers.

    The Next.js proxy signs the x-user-* headers with HMAC-SHA256
    using the NEXTAUTH_SECRET. This prevents any client from forging
    these headers directly against the backend.

    Args:
        request: The incoming FastAPI request.

    Returns:
        UserClaims if valid signed headers are present, None otherwise.
    """
    user_id = request.headers.get("x-user-id")
    if not user_id:
        return None

    signature = request.headers.get("x-user-signature", "")
    email = request.headers.get("x-user-email", "")
    tier = request.headers.get("x-user-tier", "free")
    name = request.headers.get("x-user-name", "")

    # Verify the HMAC signature to ensure headers came from the trusted proxy
    secret = settings.nextauth_secret
    if not secret:
        # No secret configured — can't verify, reject proxy headers
        logger.warning("Proxy headers present but NEXTAUTH_SECRET not set — ignoring")
        return None

    expected = hmac.new(
        secret.encode(), f"{user_id}:{email}:{tier}".encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        logger.warning("Invalid x-user-signature — proxy header forgery attempt")
        return None

    return UserClaims(
        user_id=user_id,
        email=email,
        name=name,
        tier=tier,
    )


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
    2. HMAC-signed x-user-* headers from the Next.js proxy
    3. Returns None if neither is present (anonymous access)

    Args:
        request: The incoming FastAPI request.

    Returns:
        UserClaims if authenticated, None if anonymous.

    Raises:
        AuthenticationError: Only if a Bearer token is present but invalid.
    """
    # Check for JWT Bearer token first (API key or direct auth)
    token = _extract_bearer_token(request)
    if token is not None:
        if settings.auth_enabled:
            return decode_nextauth_jwt(token)
        # Auth disabled but token provided — still try to decode
        try:
            return decode_nextauth_jwt(token)
        except Exception:
            pass

    # Check for HMAC-signed proxy headers
    proxy_user = _verify_proxy_headers(request)
    if proxy_user is not None:
        return proxy_user

    return None
