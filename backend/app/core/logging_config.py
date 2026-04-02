"""
Centralised logging configuration for DocuConversion API.

JSON formatter for production (parseable by Railway / Datadog).
Human-readable coloured formatter for local development.

Correlation IDs
---------------
A per-request UUID is stored in ``request_id_ctx`` (a ContextVar).
The middleware in main.py sets it at the start of every request so
every log line emitted during that request automatically includes
``"req_id": "<uuid>"`` in the JSON output — even from deeply nested
service calls — because asyncio preserves ContextVar values across
await boundaries within the same task.
"""
import json
import logging
import logging.config
import sys
from contextvars import ContextVar
from datetime import datetime, timezone

# Stores the current request's correlation ID.
# Set to a UUID in the HTTP middleware; defaults to "-" when outside a request.
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


class _JsonFormatter(logging.Formatter):
    """Emit each log record as a single JSON line, including the request ID."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "req_id": request_id_ctx.get(),
            "msg": record.getMessage(),
        }
        # Include exception info if present
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        # Include any extra fields attached to the record (skip internal attrs)
        _SKIP = {
            "args", "created", "exc_info", "exc_text", "filename",
            "funcName", "id", "levelname", "levelno", "lineno",
            "message", "module", "msecs", "msg", "name", "pathname",
            "process", "processName", "relativeCreated", "stack_info",
            "taskName", "thread", "threadName",
        }
        for key, val in record.__dict__.items():
            if key not in _SKIP:
                payload[key] = val
        return json.dumps(payload, default=str)


def configure_logging(log_level: str = "INFO", log_format: str = "json") -> None:
    """Apply logging config to the root logger.

    Args:
        log_level: One of DEBUG / INFO / WARNING / ERROR / CRITICAL.
        log_format: "json" for production structured logs, "text" for dev.
    """
    fmt = (
        "%(asctime)s [%(levelname)-8s] %(name)s: %(message)s"
        if log_format == "text"
        else None  # JSON formatter used directly
    )

    config: dict = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {"()": _JsonFormatter},
            "text": {
                "format": fmt or "%(asctime)s [%(levelname)-8s] %(name)s: %(message)s",
                "datefmt": "%H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "stream": sys.stdout,
                "formatter": "text" if log_format == "text" else "json",
            },
        },
        "root": {
            "level": log_level.upper(),
            "handlers": ["console"],
        },
        # Silence noisy third-party loggers
        "loggers": {
            "uvicorn.access": {"level": "WARNING", "propagate": True},
            "httpx": {"level": "WARNING", "propagate": True},
            "boto3": {"level": "WARNING", "propagate": True},
            "botocore": {"level": "WARNING", "propagate": True},
        },
    }

    logging.config.dictConfig(config)
