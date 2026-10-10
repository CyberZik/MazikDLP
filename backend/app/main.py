"""
MazikDLP - FastAPI Application Entry Point
Enterprise AI Data Loss Prevention Platform

This is the main application factory that creates and configures
the FastAPI application with all middleware, routes, and lifecycle events.
"""

import logging
import sys
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import ORJSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import api_router
from app.config import get_settings
from app.database import close_db, close_redis, init_db, init_redis
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.utils.error_handlers import (
    mazikdlp_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from app.utils.exceptions import MazikDLPException

settings = get_settings()


# ============================================
# Structured Logging Setup
# ============================================
def setup_logging():
    """Configure structured logging with structlog."""

    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    if settings.LOG_FORMAT == "json" or settings.is_production:
        # JSON logging for production
        structlog.configure(
            processors=[
                structlog.contextvars.merge_contextvars,
                structlog.processors.add_log_level,
                structlog.processors.StackInfoRenderer(),
                structlog.dev.set_exc_info,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.JSONRenderer(),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(log_level),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )
    else:
        # Pretty logging for development
        structlog.configure(
            processors=[
                structlog.contextvars.merge_contextvars,
                structlog.processors.add_log_level,
                structlog.processors.StackInfoRenderer(),
                structlog.dev.set_exc_info,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.dev.ConsoleRenderer(colors=True),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(log_level),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )

    # Also configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )


# ============================================
# Application Lifecycle
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    Handles startup and shutdown events.
    """
    logger = structlog.get_logger()

    # --- STARTUP ---
    await logger.ainfo(
        "Starting MazikDLP Backend",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )

    # Initialize database
    try:
        await init_db()
        await logger.ainfo("PostgreSQL initialized")
    except Exception as e:
        await logger.aerror("Failed to initialize PostgreSQL", error=str(e))
        if settings.is_production:
            raise

    # Initialize Redis
    try:
        await init_redis()
        await logger.ainfo("Redis initialized")
    except Exception as e:
        await logger.aerror("Failed to initialize Redis", error=str(e))
        if settings.is_production:
            raise

    await logger.ainfo(
        "MazikDLP Backend started successfully",
        docs_url=f"http://{settings.HOST}:{settings.PORT}/docs",
    )

    yield  # Application is running

    # --- SHUTDOWN ---
    await logger.ainfo("Shutting down MazikDLP Backend")
    await close_db()
    await close_redis()
    await logger.ainfo("MazikDLP Backend shut down gracefully")


# ============================================
# Create FastAPI Application
# ============================================
setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Enterprise AI Data Loss Prevention Platform. "
        "Detects and prevents sensitive data leakage through AI tools like "
        "ChatGPT, Gemini, Claude, Grok, and Perplexity."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

# ============================================
# Exception Handlers
# ============================================
app.add_exception_handler(MazikDLPException, mazikdlp_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# ============================================
# Middleware
# ============================================

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiter Middleware (added after CORS so rate limit headers are included)
# Redis client is initialized at startup; middleware handles None redis gracefully
app.add_middleware(
    RateLimiterMiddleware,
    max_requests=settings.RATE_LIMIT_REQUESTS,
    window_seconds=settings.RATE_LIMIT_WINDOW_SECONDS,
)


# Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add a unique request ID to every request for tracing."""
    import uuid

    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every incoming request with method, path, and response time."""
    import time

    start_time = time.time()
    response = await call_next(request)
    process_time = round((time.time() - start_time) * 1000, 2)

    # Don't log health check endpoints to reduce noise
    if not request.url.path.startswith("/api/v1/health"):
        logger = structlog.get_logger()
        await logger.ainfo(
            "HTTP Request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=process_time,
            client_ip=request.client.host if request.client else "unknown",
        )

    response.headers["X-Process-Time"] = str(process_time)
    return response


# ============================================
# Register Routes
# ============================================
app.include_router(api_router)


# ============================================
# Root Redirect
# ============================================
@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint — redirects to API docs."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
