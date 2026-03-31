"""
PDF editing service.

Handles in-place modifications to PDF documents: adding text annotations,
watermarks, page numbers, highlight regions, geometric shapes, and
freehand ink drawings. All operations use PyMuPDF for rendering onto
existing PDF pages.
"""

import logging
import math
from pathlib import Path

import fitz  # PyMuPDF

from app.core.exceptions import EditingError

logger = logging.getLogger(__name__)


def _hex_to_rgb(hex_color: str) -> tuple[float, float, float]:
    """Convert a hex color string to an RGB float tuple for PyMuPDF.

    Args:
        hex_color: Hex color string (e.g. '#FF0000').

    Returns:
        Tuple of (r, g, b) floats each in [0.0, 1.0].
    """
    hex_color = hex_color.lstrip("#")
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return (r, g, b)


def _resolve_position(
    page_width: float,
    page_height: float,
    position: str,
    text_width: float = 0,
    text_height: float = 0,
    margin: float = 36,
) -> tuple[float, float]:
    """Calculate absolute coordinates for a named position on a page.

    Args:
        page_width: Width of the page in points.
        page_height: Height of the page in points.
        position: Named position string (e.g. 'center', 'bottom-center').
        text_width: Estimated width of the text block in points.
        text_height: Estimated height of the text block in points.
        margin: Margin from page edges in points.

    Returns:
        Tuple of (x, y) coordinates in PyMuPDF's top-left origin system.
    """
    positions: dict[str, tuple[float, float]] = {
        "center": (
            (page_width - text_width) / 2,
            (page_height - text_height) / 2,
        ),
        "top-left": (margin, margin + text_height),
        "top-center": ((page_width - text_width) / 2, margin + text_height),
        "top-right": (page_width - text_width - margin, margin + text_height),
        "bottom-left": (margin, page_height - margin),
        "bottom-center": (
            (page_width - text_width) / 2,
            page_height - margin,
        ),
        "bottom-right": (
            page_width - text_width - margin,
            page_height - margin,
        ),
    }
    return positions.get(position, positions["center"])


class EditingService:
    """Service for modifying PDF content: text, images, watermarks, page numbers.

    All methods are static async functions that accept file paths, perform
    modifications using PyMuPDF, and return the path to the output file.
    Coordinates are normalized (0-1) in the API layer and converted to
    absolute points within these methods.
    """

    @staticmethod
    async def add_text(
        input_path: Path, output_path: Path, annotations: list[dict]
    ) -> Path:
        """Add text annotations to a PDF.

        Each annotation is placed at normalized (x, y) coordinates on the
        specified page. Coordinates are converted from normalized [0, 1]
        range to absolute page points.

        Args:
            input_path: Path to the source PDF file.
            output_path: Where to save the annotated PDF.
            annotations: List of annotation dicts, each with keys:
                page (int, 1-indexed), x (float, 0-1), y (float, 0-1),
                content (str), font_size (int), color (str hex).

        Returns:
            Path to the annotated PDF file.

        Raises:
            EditingError: If text insertion fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                for annot in annotations:
                    page_num = annot["page"] - 1  # Convert to 0-indexed
                    if page_num < 0 or page_num >= len(doc):
                        raise EditingError(
                            f"Page {annot['page']} is out of range. "
                            f"The document has {len(doc)} pages."
                        )

                    page = doc[page_num]
                    rect = page.rect
                    abs_x = annot["x"] * rect.width
                    abs_y = annot["y"] * rect.height
                    color = _hex_to_rgb(annot.get("color", "#000000"))
                    font_size = annot.get("font_size", 12)

                    page.insert_text(
                        fitz.Point(abs_x, abs_y),
                        annot["content"],
                        fontsize=font_size,
                        color=color,
                        fontname="helv",
                    )

                doc.save(str(output_path))

            logger.info(
                "Added %d text annotations to PDF: %s -> %s",
                len(annotations),
                input_path.name,
                output_path.name,
            )
            return output_path

        except EditingError:
            raise
        except Exception as e:
            logger.error("Failed to add text annotations: %s", str(e))
            raise EditingError(
                "Failed to add text to the PDF. "
                "The file may be corrupted or contain unsupported content."
            ) from e

    @staticmethod
    async def add_watermark(
        input_path: Path,
        output_path: Path,
        text: str,
        opacity: float = 0.3,
        position: str = "center",
        font_size: int = 60,
        color: str = "#808080",
        rotation: float = -45,
    ) -> Path:
        """Add a text watermark to every page of a PDF.

        Overlays semi-transparent text on each page at the specified
        position and rotation angle.

        Args:
            input_path: Path to the source PDF file.
            output_path: Where to save the watermarked PDF.
            text: The watermark text to display.
            opacity: Transparency level from 0.05 (nearly invisible) to 1.0.
            position: Named position: center, top-left, top-right,
                bottom-left, bottom-right.
            font_size: Font size in points.
            color: Hex color string for the watermark text.
            rotation: Rotation angle in degrees (negative = clockwise).

        Returns:
            Path to the watermarked PDF file.

        Raises:
            EditingError: If watermark insertion fails.
        """
        try:
            rgb = _hex_to_rgb(color)

            with fitz.open(str(input_path)) as doc:
                page_count = len(doc)
                for page_num in range(page_count):
                    page = doc[page_num]
                    rect = page.rect

                    # Estimate text dimensions for positioning
                    est_width = len(text) * font_size * 0.5
                    est_height = font_size

                    pos_x, pos_y = _resolve_position(
                        rect.width,
                        rect.height,
                        position,
                        est_width,
                        est_height,
                    )

                    # Use a text writer for rotation and opacity support
                    tw = fitz.TextWriter(page.rect)
                    tw.append(
                        fitz.Point(pos_x, pos_y),
                        text,
                        fontsize=font_size,
                        font=fitz.Font("helv"),
                    )
                    tw.write_text(
                        page,
                        color=rgb,
                        opacity=opacity,
                        morph=(
                            fitz.Point(pos_x + est_width / 2, pos_y - est_height / 2),
                            fitz.Matrix(rotation),
                        ),
                    )

                doc.save(str(output_path))

            logger.info(
                "Watermark '%s' added to %d pages: %s -> %s",
                text,
                page_count,
                input_path.name,
                output_path.name,
            )
            return output_path

        except EditingError:
            raise
        except Exception as e:
            logger.error("Failed to add watermark: %s", str(e))
            raise EditingError(
                "Failed to add watermark to the PDF. "
                "The file may be corrupted or contain unsupported content."
            ) from e

    @staticmethod
    async def add_page_numbers(
        input_path: Path,
        output_path: Path,
        position: str = "bottom-center",
        start_number: int = 1,
        font_size: int = 12,
    ) -> Path:
        """Add page numbers to every page of a PDF.

        Numbers are placed at the specified position using a clean
        sans-serif font. The numbering starts from start_number.

        Args:
            input_path: Path to the source PDF file.
            output_path: Where to save the numbered PDF.
            position: Named position for the page number. One of:
                top-left, top-center, top-right,
                bottom-left, bottom-center, bottom-right.
            start_number: First page number to use.
            font_size: Font size for the page numbers in points.

        Returns:
            Path to the numbered PDF file.

        Raises:
            EditingError: If page number insertion fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                page_count = len(doc)
                for page_num in range(page_count):
                    page = doc[page_num]
                    rect = page.rect
                    number_text = str(start_number + page_num)

                    # Estimate text width for centering
                    est_width = len(number_text) * font_size * 0.5
                    est_height = font_size

                    pos_x, pos_y = _resolve_position(
                        rect.width,
                        rect.height,
                        position,
                        est_width,
                        est_height,
                    )

                    page.insert_text(
                        fitz.Point(pos_x, pos_y),
                        number_text,
                        fontsize=font_size,
                        color=(0, 0, 0),
                        fontname="helv",
                    )

                doc.save(str(output_path))

            logger.info(
                "Page numbers added (%s, starting at %d) to %d pages: %s -> %s",
                position,
                start_number,
                page_count,
                input_path.name,
                output_path.name,
            )
            return output_path

        except EditingError:
            raise
        except Exception as e:
            logger.error("Failed to add page numbers: %s", str(e))
            raise EditingError(
                "Failed to add page numbers to the PDF. "
                "The file may be corrupted or contain unsupported content."
            ) from e

    @staticmethod
    async def add_highlight(
        input_path: Path, output_path: Path, annotations: list[dict]
    ) -> Path:
        """Add highlight annotations (colored rectangles) to a PDF.

        Each highlight is drawn as a semi-transparent filled rectangle
        at the specified normalized coordinates.

        Args:
            input_path: Path to the source PDF file.
            output_path: Where to save the highlighted PDF.
            annotations: List of annotation dicts, each with keys:
                page (int, 1-indexed), x (float, 0-1), y (float, 0-1),
                width (float, 0-1), height (float, 0-1),
                color (str hex), opacity (float).

        Returns:
            Path to the highlighted PDF file.

        Raises:
            EditingError: If highlight insertion fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                for annot in annotations:
                    page_num = annot["page"] - 1
                    if page_num < 0 or page_num >= len(doc):
                        raise EditingError(
                            f"Page {annot['page']} is out of range. "
                            f"The document has {len(doc)} pages."
                        )

                    page = doc[page_num]
                    rect = page.rect
                    abs_x = annot["x"] * rect.width
                    abs_y = annot["y"] * rect.height
                    abs_w = annot["width"] * rect.width
                    abs_h = annot["height"] * rect.height

                    highlight_rect = fitz.Rect(
                        abs_x, abs_y, abs_x + abs_w, abs_y + abs_h
                    )
                    fill_color = _hex_to_rgb(annot.get("color", "#FFFF00"))
                    opacity = annot.get("opacity", 0.4)

                    shape = page.new_shape()
                    shape.draw_rect(highlight_rect)
                    shape.finish(
                        fill=fill_color,
                        fill_opacity=opacity,
                        color=None,
                        width=0,
                    )
                    shape.commit()

                doc.save(str(output_path))

            logger.info(
                "Added %d highlight annotations: %s -> %s",
                len(annotations),
                input_path.name,
                output_path.name,
            )
            return output_path

        except EditingError:
            raise
        except Exception as e:
            logger.error("Failed to add highlights: %s", str(e))
            raise EditingError(
                "Failed to add highlights to the PDF. "
                "The file may be corrupted or contain unsupported content."
            ) from e

    @staticmethod
    async def add_shapes(
        input_path: Path, output_path: Path, shapes: list[dict]
    ) -> Path:
        """Add geometric shapes to a PDF.

        Supports rectangles, circles (ellipses), lines, and arrows.
        All coordinates are normalized (0-1) and converted to absolute
        page points internally.

        Args:
            input_path: Path to the source PDF file.
            output_path: Where to save the modified PDF.
            shapes: List of shape dicts, each with keys:
                page (int, 1-indexed), type (str: rect/circle/line/arrow),
                x (float, 0-1), y (float, 0-1),
                width (float, 0-1), height (float, 0-1),
                stroke_color (str hex), fill_color (str hex or None),
                stroke_width (float).

        Returns:
            Path to the modified PDF file.

        Raises:
            EditingError: If shape insertion fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                for shape_def in shapes:
                    page_num = shape_def["page"] - 1
                    if page_num < 0 or page_num >= len(doc):
                        raise EditingError(
                            f"Page {shape_def['page']} is out of range. "
                            f"The document has {len(doc)} pages."
                        )

                    page = doc[page_num]
                    rect = page.rect
                    abs_x = shape_def["x"] * rect.width
                    abs_y = shape_def["y"] * rect.height
                    abs_w = shape_def.get("width", 0.1) * rect.width
                    abs_h = shape_def.get("height", 0.1) * rect.height

                    stroke_color = _hex_to_rgb(
                        shape_def.get("stroke_color", "#000000")
                    )
                    fill_color_hex = shape_def.get("fill_color")
                    fill_color = (
                        _hex_to_rgb(fill_color_hex) if fill_color_hex else None
                    )
                    stroke_width = shape_def.get("stroke_width", 1.0)

                    shape = page.new_shape()
                    shape_type = shape_def.get("type", "rect")

                    target_rect = fitz.Rect(
                        abs_x, abs_y, abs_x + abs_w, abs_y + abs_h
                    )

                    if shape_type == "rect":
                        shape.draw_rect(target_rect)
                    elif shape_type == "circle":
                        shape.draw_oval(target_rect)
                    elif shape_type in ("line", "arrow"):
                        start = fitz.Point(abs_x, abs_y)
                        end = fitz.Point(abs_x + abs_w, abs_y + abs_h)
                        shape.draw_line(start, end)

                        if shape_type == "arrow":
                            # Draw arrowhead at the end point
                            angle = math.atan2(
                                end.y - start.y, end.x - start.x
                            )
                            arrow_len = min(15, abs_w * 0.3)
                            left = fitz.Point(
                                end.x - arrow_len * math.cos(angle - 0.4),
                                end.y - arrow_len * math.sin(angle - 0.4),
                            )
                            right = fitz.Point(
                                end.x - arrow_len * math.cos(angle + 0.4),
                                end.y - arrow_len * math.sin(angle + 0.4),
                            )
                            shape.draw_line(end, left)
                            shape.draw_line(end, right)
                    else:
                        raise EditingError(
                            f"Unsupported shape type: '{shape_type}'. "
                            "Supported types: rect, circle, line, arrow."
                        )

                    shape.finish(
                        color=stroke_color,
                        fill=fill_color,
                        width=stroke_width,
                    )
                    shape.commit()

                doc.save(str(output_path))

            logger.info(
                "Added %d shapes to PDF: %s -> %s",
                len(shapes),
                input_path.name,
                output_path.name,
            )
            return output_path

        except EditingError:
            raise
        except Exception as e:
            logger.error("Failed to add shapes: %s", str(e))
            raise EditingError(
                "Failed to add shapes to the PDF. "
                "The file may be corrupted or contain unsupported content."
            ) from e

    @staticmethod
    async def add_freehand_drawing(
        input_path: Path, output_path: Path, drawings: list[dict]
    ) -> Path:
        """Add freehand ink annotations (polylines) to a PDF.

        Each drawing is rendered as a polyline stroke on the specified
        page. Points are normalized to [0, 1] and converted to absolute
        page coordinates internally.

        Args:
            input_path: Path to the source PDF file.
            output_path: Where to save the annotated PDF.
            drawings: List of drawing dicts, each with keys:
                page (int, 1-indexed), color (str hex), width (float,
                stroke width in points), points (list of [x, y] pairs
                with normalized coords in [0, 1]).

        Returns:
            Path to the annotated PDF file.

        Raises:
            EditingError: If drawing insertion fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                for drawing in drawings:
                    page_num = drawing["page"] - 1
                    if page_num < 0 or page_num >= len(doc):
                        raise EditingError(
                            f"Page {drawing['page']} is out of range. "
                            f"The document has {len(doc)} pages."
                        )

                    points = drawing.get("points", [])
                    if len(points) < 2:
                        raise EditingError(
                            "Each drawing must have at least 2 points."
                        )

                    page = doc[page_num]
                    rect = page.rect
                    color = _hex_to_rgb(drawing.get("color", "#000000"))
                    stroke_width = drawing.get("width", 2.0)

                    # Convert normalized coords to absolute page points
                    abs_points = [
                        fitz.Point(pt[0] * rect.width, pt[1] * rect.height)
                        for pt in points
                    ]

                    shape = page.new_shape()
                    shape.draw_polyline(abs_points)
                    shape.finish(
                        color=color,
                        width=stroke_width,
                        closePath=False,
                        fill=None,
                        lineCap=1,  # Round caps for natural pen look
                        lineJoin=1,  # Round joins
                    )
                    shape.commit()

                doc.save(str(output_path))

            logger.info(
                "Added %d freehand drawings to PDF: %s -> %s",
                len(drawings),
                input_path.name,
                output_path.name,
            )
            return output_path

        except EditingError:
            raise
        except Exception as e:
            logger.error("Failed to add freehand drawings: %s", str(e))
            raise EditingError(
                "Failed to add freehand drawings to the PDF. "
                "The file may be corrupted or contain unsupported content."
            ) from e
