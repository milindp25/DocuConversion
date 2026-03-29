"""
PDF preview and info API endpoints.

Provides metadata extraction and page rendering for PDF documents.
The info endpoint returns page count, dimensions, and encryption status.
The render endpoint produces a PNG preview of a single page.
"""

import io
import logging
import re
import tempfile
from pathlib import Path

import fitz  # PyMuPDF
from fastapi import APIRouter, File, Form, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address

from fastapi.responses import StreamingResponse

limiter = Limiter(key_func=get_remote_address)

from app.core.exceptions import (
    EditingError,
    FileValidationError,
    handle_docuconversion_error,
)
from app.models.schemas import PdfInfoResponse, PdfPageInfo
from app.utils.file_validation import validate_pdf_upload

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/info", response_model=PdfInfoResponse)
@limiter.limit("10/minute")
async def get_pdf_info(request: Request, file: UploadFile = File(...)) -> PdfInfoResponse:
    """Get PDF metadata: page count, per-page dimensions, encryption status.

    Reads the PDF and extracts structural metadata without modifying
    the document. Useful for the frontend to set up the editor canvas
    before the user starts editing.

    Args:
        file: The PDF file to inspect (multipart upload).

    Returns:
        PdfInfoResponse with page count, dimensions, encryption, and title.
    """
    try:
        file_content = await validate_pdf_upload(file)

        with tempfile.TemporaryDirectory() as tmp_dir:
            input_path = Path(tmp_dir) / "input.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            with fitz.open(str(input_path)) as doc:
                pages: list[PdfPageInfo] = []
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    pages.append(
                        PdfPageInfo(
                            width=round(page.rect.width, 2),
                            height=round(page.rect.height, 2),
                        )
                    )

                title = doc.metadata.get("title", "") if doc.metadata else ""
                is_encrypted = doc.is_encrypted

        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        logger.info(
            "PDF info extracted: file=%s, pages=%d, encrypted=%s",
            safe_name,
            len(pages),
            is_encrypted,
        )

        return PdfInfoResponse(
            page_count=len(pages),
            pages=pages,
            is_encrypted=is_encrypted,
            title=title or "",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except Exception as e:
        logger.error("Failed to extract PDF info: %s", str(e))
        raise handle_docuconversion_error(
            EditingError(
                "Failed to read PDF metadata. The file may be corrupted."
            )
        ) from e


@router.post("/render-page")
@limiter.limit("10/minute")
async def render_page(
    request: Request,
    file: UploadFile = File(...),
    page: int = Form(1),
    dpi: int = Form(150),
) -> StreamingResponse:
    """Render a single PDF page as a PNG image for preview.

    Returns the PNG image directly as a streaming response. This
    endpoint is designed for lightweight page previews in the editor
    and does not store the result in R2.

    Args:
        file: The PDF file to render (multipart upload).
        page: Page number to render (1-indexed). Defaults to 1.
        dpi: Resolution for rendering in dots per inch. Defaults to 150.

    Returns:
        StreamingResponse containing the PNG image data.
    """
    try:
        if page < 1:
            raise FileValidationError("Page number must be at least 1.")
        if dpi < 36 or dpi > 600:
            raise FileValidationError("DPI must be between 36 and 600.")

        file_content = await validate_pdf_upload(file)

        with tempfile.TemporaryDirectory() as tmp_dir:
            input_path = Path(tmp_dir) / "input.pdf"

            with open(input_path, "wb") as f:
                f.write(file_content)

            with fitz.open(str(input_path)) as doc:
                if page > len(doc):
                    raise FileValidationError(
                        f"Page {page} is out of range. "
                        f"The document has {len(doc)} pages."
                    )

                target_page = doc[page - 1]
                zoom = dpi / 72  # PyMuPDF uses 72 DPI as base

                # Reject excessively large rendered dimensions to prevent OOM
                pixel_width = target_page.rect.width * zoom
                pixel_height = target_page.rect.height * zoom
                if pixel_width * pixel_height > 100_000_000:
                    raise FileValidationError(
                        "Page dimensions too large for the requested DPI."
                    )

                mat = fitz.Matrix(zoom, zoom)
                pix = target_page.get_pixmap(matrix=mat)

                png_bytes = pix.tobytes("png")

        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        logger.info(
            "Rendered page %d of %s at %d DPI (%d bytes)",
            page,
            safe_name,
            dpi,
            len(png_bytes),
        )

        return StreamingResponse(
            io.BytesIO(png_bytes),
            media_type="image/png",
            headers={
                "Content-Disposition": f'inline; filename="page_{page}.png"',
            },
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except Exception as e:
        logger.error("Failed to render PDF page: %s", str(e))
        raise handle_docuconversion_error(
            EditingError(
                "Failed to render the PDF page. The file may be corrupted."
            )
        ) from e
