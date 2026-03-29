"""
Electronic signature service.

Handles applying electronic signatures (image overlays) to PDF documents.
Phase 1 provides basic image overlay. Phase 2 will add certificate-backed
digital signatures for legal compliance.
"""

import logging
from pathlib import Path

import fitz  # PyMuPDF

from app.core.exceptions import SignatureError

logger = logging.getLogger(__name__)


class SignatureService:
    """Service for applying electronic signatures to PDFs.

    Phase 1: Basic image overlay using PyMuPDF's insert_image.
    Phase 2: Certificate-backed digital signatures with timestamp authority.
    """

    @staticmethod
    async def apply_signature(
        pdf_path: Path,
        signature_image_path: Path,
        page: int,
        x: float,
        y: float,
        width: float,
        height: float,
        output_path: Path,
    ) -> Path:
        """Overlay a signature image onto a PDF page at specified coordinates.

        The signature image is placed as a transparent overlay on the
        specified page. The coordinate system uses points (1/72 inch)
        with the origin at the bottom-left of the page.

        Args:
            pdf_path: Path to the source PDF document.
            signature_image_path: Path to the signature image (PNG recommended
                for transparency support).
            page: Zero-indexed page number where the signature should be placed.
            x: Horizontal position in points from the left edge.
            y: Vertical position in points from the bottom edge.
            width: Width of the signature overlay in points.
            height: Height of the signature overlay in points.
            output_path: Where to save the signed PDF.

        Returns:
            Path to the signed PDF file.

        Raises:
            SignatureError: If the signature cannot be applied.
        """
        try:
            with fitz.open(str(pdf_path)) as doc:
                if page < 0 or page >= len(doc):
                    raise SignatureError(
                        f"Page {page} is out of range. "
                        f"The document has {len(doc)} pages (0-indexed)."
                    )

                target_page = doc[page]
                page_height = target_page.rect.height

                # Convert from bottom-left origin to PyMuPDF top-left origin
                fitz_y = page_height - y - height

                # Define the rectangle where the signature will be placed
                sig_rect = fitz.Rect(x, fitz_y, x + width, fitz_y + height)

                # Insert the signature image
                target_page.insert_image(
                    sig_rect,
                    filename=str(signature_image_path),
                    overlay=True,
                )

                doc.save(str(output_path))

            logger.info(
                "Signature applied: page=%d, position=(%s, %s), size=%sx%s -> %s",
                page,
                x,
                y,
                width,
                height,
                output_path.name,
            )
            return output_path

        except SignatureError:
            raise
        except Exception as e:
            logger.error("Failed to apply signature: %s", str(e))
            raise SignatureError(
                "Failed to apply the signature to the PDF. "
                "The PDF or signature image may be corrupted."
            ) from e
