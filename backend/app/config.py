"""
MazikDLP Configuration System
Environment-based settings with feature flags and rate limiting config.
"""

import json
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "MazikDLP"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", description="development | staging | production")
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "mazik-dlp-secret-change-in-production"
    LOG_FORMAT: str = "console"  # "console" | "json"

    # ── Server ───────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1
    LOG_LEVEL: str = "info"

    # ── Database ─────────────────────────────────────────
    DB_HOST: str = "postgres"
    DB_PORT: int = 5432
    DB_USER: str = "mazikdlp"
    DB_PASSWORD: str = "mazikdlp_secret"
    DB_NAME: str = "mazikdlp"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_ECHO: bool = False

    # ── Redis ────────────────────────────────────────────
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_TTL: int = 3600


    # ── JWT Auth ─────────────────────────────────────────
    JWT_SECRET_KEY: str = "mazik-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ─────────────────────────────────────────────
    # Stored as str to prevent pydantic-settings from trying to JSON-decode it
    # at the source level (which fails on empty env vars). Parsed in the
    # cors_origins property below.
    CORS_ORIGINS: str = Field(default="*")
    # We use Bearer tokens (not cookies), so credentials mode is not needed.
    # allow_origins="*" + allow_credentials=True is rejected by browsers — keep False.
    CORS_ALLOW_CREDENTIALS: bool = False

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS_ORIGINS — accepts JSON array or comma-separated string."""
        v = (self.CORS_ORIGINS or "*").strip()
        if not v:
            return ["*"]
        if v.startswith("["):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(o) for o in parsed]
            except json.JSONDecodeError:
                pass
        return [origin.strip() for origin in v.split(",") if origin.strip()]

    # ── Rate Limiting ────────────────────────────────────
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_SCAN_REQUESTS: int = 30
    RATE_LIMIT_SCAN_WINDOW_SECONDS: int = 60

    # ── Detection Feature Flags ──────────────────────────
    FEATURE_PII_DETECTION: bool = True
    FEATURE_INDIAN_PII: bool = True
    FEATURE_CREDENTIAL_DETECTION: bool = True
    FEATURE_CODE_DETECTION: bool = True
    FEATURE_SECRETS_DETECTION: bool = True
    FEATURE_DB_SCHEMA_DETECTION: bool = True
    FEATURE_IMAGE_REDACTION: bool = True
    FEATURE_PROMPT_CATEGORIZATION: bool = True

    # ── Presidio ─────────────────────────────────────────
    NLP_MODEL: str = "en_core_web_lg"
    DETECTION_THRESHOLD: float = 0.5
    MAX_SCAN_TEXT_LENGTH: int = 50000

    # ── Masking ──────────────────────────────────────────
    MASK_SESSION_TTL: int = 3600
    MASK_PREFIX: str = "<"
    MASK_SUFFIX: str = ">"

    # ── Computed properties ───────────────────────────────

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def RATE_LIMIT_PER_MINUTE(self) -> int:
        return self.RATE_LIMIT_REQUESTS

    @property
    def MASK_SESSION_TTL_SECONDS(self) -> int:
        return self.MASK_SESSION_TTL

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def database_url_sync(self) -> str:
        return (
            f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def redis_url(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    @property
    def feature_flags(self) -> dict:
        return {
            "pii_detection": self.FEATURE_PII_DETECTION,
            "indian_pii": self.FEATURE_INDIAN_PII,
            "credential_detection": self.FEATURE_CREDENTIAL_DETECTION,
            "code_detection": self.FEATURE_CODE_DETECTION,
            "secrets_detection": self.FEATURE_SECRETS_DETECTION,
            "db_schema_detection": self.FEATURE_DB_SCHEMA_DETECTION,
            "image_redaction": self.FEATURE_IMAGE_REDACTION,
            "prompt_categorization": self.FEATURE_PROMPT_CATEGORIZATION,
        }

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
