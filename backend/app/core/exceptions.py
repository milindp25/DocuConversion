"""
Custom exception classes for DocuConversion.

Each domain area has its own exception type so error handling can be
granular. All inherit from DocuConversionError for catch-all handling.
"""

from fastapi import HTTPException, status


class DocuConversionError(Exception):
    """Base exception for all DocuConversion errors."""

    def __init__(self, message: str = "An unexpected error occurred") -> None:
        self.message = message
        super().__init__(self.message)


class FileValidationError(DocuConversionError):
    """Raised when an uploaded file fails validation checks.

    Examples: wrong file type, file too large, corrupted file,
    password-protected PDF without password provided.
    """

    pass


class ConversionError(DocuConversionError):
    """Raised when a PDF conversion operation fails.

    Examples: unsupported format combination, corrupted source file,
    conversion library error.
    """

    pass


class OrganizationError(DocuConversionError):
    """Raised when a PDF organization operation fails.

    Examples: merge failure, split failure, page range out of bounds,
    compression error.
    """

    pass


class SignatureError(DocuConversionError):
    """Raised when an e-signature operation fails.

    Examples: invalid signature image, placement failure,
    signature rendering error.
    """

    pass


class SecurityError(DocuConversionError):
    """Raised when a PDF security operation fails.

    Examples: password protection failure, unlock with wrong password,
    redaction error.
    """

    pass


class EditingError(DocuConversionError):
    """Raised when a PDF editing operation fails."""

    pass


class StorageError(DocuConversionError):
    """Raised when file storage operations (R2 upload/download) fail."""

    pass


class AuthenticationError(DocuConversionError):
    """Raised when authentication fails (invalid/expired/missing JWT)."""

    pass


class AiError(DocuConversionError):
    """Raised when an AI operation fails.

    Examples: missing API key, Gemini API failure, text extraction error,
    response parsing failure.
    """

    pass


class RateLimitError(DocuConversionError):
    """Raised when a user exceeds their tier-based daily operation limit."""

    pass


class PaymentError(DocuConversionError):
    """Raised when a payment operation fails.

    Examples: Stripe not configured, checkout session creation failure,
    webhook verification error.
    """

    pass


class ShareError(DocuConversionError):
    """Raised when a share link operation fails.

    Examples: expired link, invalid token, TTL exceeds maximum.
    """

    pass


def handle_docuconversion_error(error: DocuConversionError) -> HTTPException:
    """Convert a DocuConversion domain error into an HTTP exception.

    Maps domain-specific errors to appropriate HTTP status codes
    with user-friendly error messages.

    Args:
        error: The domain error to convert.

    Returns:
        An HTTPException with the appropriate status code and detail message.
    """
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    if isinstance(error, RateLimitError):
        status_code = status.HTTP_429_TOO_MANY_REQUESTS
    elif isinstance(error, FileValidationError):
        status_code = status.HTTP_400_BAD_REQUEST
    elif isinstance(error, ConversionError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, OrganizationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, EditingError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, SignatureError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, SecurityError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, AiError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(error, PaymentError):
        status_code = status.HTTP_402_PAYMENT_REQUIRED
    elif isinstance(error, ShareError):
        status_code = status.HTTP_400_BAD_REQUEST
    elif isinstance(error, StorageError):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    elif isinstance(error, AuthenticationError):
        status_code = status.HTTP_401_UNAUTHORIZED

    return HTTPException(status_code=status_code, detail=error.message)
