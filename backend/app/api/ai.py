"""
AI-powered document analysis endpoints.

Provides PDF summarization, chat-with-PDF, structured data extraction,
and OCR via Google Gemini. All endpoints use rate limiting and optional
authentication following the same patterns as the conversion endpoints.
"""

import logging
import re
import tempfile
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from app.core.auth import UserClaims
from app.core.dependencies import get_optional_user
from app.core.exceptions import (
    AiError,
    FileValidationError,
    StorageError,
    handle_docuconversion_error,
)
from app.models.schemas import (
    AiChatResponse,
    AiExtractionResponse,
    AiSummaryResponse,
    JobStatus,
    ProcessingResponse,
)
from app.services.ai_service import AiService
from app.services.job_manager import job_manager
from app.services.storage import get_storage
from app.utils.file_validation import validate_pdf_upload

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/summarize")
@limiter.limit("10/minute")
async def summarize_pdf(
    request: Request,
    file: UploadFile = File(...),
    length: str = Form(default="medium"),
    user: UserClaims | None = Depends(get_optional_user),
) -> JSONResponse:
    """Summarize a PDF document using AI.

    Extracts text from the uploaded PDF and generates a markdown-formatted
    summary at the requested length using Google Gemini.

    Args:
        file: The PDF file to summarize (multipart upload).
        length: Desired summary length — 'short', 'medium', or 'long'.

    Returns:
        JSONResponse with AiSummaryResponse containing the summary.
    """
    try:
        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        logger.info("PDF summarization started: file=%s, length=%s", safe_name, length)

        if length not in ("short", "medium", "long"):
            length = "medium"

        with tempfile.TemporaryDirectory() as tmp_dir:
            input_path = Path(tmp_dir) / "input.pdf"
            with open(input_path, "wb") as f:
                f.write(file_content)

            result = await AiService.summarize_pdf(input_path, length)

        response = AiSummaryResponse(**result)
        return JSONResponse(content=response.model_dump())

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except AiError as e:
        raise handle_docuconversion_error(e) from e


@router.post("/chat")
@limiter.limit("10/minute")
async def chat_with_pdf(
    request: Request,
    question: str = Form(...),
    session_id: str = Form(default=""),
    file: UploadFile | None = File(default=None),
    user: UserClaims | None = Depends(get_optional_user),
) -> JSONResponse:
    """Ask questions about a PDF document using AI.

    Maintains a chat session so follow-up questions have context.
    The PDF file is required on the first message of a session.
    Subsequent messages in the same session only need the question
    and session_id — the extracted text is cached server-side.

    Args:
        question: The question to ask about the document.
        session_id: Session ID for conversation continuity. Auto-generated if empty.
        file: The PDF file (required on first message, optional on follow-ups).

    Returns:
        JSONResponse with AiChatResponse containing the answer.
    """
    try:
        if not session_id:
            session_id = str(uuid.uuid4())

        # Check if this is a new session that needs a PDF file
        is_existing_session = AiService.has_session(session_id)

        if not is_existing_session and file is None:
            raise FileValidationError(
                "A PDF file is required for the first message in a chat session. "
                "Upload a PDF to start the conversation."
            )

        input_path = None
        if file is not None:
            file_content = await validate_pdf_upload(file)
            safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
            logger.info("Chat with PDF started: file=%s, session=%s", safe_name, session_id)

            # Write to temp file for text extraction
            tmp_dir_obj = tempfile.TemporaryDirectory()
            tmp_dir = tmp_dir_obj.name
            input_path = Path(tmp_dir) / "input.pdf"
            with open(input_path, "wb") as f:
                f.write(file_content)
        else:
            logger.info("Chat follow-up: session=%s", session_id)

        result = await AiService.chat_with_pdf(input_path, question, session_id)

        # Clean up temp dir if we created one
        if input_path is not None:
            tmp_dir_obj.cleanup()

        response = AiChatResponse(**result)
        return JSONResponse(content=response.model_dump())

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except AiError as e:
        raise handle_docuconversion_error(e) from e


@router.post("/extract")
@limiter.limit("10/minute")
async def extract_data(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> JSONResponse:
    """Extract structured data from a PDF using AI.

    Identifies and extracts tables, key-value pairs, and named entities
    from the document using Google Gemini.

    Args:
        file: The PDF file to analyze (multipart upload).

    Returns:
        JSONResponse with AiExtractionResponse containing extracted data.
    """
    try:
        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        logger.info("Data extraction started: file=%s", safe_name)

        with tempfile.TemporaryDirectory() as tmp_dir:
            input_path = Path(tmp_dir) / "input.pdf"
            with open(input_path, "wb") as f:
                f.write(file_content)

            result = await AiService.extract_data(input_path)

        response = AiExtractionResponse(**result)
        return JSONResponse(content=response.model_dump())

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except AiError as e:
        raise handle_docuconversion_error(e) from e


@router.post("/ocr", response_model=ProcessingResponse)
@limiter.limit("10/minute")
async def ocr_pdf(
    request: Request,
    file: UploadFile = File(...),
    user: UserClaims | None = Depends(get_optional_user),
) -> ProcessingResponse:
    """OCR a scanned PDF to extract text.

    Uses PyMuPDF text extraction with Gemini Vision fallback for pages
    that contain primarily scanned images. The result is a downloadable
    .txt file tracked via the standard job system.

    Args:
        file: The PDF file to OCR (multipart upload).

    Returns:
        ProcessingResponse with job ID and download URL on success.
    """
    try:
        file_content = await validate_pdf_upload(file)
        safe_name = re.sub(r'[^\x20-\x7E]', '?', file.filename or 'unknown')
        job_id, _client_token = job_manager.create_job(
            file.filename or "document.pdf",
            user_id=user.user_id if user else None,
        )
        logger.info("OCR started: job_id=%s, file=%s", job_id, safe_name)

        job_manager.update_progress(job_id, 10, "Validating file...")

        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            input_path = tmp_path / "input.pdf"
            output_path = tmp_path / "output.txt"

            with open(input_path, "wb") as f:
                f.write(file_content)

            job_manager.update_progress(job_id, 30, "Running OCR...")

            await AiService.ocr_pdf(input_path, output_path)

            job_manager.update_progress(job_id, 70, "Uploading result...")

            storage = get_storage()
            r2_key = f"ai/{job_id}/output.txt"
            await storage.upload_local_file(output_path, r2_key, "text/plain")

            download_url = await storage.generate_download_url(r2_key)
            job_manager.complete_job(job_id, download_url)

        return ProcessingResponse(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            message="OCR processing complete. Your text file is ready.",
        )

    except FileValidationError as e:
        raise handle_docuconversion_error(e) from e
    except (AiError, StorageError) as e:
        if "job_id" in locals():
            job_manager.fail_job(job_id, e.message)
        raise handle_docuconversion_error(e) from e
