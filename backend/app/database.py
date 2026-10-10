"""
MazikDLP - Database Setup
Async SQLAlchemy engine + Redis connection.
"""

import logging
from typing import AsyncGenerator

import redis.asyncio as aioredis
from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# ============================================
# SQLAlchemy Naming Convention (for Alembic)
# ============================================
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


# ============================================
# SQLAlchemy Base Model
# ============================================
class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    Includes naming convention for consistent migration generation.
    """
    metadata = MetaData(naming_convention=convention)


# ============================================
# Async Engine & Session
# ============================================
engine = create_async_engine(
    settings.database_url,
    echo=settings.DB_ECHO,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session.
    Automatically handles commit/rollback/close.

    Usage:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ============================================
# Redis Connection
# ============================================
redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """
    FastAPI dependency that provides a Redis connection.

    Usage:
        @app.get("/cached")
        async def get_cached(redis: aioredis.Redis = Depends(get_redis)):
            ...
    """
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    return redis_client


# ============================================
# Lifecycle Helpers
# ============================================
async def init_db():
    """Initialize database connection — called on app startup."""
    logger.info(f"Connecting to PostgreSQL at {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")

    # Verify connection
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("PostgreSQL connected successfully")


async def init_redis():
    """Initialize Redis connection — called on app startup."""
    logger.info(f"Connecting to Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}")

    client = await get_redis()
    await client.ping()

    logger.info("Redis connected successfully")


async def close_db():
    """Close database connections — called on app shutdown."""
    await engine.dispose()
    logger.info("PostgreSQL connection closed")


async def close_redis():
    """Close Redis connection — called on app shutdown."""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
    logger.info("Redis connection closed")
