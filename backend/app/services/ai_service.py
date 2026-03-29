"""
AI-powered document analysis using Google Gemini.

Provides PDF summarization, chat-with-PDF, structured data extraction,
and OCR capabilities. Uses Gemini 1.5 Flash for fast, cost-effective
inference. All synchronous Gemini calls are wrapped with asyncio.to_thread
to avoid blocking the event loop.
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import ClassVar

import fitz  # PyMuPDF

from app.core.exceptions import AiError

logger = logging.getLogger(__name__)

# Maximum characters of extracted text to send to Gemini
_MAX_TEXT_LENGTH = 30000


class AiService:
    """Wraps Google Gemini Flash for PDF analysis tasks.

    Uses class-level caches for chat sessions so context is preserved
    across multiple questions about the same document within a session.
    """

    # Class-level cache for chat sessions: {session_id: {"text": str, "history": list, "created_at": float}}
    # Capped at _MAX_SESSIONS to prevent unbounded memory growth.
    _chat_sessions: ClassVar[dict[str, dict]] = {}
    _MAX_SESSIONS: ClassVar[int] = 500

    @classmethod
    def has_session(cls, session_id: str) -> bool:
        """Check if a chat session exists.

        Args:
            session_id: The session identifier to check.

        Returns:
            True if the session exists and hasn't expired.
        """
        import time

        session = cls._chat_sessions.get(session_id)
        if session is None:
            return False
        # Expire sessions older than 1 hour
        if time.time() - session.get("created_at", 0) > 3600:
            del cls._chat_sessions[session_id]
            return False
        return True

    @classmethod
    def _evict_stale_sessions(cls) -> None:
        """Remove expired sessions and enforce the max session cap.

        Called before creating new sessions to prevent unbounded memory growth.
        """
        import time

        now = time.time()
        # Remove sessions older than 1 hour
        expired = [
            sid for sid, data in cls._chat_sessions.items()
            if now - data.get("created_at", 0) > 3600
        ]
        for sid in expired:
            del cls._chat_sessions[sid]

        # If still over cap, remove oldest sessions
        if len(cls._chat_sessions) >= cls._MAX_SESSIONS:
            sorted_sessions = sorted(
                cls._chat_sessions.items(),
                key=lambda x: x[1].get("created_at", 0),
            )
            to_remove = len(cls._chat_sessions) - cls._MAX_SESSIONS + 1
            for sid, _ in sorted_sessions[:to_remove]:
                del cls._chat_sessions[sid]

    @staticmethod
    def _get_model():
        """Lazy-init Gemini Flash model.

        Returns:
            A GenerativeModel instance configured for Gemini 1.5 Flash.

        Raises:
            AiError: If the Gemini API key is not configured.
        """
        import google.generativeai as genai

        from app.core.config import settings

        if not settings.gemini_api_key:
            raise AiError(
                "AI features require a Gemini API key. "
                "Please configure GEMINI_API_KEY."
            )
        genai.configure(api_key=settings.gemini_api_key)
        return genai.GenerativeModel("gemini-1.5-flash")

    @staticmethod
    def _extract_text(input_path: Path) -> tuple[str, int]:
        """Extract text from a PDF and return (text, page_count).

        Args:
            input_path: Path to the source PDF file.

        Returns:
            A tuple of (extracted_text, page_count).

        Raises:
            AiError: If the PDF cannot be read.
        """
        try:
            with fitz.open(str(input_path)) as doc:
                page_count = len(doc)
                text_parts: list[str] = []

                for page_num in range(page_count):
                    page = doc[page_num]
                    text_parts.append(page.get_text())

                full_text = "\n\n".join(text_parts)
                # Truncate to avoid exceeding Gemini context limits
                if len(full_text) > _MAX_TEXT_LENGTH:
                    full_text = full_text[:_MAX_TEXT_LENGTH]

                return full_text, page_count

        except Exception as e:
            logger.error("PDF text extraction for AI failed: %s", str(e))
            raise AiError(
                "Failed to extract text from the PDF. "
                "The file may be corrupted or contain only scanned images."
            ) from e

    @staticmethod
    async def summarize_pdf(input_path: Path, length: str = "medium") -> dict:
        """Extract text from a PDF and send to Gemini for summarization.

        Args:
            input_path: Path to the source PDF file.
            length: Desired summary length — 'short', 'medium', or 'long'.

        Returns:
            Dict with keys: summary, page_count, length.

        Raises:
            AiError: If text extraction or Gemini API call fails.
        """
        try:
            text, page_count = await asyncio.to_thread(
                AiService._extract_text, input_path
            )

            if not text.strip():
                raise AiError(
                    "The PDF appears to contain no extractable text. "
                    "Try using OCR for scanned documents."
                )

            model = AiService._get_model()
            prompt = (
                f"Summarize this document in a {length} length summary. "
                f"Use markdown formatting.\n\nDocument:\n{text}"
            )

            response = await asyncio.to_thread(model.generate_content, prompt)

            logger.info(
                "PDF summarization complete: %d pages, length=%s",
                page_count,
                length,
            )
            return {
                "summary": response.text,
                "page_count": page_count,
                "length": length,
            }

        except AiError:
            raise
        except Exception as e:
            logger.error("PDF summarization failed: %s", str(e))
            raise AiError(
                "Failed to generate summary. The AI service may be temporarily "
                "unavailable. Please try again."
            ) from e

    @staticmethod
    async def chat_with_pdf(
        input_path: Path, question: str, session_id: str
    ) -> dict:
        """Answer questions about PDF content using Gemini.

        Maintains chat history per session_id so follow-up questions
        have context from previous interactions.

        Args:
            input_path: Path to the source PDF file.
            question: The user's question about the document.
            session_id: Unique session identifier for conversation tracking.

        Returns:
            Dict with keys: answer, session_id.

        Raises:
            AiError: If text extraction or Gemini API call fails.
        """
        try:
            # Initialize session if needed
            if session_id not in AiService._chat_sessions:
                if input_path is None:
                    raise AiError(
                        "Chat session not found. Please upload a PDF to start."
                    )
                AiService._evict_stale_sessions()

                import time

                text, _ = await asyncio.to_thread(
                    AiService._extract_text, input_path
                )
                if not text.strip():
                    raise AiError(
                        "The PDF appears to contain no extractable text. "
                        "Try using OCR for scanned documents."
                    )
                AiService._chat_sessions[session_id] = {
                    "text": text,
                    "history": [],
                    "created_at": time.time(),
                }

            session = AiService._chat_sessions[session_id]

            # Build prompt with document context and chat history
            history_text = ""
            for entry in session["history"][-10:]:  # Keep last 10 exchanges
                history_text += f"\nUser: {entry['question']}\nAssistant: {entry['answer']}\n"

            prompt = (
                f"You are a helpful document assistant. Answer questions about "
                f"the following document. Be precise and cite specific sections "
                f"when possible.\n\n"
                f"Document:\n{session['text']}\n\n"
                f"{history_text}\n"
                f"User: {question}\nAssistant:"
            )

            model = AiService._get_model()
            response = await asyncio.to_thread(model.generate_content, prompt)

            # Append to history
            session["history"].append({
                "question": question,
                "answer": response.text,
            })

            logger.info("Chat with PDF: session=%s, question length=%d", session_id, len(question))
            return {"answer": response.text, "session_id": session_id}

        except AiError:
            raise
        except Exception as e:
            logger.error("Chat with PDF failed: %s", str(e))
            raise AiError(
                "Failed to generate an answer. The AI service may be temporarily "
                "unavailable. Please try again."
            ) from e

    @staticmethod
    async def extract_data(input_path: Path) -> dict:
        """Extract structured data (tables, key-values, entities) using Gemini.

        Args:
            input_path: Path to the source PDF file.

        Returns:
            Dict with keys: tables, key_values, entities.

        Raises:
            AiError: If text extraction, Gemini call, or JSON parsing fails.
        """
        try:
            text, _ = await asyncio.to_thread(
                AiService._extract_text, input_path
            )

            if not text.strip():
                raise AiError(
                    "The PDF appears to contain no extractable text. "
                    "Try using OCR for scanned documents."
                )

            model = AiService._get_model()
            prompt = (
                "Extract structured data from the following document. "
                "Return ONLY valid JSON (no markdown code fences) with these keys:\n"
                "- tables: array of tables, each table is an array of rows, "
                "each row is an array of cell strings\n"
                "- key_values: array of objects with 'key' and 'value' string fields\n"
                "- entities: array of objects with 'type' and 'value' string fields "
                "(e.g., names, dates, amounts, organizations)\n\n"
                f"Document:\n{text}"
            )

            response = await asyncio.to_thread(model.generate_content, prompt)

            # Parse the JSON response
            response_text = response.text.strip()
            # Strip markdown code fences if present
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                # Remove first and last lines (code fences)
                lines = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
                response_text = "\n".join(lines)

            try:
                data = json.loads(response_text)
            except json.JSONDecodeError:
                logger.warning("Failed to parse AI extraction response as JSON")
                data = {"tables": [], "key_values": [], "entities": []}

            result = {
                "tables": data.get("tables", []),
                "key_values": data.get("key_values", []),
                "entities": data.get("entities", []),
            }

            logger.info(
                "Data extraction complete: %d tables, %d key-values, %d entities",
                len(result["tables"]),
                len(result["key_values"]),
                len(result["entities"]),
            )
            return result

        except AiError:
            raise
        except Exception as e:
            logger.error("Data extraction failed: %s", str(e))
            raise AiError(
                "Failed to extract structured data. The AI service may be "
                "temporarily unavailable. Please try again."
            ) from e

    @staticmethod
    async def ocr_pdf(input_path: Path, output_path: Path) -> Path:
        """OCR a scanned PDF using PyMuPDF text extraction + Gemini Vision fallback.

        For each page, attempts text extraction first. If a page yields
        very little text, renders it as an image and uses Gemini Vision
        to extract the text.

        Args:
            input_path: Path to the source PDF file.
            output_path: Path for the output .txt file.

        Returns:
            Path to the created text file.

        Raises:
            AiError: If the PDF cannot be read or OCR fails.
        """
        try:
            all_text: list[str] = []

            def _process_pages() -> list[str]:
                """Extract text from all pages, using Vision for sparse pages."""
                page_texts: list[str] = []
                with fitz.open(str(input_path)) as doc:
                    for page_num in range(len(doc)):
                        page = doc[page_num]
                        text = page.get_text().strip()

                        if len(text) > 50:
                            # Enough text extracted directly
                            page_texts.append(text)
                        else:
                            # Render page as image for Gemini Vision
                            zoom = 200 / 72
                            mat = fitz.Matrix(zoom, zoom)
                            pix = page.get_pixmap(matrix=mat)
                            img_bytes = pix.tobytes("png")
                            page_texts.append(("__IMAGE__", img_bytes))  # type: ignore[arg-type]
                return page_texts

            raw_pages = await asyncio.to_thread(_process_pages)

            # Process any image pages with Gemini Vision
            model = None
            for i, page_data in enumerate(raw_pages):
                if isinstance(page_data, tuple) and page_data[0] == "__IMAGE__":
                    if model is None:
                        model = AiService._get_model()

                    import google.generativeai as genai

                    img_part = {
                        "mime_type": "image/png",
                        "data": page_data[1],
                    }
                    prompt = (
                        "Extract all text from this scanned document page. "
                        "Preserve the original formatting as much as possible. "
                        "Return only the extracted text, nothing else."
                    )

                    response = await asyncio.to_thread(
                        model.generate_content, [prompt, img_part]
                    )
                    all_text.append(response.text)
                else:
                    all_text.append(page_data)

            # Write all text to output file
            with open(output_path, "w", encoding="utf-8") as f:
                f.write("\n\n--- Page Break ---\n\n".join(all_text))

            logger.info(
                "OCR complete: %d pages processed -> %s",
                len(all_text),
                output_path.name,
            )
            return output_path

        except AiError:
            raise
        except Exception as e:
            logger.error("OCR failed: %s", str(e))
            raise AiError(
                "Failed to OCR the PDF. The file may be corrupted or the "
                "AI service may be temporarily unavailable."
            ) from e
