"""
JWT authentication for NextAuth.js token validation.

The frontend uses NextAuth.js v5 to manage authentication. When a user
is logged in, their JWT is forwarded to the backend via the Authorization
header. This module validates that JWT and extracts user claims.

The backend never stores users — it trusts the JWT claims signed by
the shared NEXTAUTH_SECRET.
"""

import logging
from dataclasses import dataclass

import jwt

from app.core.config import settings
from app.core.exceptions import AuthenticationError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class UserClaims:
    """Authenticated user information extracted from a NextAuth JWT.

    Attributes:
        user_id: Unique user identifier (from JWT 'sub' claim).
        email: User's email address.
        name: User's display name.
        tier: Subscription tier ('free' or 'premium').
    """

    user_id: str
    email: str
    name: str
    tier: str  # "free" | "premium"


def decode_nextauth_jwt(token: str) -> UserClaims:
    """Decode and validate a NextAuth.js JWT token.

    Uses HS256 signature verification with the shared NEXTAUTH_SECRET.
    Extracts user claims from the payload.

    Args:
        token: The raw JWT string from the Authorization header.

    Returns:
        UserClaims with the authenticated user's information.

    Raises:
        AuthenticationError: If the token is invalid, expired, or malformed.
    """
    if not settings.nextauth_secret:
        raise AuthenticationError(
            "Authentication is not configured on this server."
        )

    try:
        payload = jwt.decode(
            token,
            settings.nextauth_secret,
            algorithms=["HS256"],
            options={"require": ["sub", "email"]},
        )

        return UserClaims(
            user_id=payload.get("sub", ""),
            email=payload.get("email", ""),
            name=payload.get("name", ""),
            tier=payload.get("tier", "free"),
        )
    except jwt.ExpiredSignatureError:
        logger.warning("Expired JWT token received")
        raise AuthenticationError("Your session has expired. Please log in again.")
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid JWT token: %s", str(e))
        raise AuthenticationError("Invalid authentication token. Please log in again.")
