"""
In-memory shareable link management.

Creates and manages time-limited download links for shared documents.
In Phase 1, all data is stored in memory. In a future phase this will
be backed by a database for persistence across restarts.
"""

import logging
import secrets
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import ClassVar

from app.core.config import settings
from app.core.exceptions import ShareError

logger = logging.getLogger(__name__)


@dataclass
class ShareRecord:
    """Record for a single shareable link.

    Attributes:
        token: Unique URL-safe token identifying this link.
        storage_key: Key in the storage backend for the shared file.
        filename: Original filename of the shared document.
        expires_at: When this link stops working.
        download_count: Number of times the link has been accessed.
        created_at: When the link was created.
    """

    token: str
    storage_key: str
    filename: str
    expires_at: datetime
    download_count: int = 0
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def is_expired(self) -> bool:
        """Check whether this share link has expired.

        Returns:
            True if the link is past its expiration time.
        """
        return datetime.now(timezone.utc) > self.expires_at


class ShareService:
    """In-memory shareable link management for Phase 1.

    Uses a class-level dict so all instances share the same store
    within a single process.
    """

    _links: ClassVar[dict[str, ShareRecord]] = {}

    def create_link(
        self, storage_key: str, filename: str, ttl_hours: int = 24
    ) -> ShareRecord:
        """Create a new shareable download link.

        Args:
            storage_key: The storage key for the file to share.
            filename: Original filename for display purposes.
            ttl_hours: How many hours the link should remain valid.

        Returns:
            The created ShareRecord with the token and URL.

        Raises:
            ShareError: If the TTL exceeds the configured maximum.
        """
        max_ttl = settings.share_link_max_ttl_hours
        if ttl_hours > max_ttl:
            raise ShareError(
                f"TTL cannot exceed {max_ttl} hours. "
                f"Please choose a shorter expiration time."
            )

        if ttl_hours < 1:
            raise ShareError("TTL must be at least 1 hour.")

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=ttl_hours)

        record = ShareRecord(
            token=token,
            storage_key=storage_key,
            filename=filename,
            expires_at=expires_at,
        )

        self._links[token] = record

        logger.info(
            "Share link created: token=%s, file=%s, expires_at=%s",
            token,
            filename,
            expires_at.isoformat(),
        )
        return record

    def get_link(self, token: str) -> ShareRecord | None:
        """Retrieve a share link record by token.

        Increments the download count if the link is valid. Returns None
        if the token is not found or the link has expired.

        Args:
            token: The unique share link token.

        Returns:
            The ShareRecord if valid, or None if not found or expired.
        """
        record = self._links.get(token)
        if record is None:
            return None

        if record.is_expired:
            return None

        record.download_count += 1
        return record

    def get_link_info(self, token: str) -> ShareRecord | None:
        """Retrieve share link info without incrementing download count.

        Args:
            token: The unique share link token.

        Returns:
            The ShareRecord if found, or None.
        """
        return self._links.get(token)

    def cleanup_expired(self) -> int:
        """Remove all expired share links from memory.

        Returns:
            The number of links removed.
        """
        expired_tokens = [
            token for token, record in self._links.items()
            if record.is_expired
        ]
        for token in expired_tokens:
            del self._links[token]

        if expired_tokens:
            logger.info("Cleaned up %d expired share links", len(expired_tokens))
        return len(expired_tokens)


# Module-level singleton for use across the application
share_service = ShareService()
