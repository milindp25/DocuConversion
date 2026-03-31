"""Tier-based rate limit enforcement dependency.

Provides a FastAPI dependency that checks per-user daily operation
limits before allowing request processing. Designed to be added
to endpoint signatures via Depends().
"""

import logging

from fastapi import Depends, Request

from app.core.auth import UserClaims
from app.core.dependencies import get_optional_user
from app.core.exceptions import FileValidationError
from app.core.rate_limiter import check_and_increment

logger = logging.getLogger(__name__)


async def check_tier_limit(
    request: Request,
    user: UserClaims | None = Depends(get_optional_user),
) -> None:
    """Dependency that enforces tier-based rate limits.

    Checks the user's daily operation count against their tier limit.
    Raises an error if the limit has been reached.

    Args:
        request: The incoming FastAPI request.
        user: The authenticated user, or None for anonymous access.

    Raises:
        FileValidationError: When the daily operation limit is exceeded.
    """
    tier = user.tier if user else "anonymous"
    client_ip = request.client.host if request.client else "unknown"
    user_id = user.user_id if user else None

    allowed, used, limit = check_and_increment(user_id, tier, client_ip)
    if not allowed:
        limit_str = str(limit) if limit > 0 else "unlimited"
        logger.info(
            "Rate limit hit: user=%s tier=%s used=%d limit=%s",
            user_id or client_ip,
            tier,
            used,
            limit_str,
        )
        raise FileValidationError(
            f"Daily operation limit reached ({used}/{limit}). "
            "Upgrade to Premium for unlimited operations."
        )
