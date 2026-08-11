"""JSON log formatter for structured logging.

Emits one JSON object per log line so aggregators (Loki, CloudWatch, etc.)
can index on level/logger/request_id without parsing text. Keys are stable:
ts, level, logger, message, plus optional record attributes (request_id,
method, path, status, duration_ms) when the logging call supplies them as
extra={...}.
"""
import json
import logging


class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "ts": self.formatTime(record, self.datefmt or "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Merge structured extra attributes if present.
        extra = getattr(record, "json_extra", None)
        if isinstance(extra, dict):
            payload.update(extra)

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str, ensure_ascii=False)
