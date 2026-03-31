"""
Electronic signature service.

Handles applying electronic signatures (image overlays) to PDF documents
and generating signature images from text. Phase 1 provides basic image
overlay and text-to-signature rendering. Phase 2 will add certificate-backed
digital signatures for legal compliance.
"""

import logging
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

from app.core.exceptions import SignatureError

logger = logging.getLogger(__name__)


class SignatureService:
    """Service for applying electronic signatures to PDFs.

    Phase 1: Basic image overlay using PyMuPDF's insert_image,
    plus text-to-signature image generation using Pillow.
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
        with the origin at the top-left of the page (matching PyMuPDF).

        Args:
            pdf_path: Path to the source PDF document.
            signature_image_path: Path to the signature image (PNG recommended
                for transparency support).
            page: Zero-indexed page number where the signature should be placed.
            x: Horizontal position in points from the left edge.
            y: Vertical position in points from the top edge.
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

                # Coordinates are already in top-left origin (matching PyMuPDF)
                # — the API layer converts normalized (0-1) to absolute points
                sig_rect = fitz.Rect(x, y, x + width, y + height)

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

    @staticmethod
    async def generate_text_signature(
        text: str, output_path: Path, font_style: str = "cursive"
    ) -> Path:
        """Generate a signature image from text.

        Renders the given text in a calligraphic/script style using
        Pillow and returns it as a transparent PNG. The resulting image
        can be applied to a PDF using the ``apply_signature`` method.

        Args:
            text: The signature text to render (e.g. a person's name).
            output_path: Where to save the generated PNG image.
            font_style: Visual style for the signature. One of
                ``"cursive"`` (italic with slant transform),
                ``"formal"`` (upright serif italic), or
                ``"casual"`` (clean sans-serif italic).

        Returns:
            Path to the generated transparent PNG image.

        Raises:
            SignatureError: If signature generation fails.
        """
        try:
            if not text or not text.strip():
                raise SignatureError(
                    "Signature text must not be empty."
                )

            # Font size and styling parameters per style
            font_size = 48
            style_config: dict[str, dict] = {
                "cursive": {"slant": 0.3, "color": (0, 0, 128)},
                "formal": {"slant": 0.15, "color": (0, 0, 0)},
                "casual": {"slant": 0.2, "color": (50, 50, 50)},
            }
            config = style_config.get(font_style, style_config["cursive"])

            # Use Pillow's default font (always available across platforms)
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except (OSError, IOError):
                try:
                    font = ImageFont.truetype("DejaVuSans.ttf", font_size)
                except (OSError, IOError):
                    font = ImageFont.load_default()

            # Measure text to size the canvas
            dummy_img = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
            dummy_draw = ImageDraw.Draw(dummy_img)
            bbox = dummy_draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            # Add padding for the slant transform
            padding_x = int(text_height * abs(config["slant"])) + 20
            padding_y = 20
            canvas_width = text_width + padding_x * 2
            canvas_height = text_height + padding_y * 2

            # Create transparent canvas and draw text
            img = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)

            # Center text on canvas
            text_x = padding_x - bbox[0]
            text_y = padding_y - bbox[1]
            draw.text(
                (text_x, text_y),
                text,
                fill=(*config["color"], 255),
                font=font,
            )

            # Apply slant (affine shear) for handwriting effect
            slant = config["slant"]
            img = img.transform(
                (canvas_width, canvas_height),
                Image.AFFINE,
                (1, slant, -slant * canvas_height / 2, 0, 1, 0),
                resample=Image.BICUBIC,
            )

            # Crop to tight bounding box of non-transparent pixels
            alpha = img.split()[3]
            alpha_bbox = alpha.getbbox()
            if alpha_bbox:
                img = img.crop(alpha_bbox)

            img.save(str(output_path), "PNG")

            logger.info(
                "Generated text signature (%s style, %dx%d) -> %s",
                font_style,
                img.width,
                img.height,
                output_path.name,
            )
            return output_path

        except SignatureError:
            raise
        except Exception as e:
            logger.error("Failed to generate text signature: %s", str(e))
            raise SignatureError(
                "Failed to generate the signature image. "
                "Please try again with different text or style."
            ) from e
