"""
Application configuration loaded from environment variables.

Uses pydantic-settings to validate all required environment variables
at startup, failing fast if any are missing or malformed.
"""

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings validated from environment variables.

    All settings are loaded from environment variables (or .env file).
    The application will fail to start if required variables are missing.
    """

    # Environment
    environment: str = "development"

    # CORS — comma-separated list of allowed frontend origins
    cors_origins: list[str] = ["http://localhost:3000"]

    # Database (Aiven PostgreSQL)
    database_url: str = ""

    # Cloudflare R2 (S3-compatible storage)
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "docuconversion"
    r2_endpoint_url: str = ""

    # File handling limits
    max_upload_size_mb: int = 100
    file_ttl_anonymous_hours: int = 1
    file_ttl_authenticated_days: int = 30

    # Authentication (NextAuth.js JWT validation)
    nextauth_secret: str = ""
    auth_enabled: bool = False

    # AI (Google Gemini) — Phase 3
    gemini_api_key: str = ""

    # Stripe payment integration
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    stripe_enterprise_price_id: str = ""

    # Shareable links
    share_link_base_url: str = "http://localhost:3000/share"
    share_link_max_ttl_hours: int = 72

    # Logging
    log_level: str = Field(default="INFO")
    log_format: str = Field(default="json")  # "json" for prod, "text" for dev

    # Sentry
    sentry_dsn: str | None = Field(default=None)
    sentry_traces_sample_rate: float = Field(default=0.1)

    class Config:
        """Pydantic settings configuration."""

        # Check both backend/.env and project root .env
        env_file = (".env", "../.env")
        case_sensitive = False
        # Ignore frontend-only env vars (NEXT_PUBLIC_*, NEXTAUTH_*, GOOGLE_*, etc.)
        extra = "ignore"


# Singleton settings instance — imported throughout the application
settings = Settings()
