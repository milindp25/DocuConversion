"""
PDF security service.

Handles password protection (encryption) and unlocking (decryption) of
PDF documents using PyMuPDF's built-in encryption features.
"""

import logging
from pathlib import Path

import fitz  # PyMuPDF

from app.core.exceptions import SecurityError

logger = logging.getLogger(__name__)

# PyMuPDF encryption algorithm constant for AES-256
_ENCRYPT_AES256 = fitz.PDF_ENCRYPT_AES_256


class SecurityService:
    """Service for PDF security operations.

    Provides password protection and removal for PDF documents using
    AES-256 encryption via PyMuPDF.
    """

    @staticmethod
    async def protect_pdf(
        input_path: Path,
        output_path: Path,
        user_password: str,
        owner_password: str | None = None,
    ) -> Path:
        """Add password protection to a PDF document.

        Sets a user password (required to open) and optionally an owner
        password (required to edit/print). Uses AES-256 encryption.

        Args:
            input_path: Path to the source PDF.
            output_path: Where to save the protected PDF.
            user_password: Password required to open the document.
            owner_password: Password for full access (editing, printing).
                Defaults to the user_password if not provided.

        Returns:
            Path to the password-protected PDF.

        Raises:
            SecurityError: If encryption fails.
        """
        if owner_password is None:
            owner_password = user_password

        try:
            with fitz.open(str(input_path)) as doc:
                # Set permissions: deny printing and modification by default
                perm = (
                    fitz.PDF_PERM_ACCESSIBILITY
                    | fitz.PDF_PERM_COPY
                )

                doc.save(
                    str(output_path),
                    encryption=_ENCRYPT_AES256,
                    user_pw=user_password,
                    owner_pw=owner_password,
                    permissions=perm,
                )

            logger.info(
                "PDF protected with AES-256 encryption: %s -> %s",
                input_path.name,
                output_path.name,
            )
            return output_path

        except Exception as e:
            logger.error("PDF protection failed: %s", str(e))
            raise SecurityError(
                "Failed to add password protection to the PDF. "
                "The file may be corrupted or already encrypted."
            ) from e

    @staticmethod
    async def unlock_pdf(
        input_path: Path,
        output_path: Path,
        password: str,
    ) -> Path:
        """Remove password protection from a PDF document.

        Opens the encrypted PDF with the provided password and saves
        an unprotected copy.

        Args:
            input_path: Path to the encrypted PDF.
            output_path: Where to save the unlocked PDF.
            password: The password to decrypt the PDF.

        Returns:
            Path to the unlocked PDF file.

        Raises:
            SecurityError: If the password is incorrect or decryption fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                if doc.is_encrypted:
                    authenticated = doc.authenticate(password)
                    if not authenticated:
                        raise SecurityError(
                            "Incorrect password. Please check and try again."
                        )

                # Save without encryption
                doc.save(str(output_path))

            logger.info(
                "PDF unlocked successfully: %s -> %s",
                input_path.name,
                output_path.name,
            )
            return output_path

        except SecurityError:
            raise
        except Exception as e:
            logger.error("PDF unlock failed: %s", str(e))
            raise SecurityError(
                "Failed to unlock the PDF. "
                "The file may be corrupted or the password may be incorrect."
            ) from e
