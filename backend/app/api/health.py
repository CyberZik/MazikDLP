"""
MazikDLP - Health Check Endpoints
Provides system health information for monitoring and load balancers.
"""

import time
from datetime import datetime, timezone

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db, get_redis

router = APIRouter()
settings = get_settings()

# Track startup time
_startup_time = time.time()


@router.get("/health")
async def health_check():
    """
    Basic health check — used by Docker HEALTHCHECK and load balancers.
    Returns 200 if the API is running.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health/detailed")
async def detailed_health_check(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """
    Detailed health check — verifies all service dependencies.
    Checks: PostgreSQL, Redis connectivity and response times.
    """
    health_status = {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": round(time.time() - _startup_time, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {},
    }

    overall_healthy = True

    # --- Check PostgreSQL ---
    try:
        start = time.time()
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        pg_latency = round((time.time() - start) * 1000, 2)

        health_status["checks"]["postgresql"] = {
            "status": "healthy",
            "latency_ms": pg_latency,
            "host": settings.DB_HOST,
            "database": settings.DB_NAME,
        }
    except Exception as e:
        overall_healthy = False
        health_status["checks"]["postgresql"] = {
            "status": "unhealthy",
            "error": str(e),
            "host": settings.DB_HOST,
            "database": settings.DB_NAME,
        }

    # --- Check Redis ---
    try:
        start = time.time()
        pong = await redis.ping()
        redis_latency = round((time.time() - start) * 1000, 2)

        # Get Redis info for memory stats
        info = await redis.info("memory")
        used_memory = info.get("used_memory_human", "N/A")

        health_status["checks"]["redis"] = {
            "status": "healthy" if pong else "unhealthy",
            "latency_ms": redis_latency,
            "host": settings.REDIS_HOST,
            "used_memory": used_memory,
        }
    except Exception as e:
        overall_healthy = False
        health_status["checks"]["redis"] = {
            "status": "unhealthy",
            "error": str(e),
            "host": settings.REDIS_HOST,
        }

    # --- Overall Status ---
    health_status["status"] = "healthy" if overall_healthy else "degraded"

    return health_status


@router.get("/health/ready")
async def readiness_check(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """
    Readiness check — used by Kubernetes to determine if the service
    is ready to receive traffic.
    """
    try:
        await db.execute(text("SELECT 1"))
        await redis.ping()
        return {"ready": True}
    except Exception:
        return {"ready": False}


@router.get("/health/live")
async def liveness_check():
    """
    Liveness check — used by Kubernetes to determine if the service
    is alive (not stuck/deadlocked).
    """
    return {"alive": True}
