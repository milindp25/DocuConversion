"""
PDF conversion service.

Handles the core logic for converting between PDF and other document
formats. Uses PyMuPDF for PDF reading, python-docx for Word output,
Pillow for image processing, and ReportLab for PDF generation.
"""

import io
import logging
import textwrap
import zipfile
from pathlib import Path

import fitz  # PyMuPDF
from docx import Document
from docx.shared import Pt, Inches
from openpyxl import Workbook
from PIL import Image
from pptx import Presentation
from pptx.util import Inches as PptxInches, Emu
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from app.core.exceptions import ConversionError

logger = logging.getLogger(__name__)


class ConversionService:
    """Service for converting documents between PDF and other formats.

    Each conversion method reads the source file, processes it using
    the appropriate library, and returns the path to the output file.
    All methods are designed to be called from the API layer.
    """

    @staticmethod
    async def pdf_to_text(input_path: Path) -> str:
        """Extract all text content from a PDF document.

        Uses PyMuPDF's text extraction which preserves basic structure
        like paragraphs and line breaks.

        Args:
            input_path: Path to the source PDF file.

        Returns:
            Extracted text content as a string.

        Raises:
            ConversionError: If the PDF cannot be read or processed.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                text_parts: list[str] = []

                for page_num in range(len(doc)):
                    page = doc[page_num]
                    text_parts.append(page.get_text())

                return "\n\n".join(text_parts)

        except Exception as e:
            logger.error("PDF to text extraction failed: %s", str(e))
            raise ConversionError(
                "Failed to extract text from the PDF. "
                "The file may be corrupted or contain only scanned images. "
                "Try using OCR for scanned documents."
            ) from e

    @staticmethod
    async def pdf_to_text_file(input_path: Path, output_path: Path) -> Path:
        """Extract text from a PDF and save it to a UTF-8 text file.

        Delegates to ``pdf_to_text`` for extraction, then writes the
        resulting string to *output_path* as a plain ``.txt`` file.

        Args:
            input_path: Path to the source PDF file.
            output_path: Where to save the generated text file.

        Returns:
            Path to the created text file.

        Raises:
            ConversionError: If the PDF cannot be read or text file creation fails.
        """
        text = await ConversionService.pdf_to_text(input_path)
        try:
            output_path.write_text(text, encoding="utf-8")
            logger.info(
                "PDF to text file conversion complete: %s -> %s",
                input_path.name,
                output_path.name,
            )
            return output_path
        except Exception as e:
            logger.error("PDF to text file write failed: %s", str(e))
            raise ConversionError(
                "Failed to write extracted text to file."
            ) from e

    @staticmethod
    async def pdf_to_word(input_path: Path, output_path: Path) -> Path:
        """Convert a PDF document to Word (.docx) format.

        Extracts text from each page and creates a Word document with
        basic formatting preserved (paragraphs per page, standard font).
        Images and complex layouts are not preserved in Phase 1.

        Args:
            input_path: Path to the source PDF file.
            output_path: Where to save the generated Word document.

        Returns:
            Path to the created Word document.

        Raises:
            ConversionError: If the PDF cannot be read or Word creation fails.
        """
        try:
            doc_word = Document()

            # Set default font
            style = doc_word.styles["Normal"]
            font = style.font
            font.name = "Calibri"
            font.size = Pt(11)

            with fitz.open(str(input_path)) as pdf_doc:
                total_pages = len(pdf_doc)

                for page_num in range(total_pages):
                    page = pdf_doc[page_num]
                    blocks = page.get_text("blocks")

                    # Add page header
                    if total_pages > 1:
                        heading = doc_word.add_paragraph()
                        run = heading.add_run(f"--- Page {page_num + 1} ---")
                        run.bold = True
                        run.font.size = Pt(9)
                        run.font.color.rgb = None

                    # Process each text block on the page
                    for block in blocks:
                        # block format: (x0, y0, x1, y1, text, block_no, block_type)
                        if block[6] == 0:  # text block (not image)
                            text = block[4].strip()
                            if text:
                                doc_word.add_paragraph(text)

                    # Add page break between pages (except the last)
                    if page_num < total_pages - 1:
                        doc_word.add_page_break()

            doc_word.save(str(output_path))

            logger.info(
                "PDF to Word conversion complete: %d pages -> %s",
                total_pages,
                output_path.name,
            )
            return output_path

        except Exception as e:
            logger.error("PDF to Word conversion failed: %s", str(e))
            raise ConversionError(
                "Failed to convert PDF to Word format. "
                "The file may be corrupted or contain unsupported content."
            ) from e

    @staticmethod
    async def pdf_to_images(
        input_path: Path, output_dir: Path, dpi: int = 200
    ) -> list[Path]:
        """Convert each page of a PDF to a PNG image.

        Renders each page at the specified DPI for high-quality output.

        Args:
            input_path: Path to the source PDF file.
            output_dir: Directory to save the output images.
            dpi: Resolution for rendering (dots per inch). Default 200.

        Returns:
            List of paths to the generated image files.

        Raises:
            ConversionError: If rendering fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                if len(doc) > 300:
                    raise ConversionError(
                        "PDF has too many pages (max 300)."
                    )
                output_paths: list[Path] = []
                zoom = dpi / 72  # PyMuPDF uses 72 DPI as base

                for page_num in range(len(doc)):
                    page = doc[page_num]
                    mat = fitz.Matrix(zoom, zoom)
                    pix = page.get_pixmap(matrix=mat)

                    output_path = output_dir / f"page_{page_num + 1}.png"
                    pix.save(str(output_path))
                    output_paths.append(output_path)

                logger.info(
                    "PDF to images conversion complete: %d pages rendered at %d DPI",
                    len(output_paths),
                    dpi,
                )
                return output_paths

        except Exception as e:
            logger.error("PDF to image conversion failed: %s", str(e))
            raise ConversionError(
                "Failed to convert PDF pages to images. The file may be corrupted."
            ) from e

    @staticmethod
    async def pdf_to_images_zip(
        input_path: Path, output_path: Path, dpi: int = 200
    ) -> Path:
        """Convert each page of a PDF to PNG images and bundle as a ZIP.

        Convenience method that creates a ZIP archive containing all
        page images, suitable for single-file download.

        Args:
            input_path: Path to the source PDF file.
            output_path: Path for the output ZIP file.
            dpi: Resolution for rendering. Default 200.

        Returns:
            Path to the ZIP archive containing all page images.

        Raises:
            ConversionError: If rendering or archiving fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                if len(doc) > 300:
                    raise ConversionError(
                        "PDF has too many pages (max 300)."
                    )
                zoom = dpi / 72

                with zipfile.ZipFile(str(output_path), "w", zipfile.ZIP_DEFLATED) as zf:
                    for page_num in range(len(doc)):
                        page = doc[page_num]
                        mat = fitz.Matrix(zoom, zoom)
                        pix = page.get_pixmap(matrix=mat)

                        img_name = f"page_{page_num + 1}.png"
                        zf.writestr(img_name, pix.tobytes("png"))

                logger.info(
                    "PDF to images ZIP complete: %d pages at %d DPI -> %s",
                    len(doc),
                    dpi,
                    output_path.name,
                )
                return output_path

        except Exception as e:
            logger.error("PDF to images ZIP failed: %s", str(e))
            raise ConversionError(
                "Failed to convert PDF pages to images. The file may be corrupted."
            ) from e

    @staticmethod
    async def image_to_pdf(input_path: Path, output_path: Path) -> Path:
        """Convert an image file to a PDF document.

        Opens the image with Pillow, determines its dimensions, and
        creates a PDF page sized to match using ReportLab. The image
        is fitted to the page while preserving its aspect ratio.

        Args:
            input_path: Path to the source image file.
            output_path: Where to save the generated PDF.

        Returns:
            Path to the created PDF file.

        Raises:
            ConversionError: If the image cannot be read or PDF creation fails.
        """
        try:
            with Image.open(str(input_path)) as img:
                # Convert RGBA to RGB if necessary (PDF doesn't support alpha)
                if img.mode == "RGBA":
                    background = Image.new("RGB", img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3])
                    img = background
                elif img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")

                img_width, img_height = img.size

                # Create a page sized to the image (in points, 72 DPI)
                # Cap at reasonable page size, scale down if needed
                max_dimension = 14400  # 200 inches at 72 DPI
                scale = min(1.0, max_dimension / max(img_width, img_height))
                page_width = img_width * scale
                page_height = img_height * scale

                # Save image to a bytes buffer for ReportLab
                img_buffer = io.BytesIO()
                img.save(img_buffer, format="PNG")
                img_buffer.seek(0)

            c = canvas.Canvas(str(output_path), pagesize=(page_width, page_height))
            c.drawImage(
                ImageReader(img_buffer),
                0,
                0,
                width=page_width,
                height=page_height,
            )
            c.save()

            logger.info(
                "Image to PDF conversion complete: %dx%d -> %s",
                img_width,
                img_height,
                output_path.name,
            )
            return output_path

        except Exception as e:
            logger.error("Image to PDF conversion failed: %s", str(e))
            raise ConversionError(
                "Failed to convert image to PDF. "
                "The image may be corrupted or in an unsupported format."
            ) from e

    @staticmethod
    async def word_to_pdf(input_path: Path, output_path: Path) -> Path:
        """Convert a Word document to PDF format.

        Phase 1 placeholder: This requires LibreOffice or a similar engine
        for accurate rendering. Currently returns a basic PDF with the
        extracted text content. Full fidelity conversion will be available
        in Phase 2 with a LibreOffice soffice backend.

        Args:
            input_path: Path to the source Word document.
            output_path: Where to save the generated PDF.

        Returns:
            Path to the created PDF file.

        Raises:
            ConversionError: If the Word document cannot be read or PDF creation fails.
        """
        try:
            doc = Document(str(input_path))

            c = canvas.Canvas(str(output_path), pagesize=letter)
            width, height = letter
            margin = 72  # 1 inch margins
            y_position = height - margin
            line_height = 14

            for paragraph in doc.paragraphs:
                text = paragraph.text.strip()
                if not text:
                    y_position -= line_height
                    continue

                # Wrap text at word boundaries for readable output
                lines = textwrap.wrap(text, width=80)

                for line in lines:
                    if y_position < margin:
                        c.showPage()
                        y_position = height - margin

                    c.setFont("Helvetica", 11)
                    c.drawString(margin, y_position, line)
                    y_position -= line_height

            c.save()

            logger.info(
                "Word to PDF conversion complete (Phase 1 text-only): %s",
                output_path.name,
            )
            return output_path

        except Exception as e:
            logger.error("Word to PDF conversion failed: %s", str(e))
            raise ConversionError(
                "Failed to convert Word document to PDF. "
                "The file may be corrupted or in an unsupported format. "
                "Note: Full fidelity Word-to-PDF conversion requires Phase 2."
            ) from e

    @staticmethod
    async def pdf_to_excel(input_path: Path, output_path: Path) -> Path:
        """Convert a PDF document to Excel (.xlsx) format.

        Extracts tabular data using PyMuPDF's built-in table detection.
        Falls back to placing each text line in column A when no tables
        are found on a page.

        Args:
            input_path: Path to the source PDF file.
            output_path: Where to save the generated Excel workbook.

        Returns:
            Path to the created Excel workbook.

        Raises:
            ConversionError: If the PDF cannot be read or Excel creation fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                if len(doc) > 300:
                    raise ConversionError(
                        "PDF has too many pages (max 300). "
                        "Please split the document and try again."
                    )

                wb = Workbook()
                sheets_created = 0

                for page_num in range(len(doc)):
                    page = doc[page_num]
                    ws = wb.create_sheet(title=f"Page {page_num + 1}")
                    sheets_created += 1
                    row_cursor = 1

                    # Try built-in table detection (PyMuPDF 1.23+)
                    tables = page.find_tables()
                    if tables and len(tables.tables) > 0:
                        for table in tables.tables:
                            for row_data in table.extract():
                                for col_idx, cell_value in enumerate(row_data, start=1):
                                    ws.cell(
                                        row=row_cursor,
                                        column=col_idx,
                                        value=cell_value if cell_value else "",
                                    )
                                row_cursor += 1
                            # Blank row between tables
                            row_cursor += 1
                    else:
                        # Fallback: write each text line into column A
                        text = page.get_text("text")
                        for line in text.split("\n"):
                            stripped = line.strip()
                            if stripped:
                                ws.cell(row=row_cursor, column=1, value=stripped)
                                row_cursor += 1

                # Remove the default empty sheet created by Workbook()
                if sheets_created > 0 and "Sheet" in wb.sheetnames:
                    del wb["Sheet"]

                wb.save(str(output_path))

                logger.info(
                    "PDF to Excel conversion complete: %d pages -> %s",
                    len(doc),
                    output_path.name,
                )
                return output_path

        except ConversionError:
            raise
        except Exception as e:
            logger.error("PDF to Excel conversion failed: %s", str(e))
            raise ConversionError(
                "Failed to convert PDF to Excel format. "
                "The file may be corrupted or contain unsupported content."
            ) from e

    @staticmethod
    async def pdf_to_powerpoint(input_path: Path, output_path: Path) -> Path:
        """Convert a PDF document to PowerPoint (.pptx) format.

        Renders each PDF page as a full-bleed background image on a slide
        and includes the extracted text as speaker notes for accessibility.

        Args:
            input_path: Path to the source PDF file.
            output_path: Where to save the generated PowerPoint presentation.

        Returns:
            Path to the created PowerPoint presentation.

        Raises:
            ConversionError: If the PDF cannot be read or presentation creation fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                if len(doc) > 300:
                    raise ConversionError(
                        "PDF has too many pages (max 300). "
                        "Please split the document and try again."
                    )

                prs = Presentation()
                # Set 16:9 slide dimensions (13.333 x 7.5 inches)
                prs.slide_width = Emu(int(13.333 * 914400))
                prs.slide_height = Emu(int(7.5 * 914400))

                # Use the blank slide layout (index 6 is typically blank)
                blank_layout = prs.slide_layouts[6]

                tmp_dir = output_path.parent

                for page_num in range(len(doc)):
                    page = doc[page_num]

                    # Render page as PNG at 150 DPI
                    zoom = 150 / 72
                    mat = fitz.Matrix(zoom, zoom)
                    pix = page.get_pixmap(matrix=mat)
                    img_path = tmp_dir / f"slide_{page_num + 1}.png"
                    pix.save(str(img_path))

                    # Add blank slide
                    slide = prs.slides.add_slide(blank_layout)

                    # Add image as full-bleed background
                    slide.shapes.add_picture(
                        str(img_path),
                        left=Emu(0),
                        top=Emu(0),
                        width=prs.slide_width,
                        height=prs.slide_height,
                    )

                    # Extract text and add as speaker notes
                    text = page.get_text("text").strip()
                    if text:
                        notes_slide = slide.notes_slide
                        notes_slide.notes_text_frame.text = text

                prs.save(str(output_path))

                logger.info(
                    "PDF to PowerPoint conversion complete: %d pages -> %s",
                    len(doc),
                    output_path.name,
                )
                return output_path

        except ConversionError:
            raise
        except Exception as e:
            logger.error("PDF to PowerPoint conversion failed: %s", str(e))
            raise ConversionError(
                "Failed to convert PDF to PowerPoint format. "
                "The file may be corrupted or contain unsupported content."
            ) from e
