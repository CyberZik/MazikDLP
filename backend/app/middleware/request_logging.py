"""
Request Logging Middleware
Logs every incoming request with method, path, status code, and duration.
"""

import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("mazikdlp.middleware.request_logging")

# Paths to skip logging (health checks, static files)
SKIP_PATHS = {"/", "/health", "/api/v1/health"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs request details including duration and status."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip noisy health check logs
        if request.url.path in SKIP_PATHS:
            return await call_next(request)

        start_time = time.time()
        request_id = getattr(request.state, "request_id", "unknown")

        # Get client info
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")[:100]

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Log with structured format
        log_data = (
            f"request_id={request_id} "
            f"method={request.method} "
            f"path={request.url.path} "
            f"status={response.status_code} "
            f"duration={duration_ms}ms "
            f"client_ip={client_ip} "
            f"user_agent={user_agent}"
        )

        if response.status_code >= 500:
            logger.error(f"Request failed | {log_data}")
        elif response.status_code >= 400:
            logger.warning(f"Request error | {log_data}")
        else:
            logger.info(f"Request completed | {log_data}")

        # Add timing header
        response.headers["X-Response-Time"] = f"{duration_ms}ms"

        return response
