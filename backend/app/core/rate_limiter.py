"""Per-user tier-based rate limiting.

Tracks daily operations per user/IP and enforces tier limits:
- Anonymous: 5 operations/day
- Free (account): 20 operations/day
- Premium: Unlimited

Uses an in-memory counter that resets daily. In production, this
should be backed by Redis or a database for multi-instance support.
"""

from collections import defaultdict
from datetime import date

# In-memory counter: {(user_id_or_ip, date_str): count}
_usage_counter: dict[tuple[str, str], int] = defaultdict(int)

TIER_LIMITS: dict[str, float] = {
    "anonymous": 5,
    "free": 20,
    "premium": float("inf"),
    "enterprise": float("inf"),
}


def check_and_increment(
    user_id: str | None, tier: str, client_ip: str
) -> tuple[bool, int, int]:
    """Check if user has remaining operations and increment counter.

    Args:
        user_id: The authenticated user's ID, or None for anonymous.
        tier: The user's subscription tier.
        client_ip: The client's IP address (fallback key for anonymous).

    Returns:
        Tuple of (allowed, used_count, daily_limit).
        For unlimited tiers, limit is returned as -1.
    """
    key_id = user_id or client_ip
    today = date.today().isoformat()
    key = (key_id, today)

    limit = TIER_LIMITS.get(tier, 5)
    current = _usage_counter[key]

    if limit == float("inf"):
        _usage_counter[key] += 1
        return (True, current + 1, -1)

    if current >= limit:
        return (False, current, int(limit))

    _usage_counter[key] += 1
    return (True, current + 1, int(limit))


def get_usage(user_id: str | None, tier: str, client_ip: str) -> dict:
    """Get current usage stats for a user.

    Args:
        user_id: The authenticated user's ID, or None for anonymous.
        tier: The user's subscription tier.
        client_ip: The client's IP address (fallback key for anonymous).

    Returns:
        Dictionary with used, limit, and remaining counts.
        Unlimited tiers return -1 for limit and remaining.
    """
    key_id = user_id or client_ip
    today = date.today().isoformat()
    key = (key_id, today)
    limit = TIER_LIMITS.get(tier, 5)
    used = _usage_counter[key]

    if limit == float("inf"):
        return {"used": used, "limit": -1, "remaining": -1}

    int_limit = int(limit)
    return {
        "used": used,
        "limit": int_limit,
        "remaining": max(0, int_limit - used),
    }
