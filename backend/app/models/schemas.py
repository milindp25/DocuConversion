"""
Shared Pydantic schemas for DocuConversion API.

These models define the structure of API requests and responses.
All user input is validated through these schemas before processing.
"""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class ConversionFormat(str, Enum):
    """Supported output formats for PDF conversion."""

    WORD = "docx"
    EXCEL = "xlsx"
    POWERPOINT = "pptx"
    PNG = "png"
    JPG = "jpg"
    TEXT = "txt"
    PDF = "pdf"
    HTML = "html"


class JobStatus(str, Enum):
    """Possible states for a processing job."""

    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ConvertRequest(BaseModel):
    """Request schema for file conversion operations.

    The actual file is sent as multipart form data alongside these options.
    """

    output_format: ConversionFormat = Field(
        description="Target format for the conversion"
    )
    pages: str | None = Field(
        default=None,
        description="Page range to convert (e.g., '1-5', '1,3,5'). Defaults to all pages.",
    )
    quality: int = Field(
        default=90,
        ge=10,
        le=100,
        description="Output quality for image conversions (10-100). Higher means better quality.",
    )


class ProcessingResponse(BaseModel):
    """Standard response returned after submitting a processing job.

    Contains the job ID for status polling and the initial status.
    """

    job_id: str = Field(description="Unique identifier for tracking this job")
    status: JobStatus = Field(description="Current status of the processing job")
    message: str = Field(description="Human-readable status message")


class JobStatusResponse(BaseModel):
    """Response for job status polling.

    Returned when the frontend checks on a running job's progress.
    """

    job_id: str = Field(description="The job identifier")
    status: JobStatus = Field(description="Current processing status")
    progress: int = Field(
        ge=0,
        le=100,
        description="Processing progress percentage (0-100)",
    )
    download_url: str | None = Field(
        default=None,
        description="Signed URL to download the result (set when completed)",
    )
    error_message: str | None = Field(
        default=None,
        description="Error description if the job failed",
    )


class MergeRequest(BaseModel):
    """Request schema for merging multiple PDFs."""

    file_order: list[str] | None = Field(
        default=None,
        description="Ordered list of file IDs to define merge order. Defaults to upload order.",
    )


class SplitRequest(BaseModel):
    """Request schema for splitting a PDF."""

    mode: Literal["range", "each"] = Field(
        default="range",
        description="Split mode: 'range' (by page range), 'each' (each page as separate PDF)",
    )
    pages: str | None = Field(
        default=None,
        description="Page range for 'range' mode (e.g., '1-3,5-7'). Ignored for 'each' mode.",
    )


class CompressRequest(BaseModel):
    """Request schema for PDF compression."""

    level: Literal["low", "recommended", "high"] = Field(
        default="recommended",
        description="Compression level: 'low' (best quality), 'recommended' (balanced), 'high' (smallest size)",
    )


class TextAnnotation(BaseModel):
    """A text annotation to add to a PDF page.

    Coordinates are normalized to the [0, 1] range so they scale
    across different page sizes.
    """

    page: int = Field(ge=1, description="Page number (1-indexed)")
    x: float = Field(ge=0, le=1, description="X position (0-1 normalized)")
    y: float = Field(ge=0, le=1, description="Y position (0-1 normalized)")
    content: str = Field(min_length=1, max_length=10000, description="Text content to insert")
    font_size: int = Field(default=12, ge=6, le=72, description="Font size in points")
    color: str = Field(
        default="#000000",
        pattern=r"^#[0-9a-fA-F]{6}$",
        description="Hex color for the text",
    )


class WatermarkRequest(BaseModel):
    """Request for adding a text watermark to every page of a PDF."""

    text: str = Field(min_length=1, max_length=100, description="Watermark text")
    opacity: float = Field(
        default=0.3, ge=0.05, le=1.0, description="Transparency level"
    )
    position: Literal[
        "center", "top-left", "top-right", "bottom-left", "bottom-right"
    ] = Field(default="center", description="Named position on the page")
    font_size: int = Field(default=60, ge=12, le=200, description="Font size in points")
    color: str = Field(
        default="#808080",
        pattern=r"^#[0-9a-fA-F]{6}$",
        description="Hex color for the watermark",
    )
    rotation: float = Field(
        default=-45, ge=-360, le=360, description="Rotation angle in degrees"
    )


class PageNumbersRequest(BaseModel):
    """Request for adding page numbers to a PDF."""

    position: Literal[
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
    ] = Field(default="bottom-center", description="Page number placement")
    start_number: int = Field(
        default=1, ge=1, le=99999, description="First page number to display"
    )
    font_size: int = Field(
        default=12, ge=8, le=36, description="Font size for page numbers"
    )


class SignatureRequest(BaseModel):
    """Request for applying a signature image to a PDF.

    Coordinates and dimensions are normalized to [0, 1] so they
    scale to any page size.
    """

    page: int = Field(ge=1, description="Page to sign (1-indexed)")
    x: float = Field(ge=0, le=1, description="X position (0-1 normalized)")
    y: float = Field(ge=0, le=1, description="Y position (0-1 normalized)")
    width: float = Field(
        default=0.2, ge=0.05, le=0.5, description="Signature width (0-1 normalized)"
    )
    height: float = Field(
        default=0.1, ge=0.025, le=0.25, description="Signature height (0-1 normalized)"
    )


class HighlightAnnotation(BaseModel):
    """A highlight annotation to overlay on a PDF page.

    Renders as a semi-transparent colored rectangle at the
    specified normalized coordinates.
    """

    page: int = Field(ge=1, description="Page number (1-indexed)")
    x: float = Field(ge=0, le=1, description="X position (0-1 normalized)")
    y: float = Field(ge=0, le=1, description="Y position (0-1 normalized)")
    width: float = Field(ge=0, le=1, description="Width (0-1 normalized)")
    height: float = Field(ge=0, le=1, description="Height (0-1 normalized)")
    color: str = Field(
        default="#FFFF00",
        pattern=r"^#[0-9a-fA-F]{6}$",
        description="Highlight color",
    )
    opacity: float = Field(
        default=0.4, ge=0.1, le=0.8, description="Highlight transparency"
    )


class ShapeAnnotation(BaseModel):
    """A geometric shape to draw on a PDF page.

    Supports rectangles, circles (ellipses), lines, and arrows.
    """

    page: int = Field(ge=1, description="Page number (1-indexed)")
    type: Literal["rect", "circle", "line", "arrow"] = Field(
        description="Shape type to draw"
    )
    x: float = Field(ge=0, le=1, description="X position (0-1 normalized)")
    y: float = Field(ge=0, le=1, description="Y position (0-1 normalized)")
    width: float = Field(
        default=0.1, ge=0, le=1, description="Width (0-1 normalized)"
    )
    height: float = Field(
        default=0.1, ge=0, le=1, description="Height (0-1 normalized)"
    )
    stroke_color: str = Field(
        default="#000000",
        pattern=r"^#[0-9a-fA-F]{6}$",
        description="Stroke/border color",
    )
    fill_color: str | None = Field(
        default=None,
        pattern=r"^#[0-9a-fA-F]{6}$",
        description="Fill color (None for no fill)",
    )
    stroke_width: float = Field(
        default=1.0, ge=0.1, le=10.0, description="Stroke width in points"
    )


class FreehandDrawing(BaseModel):
    """A freehand ink stroke to draw on a PDF page.

    Points are normalized to the [0, 1] range so they scale
    across different page sizes. Each point is an ``[x, y]`` pair.
    """

    page: int = Field(ge=1, description="Page number (1-indexed)")
    color: str = Field(
        default="#000000",
        pattern=r"^#[0-9a-fA-F]{6}$",
        description="Stroke color as a hex string",
    )
    width: float = Field(
        default=2.0,
        ge=0.5,
        le=20.0,
        description="Stroke width in points",
    )
    points: list[list[float]] = Field(
        description="List of [x, y] coordinate pairs, normalized to [0, 1]",
        min_length=2,
    )


class PdfPageInfo(BaseModel):
    """Dimension information for a single PDF page."""

    width: float = Field(description="Page width in points")
    height: float = Field(description="Page height in points")


class PdfInfoResponse(BaseModel):
    """Response with PDF document metadata."""

    page_count: int = Field(description="Total number of pages")
    pages: list[PdfPageInfo] = Field(description="Dimensions for each page")
    is_encrypted: bool = Field(description="Whether the PDF is password-protected")
    title: str = Field(default="", description="Document title from metadata")


# --- Phase 3: AI, Advanced, Share, Developer ---


class AiSummaryResponse(BaseModel):
    """Response from the AI summarization endpoint."""

    summary: str = Field(description="Markdown-formatted summary of the document")
    page_count: int = Field(description="Number of pages in the source PDF")
    length: str = Field(description="Requested summary length (short/medium/long)")


class AiChatResponse(BaseModel):
    """Response from the AI chat-with-PDF endpoint."""

    answer: str = Field(description="AI-generated answer to the user's question")
    session_id: str = Field(description="Session ID for follow-up questions")


class AiExtractionResponse(BaseModel):
    """Response from the AI data extraction endpoint."""

    tables: list[list[list[str]]] = Field(
        description="Extracted tables as list of rows of cells"
    )
    key_values: list[dict[str, str]] = Field(
        description="Extracted key-value pairs from the document"
    )
    entities: list[dict[str, str]] = Field(
        description="Named entities found in the document"
    )


class PdfDiffResponse(BaseModel):
    """Response from the PDF comparison endpoint."""

    additions: list[str] = Field(description="Lines present in file2 but not file1")
    deletions: list[str] = Field(description="Lines present in file1 but not file2")
    similarity_score: float = Field(
        description="Similarity ratio between 0.0 and 1.0"
    )


class ShareLinkResponse(BaseModel):
    """Response after creating a shareable download link."""

    token: str = Field(description="Unique token for the share link")
    url: str = Field(description="Full URL for sharing")
    expires_at: str = Field(description="ISO 8601 expiration timestamp")
    filename: str = Field(description="Original filename of the shared file")


class ShareLinkInfoResponse(BaseModel):
    """Response with share link metadata."""

    filename: str = Field(description="Original filename")
    expires_at: str = Field(description="ISO 8601 expiration timestamp")
    download_count: int = Field(description="Number of times the link was accessed")
    is_expired: bool = Field(description="Whether the link has expired")


class ApiKeyResponse(BaseModel):
    """Response after creating or listing an API key."""

    key: str = Field(description="The API key string (shown only on creation)")
    name: str = Field(description="Human-readable name for the key")
    created_at: str = Field(description="ISO 8601 creation timestamp")


class ApiKeyListResponse(BaseModel):
    """Response listing all API keys for a user."""

    keys: list[ApiKeyResponse] = Field(description="List of API keys")


class ApiUsageResponse(BaseModel):
    """Response with API key usage statistics."""

    key_name: str = Field(description="Name of the API key")
    requests_today: int = Field(description="Number of requests made today")
    daily_limit: int = Field(description="Maximum requests per day")
