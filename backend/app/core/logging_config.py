"""
Centralised logging configuration for DocuConversion API.

JSON formatter for production (parseable by Railway / Datadog).
Human-readable coloured formatter for local development.
"""
import json
import logging
import logging.config
import sys
from datetime import datetime, timezone


class _JsonFormatter(logging.Formatter):
    """Emit each log record as a single JSON line."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        # Include exception info if present
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        # Include any extra fields attached to the record
        for key, val in record.__dict__.items():
            if key not in {
                "args", "created", "exc_info", "exc_text", "filename",
                "funcName", "id", "levelname", "levelno", "lineno",
                "message", "module", "msecs", "msg", "name", "pathname",
                "process", "processName", "relativeCreated", "stack_info",
                "thread", "threadName",
            }:
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
