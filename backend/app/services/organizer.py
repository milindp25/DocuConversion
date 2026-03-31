"""
PDF organization service.

Handles structural operations on PDFs: merging multiple files,
splitting into parts, compressing file size, rotating, reordering,
adding, and removing pages.
"""

import logging
import shutil
from pathlib import Path

import fitz  # PyMuPDF

from app.core.exceptions import OrganizationError

logger = logging.getLogger(__name__)


class OrganizationService:
    """Service for PDF structural operations.

    Merging, splitting, compressing, rotating, reordering, adding,
    and removing pages operate on the page structure without modifying
    individual page content.
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
    async def compress_pdf(
        input_path: Path, output_path: Path, quality: str = "recommended"
    ) -> dict:
        """Compress a PDF to reduce file size.

        Uses PyMuPDF's built-in optimization to reduce size while
        maintaining acceptable quality.

        Args:
            input_path: Path to the source PDF.
            output_path: Where to save the compressed PDF.
            quality: Compression level - 'low', 'recommended', or 'high'.

        Returns:
            Dict with 'path', 'original_size_kb', 'compressed_size_kb',
            and 'reduction_percent'.

        Raises:
            OrganizationError: If compression fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
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

            if compressed_size >= original_size:
                # Compression didn't help -- return the original unchanged
                shutil.copy2(str(input_path), str(output_path))
                compressed_size = original_size
                reduction = 0.0
                logger.info(
                    "PDF already optimized (%d KB), returning original",
                    original_size // 1024,
                )
            else:
                reduction = (
                    ((original_size - compressed_size) / original_size) * 100
                    if original_size > 0
                    else 0.0
                )
                logger.info(
                    "PDF compressed: %.1f%% reduction (%d KB -> %d KB)",
                    reduction,
                    original_size // 1024,
                    compressed_size // 1024,
                )

            return {
                "path": output_path,
                "original_size_kb": round(original_size / 1024, 1),
                "compressed_size_kb": round(compressed_size / 1024, 1),
                "reduction_percent": round(reduction, 1),
                "message": (
                    "File is already optimized"
                    if reduction == 0.0
                    else f"Reduced by {round(reduction, 1)}%"
                ),
            }

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

    @staticmethod
    async def reorder_pages(
        input_path: Path, output_path: Path, page_order: list[int]
    ) -> Path:
        """Reorder pages in a PDF based on a new page sequence.

        Args:
            input_path: Path to the source PDF.
            output_path: Where to save the reordered PDF.
            page_order: List of 1-indexed page numbers in desired order.
                        e.g. [3, 1, 2] puts page 3 first, then 1, then 2.

        Returns:
            Path to the reordered PDF.

        Raises:
            OrganizationError: If reordering fails or page numbers are invalid.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                total = len(doc)

                # Validate page numbers
                for p in page_order:
                    if p < 1 or p > total:
                        raise OrganizationError(
                            f"Page {p} is out of range. "
                            f"Document has {total} pages."
                        )

                # Convert to 0-indexed
                zero_indexed = [p - 1 for p in page_order]

                doc.select(zero_indexed)
                doc.save(str(output_path))

            logger.info(
                "Reordered %d pages -> %s",
                len(page_order),
                output_path.name,
            )
            return output_path

        except OrganizationError:
            raise
        except Exception as e:
            logger.error("PDF reorder failed: %s", str(e))
            raise OrganizationError(
                "Failed to reorder PDF pages. "
                "The file may be corrupted or the page order is invalid."
            ) from e

    @staticmethod
    async def remove_pages(
        input_path: Path, output_path: Path, pages_to_remove: list[int]
    ) -> Path:
        """Remove specified pages from a PDF.

        Args:
            input_path: Path to the source PDF.
            output_path: Where to save the result.
            pages_to_remove: List of 1-indexed page numbers to remove.

        Returns:
            Path to the output PDF with pages removed.

        Raises:
            OrganizationError: If removal fails or page numbers are invalid.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                total = len(doc)

                if not pages_to_remove:
                    raise OrganizationError(
                        "No pages specified for removal."
                    )

                # Validate page numbers
                for p in pages_to_remove:
                    if p < 1 or p > total:
                        raise OrganizationError(
                            f"Page {p} is out of range. "
                            f"Document has {total} pages."
                        )

                if len(set(pages_to_remove)) >= total:
                    raise OrganizationError(
                        "Cannot remove all pages from the document. "
                        "At least one page must remain."
                    )

                # Convert to 0-indexed and sort descending for safe deletion
                zero_indexed = sorted(
                    {p - 1 for p in pages_to_remove}, reverse=True
                )
                for page_idx in zero_indexed:
                    doc.delete_page(page_idx)

                doc.save(str(output_path))

            logger.info(
                "Removed %d pages from PDF -> %s",
                len(pages_to_remove),
                output_path.name,
            )
            return output_path

        except OrganizationError:
            raise
        except Exception as e:
            logger.error("PDF page removal failed: %s", str(e))
            raise OrganizationError(
                "Failed to remove pages from the PDF. "
                "The file may be corrupted or the page numbers are invalid."
            ) from e

    @staticmethod
    async def add_bookmarks(
        input_path: Path, output_path: Path, bookmarks: list[dict]
    ) -> Path:
        """Add bookmarks (table of contents) to a PDF.

        Each bookmark dict has:
            title (str): Display text for the bookmark.
            page (int): Target page number, 1-indexed.
            level (int): Nesting depth, 0 = top-level.

        PyMuPDF's ``set_toc`` expects a list of ``[level, title, page]``
        entries where level starts at 1 (not 0), so we add 1 internally.

        Args:
            input_path: Path to the source PDF.
            output_path: Where to save the bookmarked PDF.
            bookmarks: List of bookmark dicts with title, page, and level.

        Returns:
            Path to the output PDF with bookmarks added.

        Raises:
            OrganizationError: If adding bookmarks fails.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                total_pages = len(doc)

                # Validate page numbers
                for bm in bookmarks:
                    if bm["page"] < 1 or bm["page"] > total_pages:
                        raise OrganizationError(
                            f"Bookmark page {bm['page']} is out of range. "
                            f"Document has {total_pages} pages."
                        )

                # Build TOC list: [level (1-based), title, page]
                toc = [
                    [bm["level"] + 1, bm["title"], bm["page"]]
                    for bm in bookmarks
                ]

                doc.set_toc(toc)
                doc.save(str(output_path))

            logger.info(
                "Added %d bookmarks to PDF -> %s",
                len(bookmarks),
                output_path.name,
            )
            return output_path

        except OrganizationError:
            raise
        except Exception as e:
            logger.error("PDF bookmark addition failed: %s", str(e))
            raise OrganizationError(
                "Failed to add bookmarks to the PDF. "
                "The file may be corrupted or the bookmark data is invalid."
            ) from e

    @staticmethod
    async def add_pages(
        input_path: Path,
        insert_path: Path,
        output_path: Path,
        after_page: int = 0,
    ) -> Path:
        """Insert pages from one PDF into another.

        Args:
            input_path: The main PDF to insert pages into.
            insert_path: The PDF whose pages will be inserted.
            output_path: Where to save the combined result.
            after_page: Insert after this page (1-indexed, 0 means at start).

        Returns:
            Path to the output PDF with inserted pages.

        Raises:
            OrganizationError: If insertion fails or parameters are invalid.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                total = len(doc)

                if after_page < 0 or after_page > total:
                    raise OrganizationError(
                        f"Insert position {after_page} is out of range. "
                        f"Must be between 0 and {total} (document has {total} pages)."
                    )

                with fitz.open(str(insert_path)) as insert_doc:
                    if len(insert_doc) == 0:
                        raise OrganizationError(
                            "The PDF to insert contains no pages."
                        )

                    # insert_pdf's start_at is 0-indexed page position
                    doc.insert_pdf(insert_doc, start_at=after_page)

                doc.save(str(output_path))

            logger.info(
                "Inserted pages after page %d -> %s",
                after_page,
                output_path.name,
            )
            return output_path

        except OrganizationError:
            raise
        except Exception as e:
            logger.error("PDF page insertion failed: %s", str(e))
            raise OrganizationError(
                "Failed to insert pages into the PDF. "
                "One or both files may be corrupted."
            ) from e
