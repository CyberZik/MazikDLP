"""
Configuration API endpoints.
Exposes system configuration and feature flags to the frontend/extension.
"""

from fastapi import APIRouter, Depends
from app.config import get_settings, Settings
from app.schemas.config import ConfigResponse, FeatureFlagsResponse, RateLimitInfo

router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get(
    "",
    response_model=ConfigResponse,
    summary="Get system configuration",
    description="Returns the current system configuration including app info, features, and limits.",
)
async def get_config(settings: Settings = Depends(get_settings)):
    return ConfigResponse(
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        debug=settings.DEBUG,
        features=FeatureFlagsResponse(
            pii_detection=settings.FEATURE_PII_DETECTION,
            indian_pii=settings.FEATURE_INDIAN_PII,
            credential_detection=settings.FEATURE_CREDENTIAL_DETECTION,
            code_detection=settings.FEATURE_CODE_DETECTION,
            secrets_detection=settings.FEATURE_SECRETS_DETECTION,
            db_schema_detection=settings.FEATURE_DB_SCHEMA_DETECTION,
            image_redaction=settings.FEATURE_IMAGE_REDACTION,
            prompt_categorization=settings.FEATURE_PROMPT_CATEGORIZATION,
        ),
        rate_limit=RateLimitInfo(
            requests_per_minute=settings.RATE_LIMIT_REQUESTS,
            window_seconds=settings.RATE_LIMIT_WINDOW_SECONDS,
            enabled=settings.RATE_LIMIT_ENABLED,
        ),
        max_scan_length=settings.MAX_SCAN_TEXT_LENGTH,
        mask_session_ttl=settings.MASK_SESSION_TTL,
    )


@router.get(
    "/features",
    response_model=FeatureFlagsResponse,
    summary="Get feature flags",
    description="Returns only the feature flag toggles for detection modules.",
)
async def get_feature_flags(settings: Settings = Depends(get_settings)):
    return FeatureFlagsResponse(
        pii_detection=settings.FEATURE_PII_DETECTION,
        indian_pii=settings.FEATURE_INDIAN_PII,
        credential_detection=settings.FEATURE_CREDENTIAL_DETECTION,
        code_detection=settings.FEATURE_CODE_DETECTION,
        secrets_detection=settings.FEATURE_SECRETS_DETECTION,
        db_schema_detection=settings.FEATURE_DB_SCHEMA_DETECTION,
        image_redaction=settings.FEATURE_IMAGE_REDACTION,
        prompt_categorization=settings.FEATURE_PROMPT_CATEGORIZATION,
    )
