"""
In-memory API key management for developer access.

Provides creation, revocation, listing, and validation of API keys
for programmatic access to the DocuConversion API. In Phase 1, all
data is stored in memory. A future phase will persist keys to a database.
"""

import logging
import secrets
from dataclasses import dataclass, field
from datetime import datetime, date, timezone
from typing import ClassVar

logger = logging.getLogger(__name__)

# Daily request limit per API key
_DAILY_LIMIT = 1000


@dataclass
class ApiKeyRecord:
    """Record for a single API key.

    Attributes:
        key: The API key string (prefix 'dc_' + random token).
        name: Human-readable name given by the user.
        user_id: ID of the user who created this key.
        created_at: When the key was created.
        is_revoked: Whether the key has been revoked.
        request_counts: Daily request counts keyed by date string.
    """

    key: str
    name: str
    user_id: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    is_revoked: bool = False
    request_counts: dict[str, int] = field(default_factory=dict)

    @property
    def requests_today(self) -> int:
        """Get the number of requests made today.

        Returns:
            Request count for the current UTC date.
        """
        today = date.today().isoformat()
        return self.request_counts.get(today, 0)

    def increment_usage(self) -> None:
        """Increment today's request count by one."""
        today = date.today().isoformat()
        self.request_counts[today] = self.request_counts.get(today, 0) + 1


class ApiKeyService:
    """In-memory API key management for Phase 1.

    Uses class-level dicts so all instances share the same store
    within a single process.
    """

    _keys: ClassVar[dict[str, ApiKeyRecord]] = {}
    _user_keys: ClassVar[dict[str, list[str]]] = {}

    def create_key(self, user_id: str, name: str) -> ApiKeyRecord:
        """Create a new API key for a user.

        Args:
            user_id: The authenticated user's ID.
            name: A human-readable name for the key.

        Returns:
            The created ApiKeyRecord including the key string.
        """
        key = f"dc_{secrets.token_urlsafe(32)}"

        record = ApiKeyRecord(
            key=key,
            name=name,
            user_id=user_id,
        )

        self._keys[key] = record

        if user_id not in self._user_keys:
            self._user_keys[user_id] = []
        self._user_keys[user_id].append(key)

        logger.info(
            "API key created: name=%s, user=%s",
            name,
            user_id,
        )
        return record

    def revoke_key(self, key: str, user_id: str) -> bool:
        """Revoke an API key owned by the user.

        Args:
            key: The API key string to revoke.
            user_id: The authenticated user's ID (for ownership check).

        Returns:
            True if the key was revoked, False if not found or not owned.
        """
        record = self._keys.get(key)
        if record is None or record.user_id != user_id:
            return False

        record.is_revoked = True
        logger.info("API key revoked: name=%s, user=%s", record.name, user_id)
        return True

    def list_keys(self, user_id: str) -> list[ApiKeyRecord]:
        """List all API keys for a user (including revoked).

        Args:
            user_id: The authenticated user's ID.

        Returns:
            List of ApiKeyRecord objects belonging to the user.
        """
        key_strings = self._user_keys.get(user_id, [])
        return [
            self._keys[k]
            for k in key_strings
            if k in self._keys
        ]

    def validate_key(self, key: str) -> ApiKeyRecord | None:
        """Validate an API key and increment its usage counter.

        Args:
            key: The API key string to validate.

        Returns:
            The ApiKeyRecord if valid and not revoked, or None.
        """
        record = self._keys.get(key)
        if record is None or record.is_revoked:
            return None

        # Check daily limit
        if record.requests_today >= _DAILY_LIMIT:
            return None

        record.increment_usage()
        return record

    def get_usage(self, key: str, user_id: str) -> ApiKeyRecord | None:
        """Get usage statistics for an API key.

        Args:
            key: The API key string.
            user_id: The authenticated user's ID (for ownership check).

        Returns:
            The ApiKeyRecord if found and owned by user, or None.
        """
        record = self._keys.get(key)
        if record is None or record.user_id != user_id:
            return None
        return record


# Module-level singleton for use across the application
api_key_service = ApiKeyService()
