"""
Storage service abstraction.

Provides a unified interface for file storage, with two backends:
- CloudflareR2StorageService: Production storage via S3-compatible API
- LocalStorageService: Filesystem-based storage for local development

The get_storage() factory automatically selects the right backend
based on whether R2 credentials are configured.
"""

import asyncio
import logging
import shutil
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import StorageError

logger = logging.getLogger(__name__)

# Module-level lazy-initialized storage singleton
_storage_instance: "StorageService | None" = None


def get_storage() -> "StorageService":
    """Get or initialize the singleton storage service.

    Automatically selects LocalStorageService when R2 credentials are
    missing (local dev), or CloudflareR2StorageService for production.

    Returns:
        The storage service singleton.
    """
    global _storage_instance
    if _storage_instance is None:
        if settings.r2_access_key_id and settings.r2_endpoint_url:
            _storage_instance = CloudflareR2StorageService()
        else:
            logger.warning(
                "R2 credentials not configured — using local filesystem storage. "
                "This is suitable for development only."
            )
            _storage_instance = LocalStorageService()
    return _storage_instance


class StorageService:
    """Abstract base for storage backends.

    Both LocalStorageService and CloudflareR2StorageService implement
    this interface so the rest of the application is storage-agnostic.
    """

    async def upload_file(
        self, file_content: bytes, key: str, content_type: str
    ) -> str:
        """Upload file content and return the storage key."""
        raise NotImplementedError

    async def generate_download_url(
        self, key: str, expires_in: int = 3600
    ) -> str:
        """Generate a download URL for a stored file."""
        raise NotImplementedError

    async def delete_file(self, key: str) -> None:
        """Delete a file from storage."""
        raise NotImplementedError

    async def upload_local_file(
        self, file_path: Path, key: str, content_type: str
    ) -> str:
        """Upload a local file by reading it from disk."""
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            return await self.upload_file(content, key, content_type)
        except StorageError:
            raise
        except Exception as e:
            logger.exception("Failed to read local file '%s' for upload", file_path)
            raise StorageError(
                "Failed to read the processed file for upload."
            ) from e


class LocalStorageService(StorageService):
    """Filesystem-based storage for local development.

    Stores files in a local directory and serves them via a static
    file endpoint. No cloud credentials needed — perfect for dev/testing.
    """

    def __init__(self) -> None:
        """Initialize local storage directory."""
        self._base_dir = Path("local_storage").resolve()
        self._base_dir.mkdir(parents=True, exist_ok=True)
        logger.info("LocalStorageService initialized at '%s'", self._base_dir)

    def _safe_path(self, key: str) -> Path:
        """Resolve a storage key to a safe filesystem path.

        Prevents path traversal by ensuring the resolved path stays
        within the base storage directory.

        Args:
            key: The storage key (relative path).

        Returns:
            The resolved, validated file path.

        Raises:
            StorageError: If the key would escape the base directory.
        """
        resolved = (self._base_dir / key).resolve()
        if not resolved.is_relative_to(self._base_dir):
            raise StorageError("Invalid storage key: path traversal detected.")
        return resolved

    async def upload_file(
        self, file_content: bytes, key: str, content_type: str
    ) -> str:
        """Save file content to local filesystem.

        Args:
            file_content: Raw bytes of the file.
            key: Storage key (used as relative path).
            content_type: MIME type (logged but not enforced locally).

        Returns:
            The storage key.
        """
        try:
            file_path = self._safe_path(key)
            file_path.parent.mkdir(parents=True, exist_ok=True)

            with open(file_path, "wb") as f:
                f.write(file_content)

            logger.info(
                "Saved %d bytes locally: %s (type=%s)",
                len(file_content),
                key,
                content_type,
            )
            return key
        except Exception as e:
            logger.exception("Local storage write failed for key '%s'", key)
            raise StorageError("Failed to save file locally.") from e

    async def generate_download_url(
        self, key: str, expires_in: int = 3600
    ) -> str:
        """Generate a local download URL.

        In dev mode, files are served via a FastAPI static endpoint.

        Args:
            key: The storage key.
            expires_in: Ignored for local storage.

        Returns:
            A URL path for downloading the file.
        """
        # Return the backend-relative URL — the frontend proxy will
        # forward /api/pdf/storage/download/... to this endpoint
        return f"http://localhost:8000/api/storage/download/{key}"

    async def delete_file(self, key: str) -> None:
        """Delete a file from local storage.

        Args:
            key: The storage key to delete.
        """
        try:
            file_path = self._safe_path(key)
            if file_path.exists():
                file_path.unlink()
                logger.info("Deleted local file: %s", key)
        except Exception as e:
            logger.exception("Local delete failed for key '%s'", key)
            raise StorageError("Failed to delete file.") from e


class CloudflareR2StorageService(StorageService):
    """Production storage via Cloudflare R2 (S3-compatible).

    Uses boto3 with S3-compatible API to interact with Cloudflare R2.
    All boto3 calls are wrapped with ``asyncio.to_thread`` so that the
    synchronous SDK never blocks the event loop.
    """

    def __init__(self) -> None:
        """Initialize the S3 client with R2 credentials from settings.

        Raises:
            StorageError: If the R2 client cannot be initialized.
        """
        try:
            import boto3
            from botocore.config import Config as BotoConfig

            self._client = boto3.client(
                "s3",
                endpoint_url=settings.r2_endpoint_url,
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
                config=BotoConfig(
                    signature_version="s3v4",
                    retries={"max_attempts": 3, "mode": "adaptive"},
                ),
            )
            self._bucket = settings.r2_bucket_name
            logger.info("CloudflareR2StorageService initialized for bucket '%s'", self._bucket)
        except Exception as e:
            logger.exception("Failed to initialize R2 storage client:")
            raise StorageError(
                "Storage service is unavailable. Please try again later."
            ) from e

    async def upload_file(
        self, file_content: bytes, key: str, content_type: str
    ) -> str:
        """Upload file content to R2 and return the object key.

        Args:
            file_content: Raw bytes of the file to upload.
            key: The object key (path) in the R2 bucket.
            content_type: MIME type of the file (e.g. 'application/pdf').

        Returns:
            The object key that was stored, for use in subsequent operations.

        Raises:
            StorageError: If the upload fails.
        """
        try:
            await asyncio.to_thread(
                lambda: self._client.put_object(
                    Bucket=self._bucket,
                    Key=key,
                    Body=file_content,
                    ContentType=content_type,
                )
            )
            logger.info(
                "Uploaded %d bytes to R2: %s (type=%s)",
                len(file_content),
                key,
                content_type,
            )
            return key
        except Exception as e:
            logger.exception("R2 upload failed for key '%s'", key)
            raise StorageError(
                "Failed to upload file to storage. Please try again."
            ) from e

    async def generate_download_url(
        self, key: str, expires_in: int = 3600
    ) -> str:
        """Generate a pre-signed download URL for a stored file.

        Args:
            key: The object key in the R2 bucket.
            expires_in: URL expiration time in seconds. Default is 3600 (1 hour).

        Returns:
            A pre-signed URL string that allows temporary download access.

        Raises:
            StorageError: If URL generation fails.
        """
        try:
            url: str = await asyncio.to_thread(
                lambda: self._client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self._bucket, "Key": key},
                    ExpiresIn=expires_in,
                )
            )
            logger.info("Generated download URL for key '%s' (expires in %ds)", key, expires_in)
            return url
        except Exception as e:
            logger.exception("Failed to generate download URL for key '%s'", key)
            raise StorageError(
                "Failed to generate download link. Please try again."
            ) from e

    async def delete_file(self, key: str) -> None:
        """Delete a file from R2 storage.

        Args:
            key: The object key to delete.

        Raises:
            StorageError: If the deletion fails.
        """
        try:
            await asyncio.to_thread(
                lambda: self._client.delete_object(Bucket=self._bucket, Key=key)
            )
            logger.info("Deleted object from R2: %s", key)
        except Exception as e:
            logger.exception("R2 delete failed for key '%s'", key)
            raise StorageError(
                "Failed to delete file from storage. Please try again."
            ) from e

