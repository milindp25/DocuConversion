"""
DocuConversion API -- Main application entry point.

This module initializes the FastAPI application, configures middleware
(CORS, rate limiting), and registers all API routers. It serves as the
central hub for the backend service.
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api import ai, advanced, convert, developer, edit, jobs, organize, payments, preview, share, sign, secure
from app.core.config import settings
from app.core.exceptions import DocuConversionError, handle_docuconversion_error

# Disable OpenAPI docs in production to reduce attack surface
_docs_url = None if settings.environment == "production" else "/docs"
_redoc_url = None if settings.environment == "production" else "/redoc"

# Rate limiter keyed by client IP address
limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])

app = FastAPI(
    title="DocuConversion API",
    description="PDF conversion, editing, signing, and organization service.",
    version="0.1.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
)

# Attach the limiter to app state so slowapi middleware can access it
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(DocuConversionError)
async def docuconversion_error_handler(
    request: Request, exc: DocuConversionError
) -> JSONResponse:
    """Global handler for all DocuConversion domain exceptions.

    Catches custom exceptions raised from dependencies (e.g. tier-limit
    checks) that bypass per-endpoint try/except blocks, ensuring
    clients always receive a structured JSON error instead of a 500.

    Args:
        request: The incoming request.
        exc: The domain exception that was raised.

    Returns:
        A JSONResponse with the appropriate HTTP status and detail message.
    """
    http_exc = handle_docuconversion_error(exc)
    return JSONResponse(
        status_code=http_exc.status_code,
        content={"detail": http_exc.detail},
    )

# Configure CORS with explicit allowed methods and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# Enable rate limiting middleware (must be added after CORS)
app.add_middleware(SlowAPIMiddleware)

# Register API routers -- each handles a distinct tool category
app.include_router(convert.router, prefix="/api/convert", tags=["Convert"])
app.include_router(edit.router, prefix="/api/edit", tags=["Edit"])
app.include_router(organize.router, prefix="/api/organize", tags=["Organize"])
app.include_router(sign.router, prefix="/api/sign", tags=["Sign"])
app.include_router(secure.router, prefix="/api/secure", tags=["Secure"])
app.include_router(preview.router, prefix="/api/preview", tags=["Preview"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(advanced.router, prefix="/api/advanced", tags=["Advanced"])
app.include_router(share.router, prefix="/api/share", tags=["Share"])
app.include_router(developer.router, prefix="/api/developer", tags=["Developer"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint for monitoring and load balancer probes."""
    return {"status": "healthy", "service": "docuconversion-api"}


# Local file serving endpoint for development — allows downloading
# processed files without R2. Only active when R2 is not configured.
if not settings.r2_access_key_id:
    from pathlib import Path as FilePath

    from fastapi.responses import FileResponse

    @app.get("/api/storage/download/{path:path}", tags=["Storage"])
    async def serve_local_file(path: str) -> FileResponse:
        """Serve a locally stored file for download (dev mode only).

        Args:
            path: The storage key / relative file path.

        Returns:
            The file as a downloadable response.

        Raises:
            HTTPException: 404 if file not found, 400 if path traversal detected.
        """
        from fastapi import HTTPException

        base_dir = FilePath("local_storage").resolve()
        file_path = (base_dir / path).resolve()

        # Prevent path traversal — resolved path must stay inside base_dir
        if not file_path.is_relative_to(base_dir):
            raise HTTPException(status_code=400, detail="Invalid file path")

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(
            path=str(file_path),
            filename=file_path.name,
            media_type="application/octet-stream",
        )
