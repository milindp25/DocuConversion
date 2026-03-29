"""
PDF organization service.

Handles structural operations on PDFs: merging multiple files,
splitting into parts, compressing file size, rotating and reordering pages.
"""

import logging
from pathlib import Path

import fitz  # PyMuPDF

from app.core.exceptions import OrganizationError

logger = logging.getLogger(__name__)


class OrganizationService:
    """Service for PDF structural operations.

    Merging, splitting, compressing, rotating, and reordering operate
    on the page structure without modifying individual page content.
    """

    @staticmethod
    async def merge_pdfs(input_paths: list[Path], output_path: Path) -> Path:
        """Merge multiple PDF files into a single document.

        Pages are appended in the order of the input list.

        Args:
            input_paths: Ordered list of PDF file paths to merge.
            output_path: Where to save the merged PDF.

        Returns:
            Path to the merged output file.

        Raises:
            OrganizationError: If any input file cannot be read or merge fails.
        """
        try:
            with fitz.open() as merged:
                for path in input_paths:
                    with fitz.open(str(path)) as doc:
                        merged.insert_pdf(doc)

                merged.save(str(output_path))

            logger.info(
                "Merged %d PDFs into %s",
                len(input_paths),
                output_path.name,
            )
            return output_path

        except Exception as e:
            logger.error("PDF merge failed: %s", str(e))
            raise OrganizationError(
                "Failed to merge PDF files. One or more files may be corrupted."
            ) from e

    @staticmethod
    async def split_pdf(
        input_path: Path,
        output_dir: Path,
        page_ranges: list[tuple[int, int]] | None = None,
    ) -> list[Path]:
        """Split a PDF into separate documents by page range.

        If no page ranges are provided, each page becomes its own PDF.

        Args:
            input_path: Path to the source PDF.
            output_dir: Directory to save the split PDFs.
            page_ranges: List of (start, end) page tuples (0-indexed, inclusive).
                         If None, splits into individual pages.

        Returns:
            List of paths to the generated PDF files.

        Raises:
            OrganizationError: If splitting fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                output_paths: list[Path] = []

                if page_ranges is None:
                    # Split each page into its own PDF
                    page_ranges = [(i, i) for i in range(len(doc))]

                for idx, (start, end) in enumerate(page_ranges):
                    with fitz.open() as new_doc:
                        new_doc.insert_pdf(doc, from_page=start, to_page=end)
                        output_path = output_dir / f"split_{idx + 1}_pages_{start + 1}-{end + 1}.pdf"
                        new_doc.save(str(output_path))
                        output_paths.append(output_path)

            logger.info("Split PDF into %d parts", len(output_paths))
            return output_paths

        except Exception as e:
            logger.error("PDF split failed: %s", str(e))
            raise OrganizationError(
                "Failed to split the PDF. The file may be corrupted or the page range is invalid."
            ) from e

    @staticmethod
    async def compress_pdf(input_path: Path, output_path: Path, quality: str = "recommended") -> Path:
        """Compress a PDF to reduce file size.

        Uses PyMuPDF's built-in optimization to reduce size while
        maintaining acceptable quality.

        Args:
            input_path: Path to the source PDF.
            output_path: Where to save the compressed PDF.
            quality: Compression level - 'low', 'recommended', or 'high'.

        Returns:
            Path to the compressed output file.

        Raises:
            OrganizationError: If compression fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                # Compression settings based on quality level
                garbage = {"low": 1, "recommended": 3, "high": 4}.get(quality, 3)
                deflate = quality == "high"

                doc.save(
                    str(output_path),
                    garbage=garbage,
                    deflate=deflate,
                    clean=True,
                )

            original_size = input_path.stat().st_size
            compressed_size = output_path.stat().st_size
            reduction = ((original_size - compressed_size) / original_size) * 100

            logger.info(
                "PDF compressed: %.1f%% reduction (%d KB -> %d KB)",
                reduction,
                original_size // 1024,
                compressed_size // 1024,
            )
            return output_path

        except Exception as e:
            logger.error("PDF compression failed: %s", str(e))
            raise OrganizationError(
                "Failed to compress the PDF. The file may be corrupted."
            ) from e

    @staticmethod
    async def rotate_pages(
        input_path: Path,
        output_path: Path,
        rotation: int = 90,
        pages: str = "all",
    ) -> Path:
        """Rotate pages in a PDF.

        Args:
            input_path: Source PDF path.
            output_path: Destination path.
            rotation: Degrees to rotate (90, 180, 270).
            pages: "all" or comma-separated page numbers (1-indexed).

        Returns:
            Path to the rotated PDF.

        Raises:
            OrganizationError: If rotation fails or parameters are invalid.
        """
        try:
            if rotation not in (90, 180, 270):
                raise OrganizationError(
                    f"Invalid rotation angle: {rotation}. Must be 90, 180, or 270."
                )

            with fitz.open(str(input_path)) as doc:
                # Determine which pages to rotate
                if pages.strip().lower() == "all":
                    target_pages = list(range(len(doc)))
                else:
                    target_pages = []
                    for part in pages.split(","):
                        part = part.strip()
                        if not part:
                            continue
                        page_num = int(part) - 1  # Convert 1-indexed to 0-indexed
                        if page_num < 0 or page_num >= len(doc):
                            raise OrganizationError(
                                f"Page {int(part)} is out of range. "
                                f"Document has {len(doc)} pages."
                            )
                        target_pages.append(page_num)

                for page_idx in target_pages:
                    page = doc[page_idx]
                    page.set_rotation((page.rotation + rotation) % 360)

                doc.save(str(output_path))

            logger.info(
                "Rotated %d pages by %d degrees -> %s",
                len(target_pages),
                rotation,
                output_path.name,
            )
            return output_path

        except OrganizationError:
            raise
        except Exception as e:
            logger.error("PDF rotation failed: %s", str(e))
            raise OrganizationError(
                "Failed to rotate PDF pages. The file may be corrupted "
                "or the page specification is invalid."
            ) from e
