"""
File validation utilities for uploaded documents.

Validates file size, type, and integrity before processing.
Uses magic bytes (file signatures) for type detection -- never
trusts the file extension alone, as it can be spoofed.
"""

import logging
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import FileValidationError

logger = logging.getLogger(__name__)

# Chunk size for streaming upload reads (8 KB)
_READ_CHUNK_SIZE = 8 * 1024

# Magic byte signatures for supported file types
# These are the first few bytes that identify a file's true format
MAGIC_BYTES: dict[str, list[bytes]] = {
    "pdf": [b"%PDF"],
    "docx": [b"PK\x03\x04"],  # ZIP-based Office format
    "xlsx": [b"PK\x03\x04"],
    "pptx": [b"PK\x03\x04"],
    "png": [b"\x89PNG"],
    "jpg": [b"\xff\xd8\xff"],
    "gif": [b"GIF87a", b"GIF89a"],
    "bmp": [b"BM"],
    "tiff": [b"II\x2a\x00", b"MM\x00\x2a"],
    "webp": [b"RIFF"],  # Also requires b"WEBP" at offset 8; checked specially
}

# Map file extensions to their expected magic byte type
EXTENSION_TO_TYPE: dict[str, str] = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".doc": "docx",
    ".xlsx": "xlsx",
    ".xls": "xlsx",
    ".pptx": "pptx",
    ".ppt": "pptx",
    ".png": "png",
    ".jpg": "jpg",
    ".jpeg": "jpg",
    ".gif": "gif",
    ".bmp": "bmp",
    ".tiff": "tiff",
    ".tif": "tiff",
    ".webp": "webp",
    ".html": "html",
    ".htm": "html",
    ".txt": "txt",
}


def validate_file_size(file_size: int, max_size_mb: int | None = None) -> None:
    """Validate that the uploaded file does not exceed the size limit.

    Args:
        file_size: Size of the uploaded file in bytes.
        max_size_mb: Maximum allowed size in megabytes. Defaults to app config.

    Raises:
        FileValidationError: If the file exceeds the maximum allowed size.
    """
    max_bytes = (max_size_mb or settings.max_upload_size_mb) * 1024 * 1024

    if file_size > max_bytes:
        max_mb = max_bytes / (1024 * 1024)
        file_mb = file_size / (1024 * 1024)
        raise FileValidationError(
            f"File size ({file_mb:.1f}MB) exceeds the maximum allowed size ({max_mb:.0f}MB). "
            "Try compressing the file or upgrade to a premium plan for larger uploads."
        )


def validate_file_extension(filename: str, allowed_extensions: list[str]) -> str:
    """Validate that the file has an allowed extension.

    Args:
        filename: Original name of the uploaded file.
        allowed_extensions: List of allowed extensions (e.g., [".pdf", ".docx"]).

    Returns:
        The normalized file extension (lowercase, with dot).

    Raises:
        FileValidationError: If the extension is not in the allowed list.
    """
    ext = Path(filename).suffix.lower()

    if ext not in allowed_extensions:
        allowed = ", ".join(allowed_extensions)
        raise FileValidationError(
            f"File type '{ext}' is not supported for this operation. "
            f"Accepted formats: {allowed}"
        )

    return ext


def validate_magic_bytes(file_content: bytes, expected_extension: str) -> None:
    """Validate file content by checking magic bytes against the expected type.

    This prevents attacks where a malicious file is disguised with a
    harmless extension (e.g., an executable renamed to .pdf).

    Args:
        file_content: First 16+ bytes of the file content.
        expected_extension: The file's claimed extension (e.g., ".pdf").

    Raises:
        FileValidationError: If magic bytes don't match the expected type.
    """
    file_type = EXTENSION_TO_TYPE.get(expected_extension.lower())

    # Some types (html, txt) don't have reliable magic bytes
    if file_type is None or file_type in ("html", "txt"):
        return

    expected_signatures = MAGIC_BYTES.get(file_type, [])
    if not expected_signatures:
        return

    # WebP requires a two-part check: RIFF at offset 0 and WEBP at offset 8
    if file_type == "webp":
        if len(file_content) >= 12 and file_content[:4] == b"RIFF" and file_content[8:12] == b"WEBP":
            return
        logger.warning(
            "Magic byte mismatch: file claimed to be %s but content doesn't match",
            expected_extension,
        )
        raise FileValidationError(
            f"The file content doesn't match the expected '{expected_extension}' format. "
            "The file may be corrupted or misnamed. Please check and try again."
        )

    # Check if file content starts with any expected signature
    matches = any(file_content.startswith(sig) for sig in expected_signatures)

    if not matches:
        logger.warning(
            "Magic byte mismatch: file claimed to be %s but content doesn't match",
            expected_extension,
        )
        raise FileValidationError(
            f"The file content doesn't match the expected '{expected_extension}' format. "
            "The file may be corrupted or misnamed. Please check and try again."
        )


async def validate_upload_file(
    file: UploadFile,
    max_size_mb: int | None = None,
) -> bytes:
    """Read, validate size, and check magic bytes of an uploaded file.

    Streams the file in chunks to accurately measure server-side size
    regardless of what the client reports. Validates magic bytes on
    the first chunk so corrupted or disguised files are caught early.

    Args:
        file: The uploaded file to validate.
        max_size_mb: Maximum allowed size in megabytes. Defaults to app config.

    Returns:
        The complete file content as bytes.

    Raises:
        FileValidationError: If the file exceeds max size or magic bytes
            don't match the expected type.
    """
    max_bytes = (max_size_mb or settings.max_upload_size_mb) * 1024 * 1024
    chunks: list[bytes] = []
    total_bytes = 0
    first_chunk_validated = False

    while True:
        chunk = await file.read(_READ_CHUNK_SIZE)
        if not chunk:
            break

        total_bytes += len(chunk)
        if total_bytes > max_bytes:
            max_mb = max_bytes / (1024 * 1024)
            raise FileValidationError(
                f"File size exceeds the maximum allowed size ({max_mb:.0f}MB). "
                "Try compressing the file or upgrade to a premium plan for larger uploads."
            )

        # Validate magic bytes on the first chunk
        if not first_chunk_validated:
            ext = Path(file.filename or "").suffix.lower()
            if ext:
                validate_magic_bytes(chunk, ext)
            first_chunk_validated = True

        chunks.append(chunk)

    return b"".join(chunks)


# Common extension lists for reuse across API modules
PDF_EXTENSIONS: list[str] = [".pdf"]


async def validate_pdf_upload(file: UploadFile) -> bytes:
    """Validate that an uploaded file is a valid PDF.

    Convenience wrapper that checks the file extension against PDF_EXTENSIONS
    and then validates the upload content (size + magic bytes).

    Args:
        file: The uploaded file to validate.

    Returns:
        The complete file content as bytes.

    Raises:
        FileValidationError: If validation fails.
    """
    validate_file_extension(file.filename or "", PDF_EXTENSIONS)
    return await validate_upload_file(file)
