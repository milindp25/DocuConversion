"""
PDF comparison and flattening services.

Provides text-based PDF comparison using difflib and PDF flattening
that bakes annotations into page content using PyMuPDF.
"""

import asyncio
import difflib
import logging
from pathlib import Path

import fitz  # PyMuPDF

from app.core.exceptions import ConversionError

logger = logging.getLogger(__name__)


class PdfDiffService:
    """Service for comparing and flattening PDF documents.

    Comparison works by extracting text from both PDFs and computing
    a unified diff. Flattening renders each page to an image and
    rebuilds the PDF, effectively baking in all annotations.
    """

    @staticmethod
    async def compare_pdfs(file1_path: Path, file2_path: Path) -> dict:
        """Compare two PDFs by their text content.

        Extracts text from both files and computes a unified diff to
        identify additions and deletions between them.

        Args:
            file1_path: Path to the first (original) PDF.
            file2_path: Path to the second (modified) PDF.

        Returns:
            Dict with keys: additions, deletions, similarity_score.

        Raises:
            ConversionError: If either PDF cannot be read.
        """
        try:
            def _extract_and_diff() -> dict:
                """Extract text from both PDFs and compute diff."""
                with fitz.open(str(file1_path)) as doc1:
                    text1_lines = []
                    for page_num in range(len(doc1)):
                        text1_lines.extend(
                            doc1[page_num].get_text().splitlines()
                        )

                with fitz.open(str(file2_path)) as doc2:
                    text2_lines = []
                    for page_num in range(len(doc2)):
                        text2_lines.extend(
                            doc2[page_num].get_text().splitlines()
                        )

                # Compute unified diff
                diff = list(difflib.unified_diff(
                    text1_lines, text2_lines, lineterm=""
                ))

                additions = [
                    line[1:] for line in diff
                    if line.startswith("+") and not line.startswith("+++")
                ]
                deletions = [
                    line[1:] for line in diff
                    if line.startswith("-") and not line.startswith("---")
                ]

                # Compute similarity ratio
                matcher = difflib.SequenceMatcher(
                    None, "\n".join(text1_lines), "\n".join(text2_lines)
                )
                similarity_score = round(matcher.ratio(), 4)

                return {
                    "additions": additions,
                    "deletions": deletions,
                    "similarity_score": similarity_score,
                }

            result = await asyncio.to_thread(_extract_and_diff)

            logger.info(
                "PDF comparison complete: %d additions, %d deletions, "
                "similarity=%.2f",
                len(result["additions"]),
                len(result["deletions"]),
                result["similarity_score"],
            )
            return result

        except Exception as e:
            logger.error("PDF comparison failed: %s", str(e))
            raise ConversionError(
                "Failed to compare the PDF files. "
                "One or both files may be corrupted."
            ) from e

    @staticmethod
    async def flatten_pdf(input_path: Path, output_path: Path) -> Path:
        """Flatten a PDF by baking annotations into page content.

        Renders each page (with annotations) as a high-resolution image,
        then rebuilds the PDF from those images. This effectively removes
        all interactive annotation layers.

        Args:
            input_path: Path to the source PDF with annotations.
            output_path: Where to save the flattened PDF.

        Returns:
            Path to the flattened PDF file.

        Raises:
            ConversionError: If the PDF cannot be read or flattening fails.
        """
        try:
            def _flatten() -> None:
                """Render each page to image and rebuild as flat PDF."""
                with fitz.open(str(input_path)) as src_doc:
                    out_doc = fitz.open()

                    for page_num in range(len(src_doc)):
                        src_page = src_doc[page_num]

                        # Render page with annotations at 150 DPI
                        zoom = 150 / 72
                        mat = fitz.Matrix(zoom, zoom)
                        pix = src_page.get_pixmap(matrix=mat)

                        # Create new page with original dimensions
                        rect = src_page.rect
                        new_page = out_doc.new_page(
                            width=rect.width, height=rect.height
                        )

                        # Insert the rendered image as the page content
                        new_page.insert_image(rect, pixmap=pix)

                    out_doc.save(str(output_path))
                    out_doc.close()

            await asyncio.to_thread(_flatten)

            logger.info("PDF flattening complete: %s", output_path.name)
            return output_path

        except Exception as e:
            logger.error("PDF flattening failed: %s", str(e))
            raise ConversionError(
                "Failed to flatten the PDF. "
                "The file may be corrupted or contain unsupported content."
            ) from e
