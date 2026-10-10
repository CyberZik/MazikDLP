"""
Configuration response schemas.
Pydantic models for the config API endpoint responses.
"""

from pydantic import BaseModel, Field
from typing import List


class FeatureFlagsResponse(BaseModel):
    """Feature flags response schema."""
    pii_detection: bool = Field(..., description="PII detection enabled")
    indian_pii: bool = Field(..., description="Indian PII detection enabled")
    credential_detection: bool = Field(..., description="Credential detection enabled")
    code_detection: bool = Field(..., description="Source code detection enabled")
    secrets_detection: bool = Field(..., description="Secrets/API key detection enabled")
    db_schema_detection: bool = Field(..., description="Database schema detection enabled")
    image_redaction: bool = Field(..., description="Image redaction enabled")
    prompt_categorization: bool = Field(..., description="Prompt categorization enabled")


class RateLimitInfo(BaseModel):
    """Rate limiting configuration info."""
    requests_per_minute: int = Field(..., description="Max requests per minute")
    window_seconds: int = Field(..., description="Rate limit window in seconds")
    enabled: bool = Field(..., description="Rate limiting enabled")


class ConfigResponse(BaseModel):
    """Full configuration response schema."""
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Deployment environment")
    debug: bool = Field(..., description="Debug mode status")
    features: FeatureFlagsResponse = Field(..., description="Feature flags")
    rate_limit: RateLimitInfo = Field(..., description="Rate limiting config")
    max_scan_length: int = Field(..., description="Maximum scan text length")
    mask_session_ttl: int = Field(..., description="Masking session TTL in seconds")
    supported_languages: List[str] = Field(
        default=["en"],
        description="Supported detection languages"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "app_name": "MazikDLP",
                "version": "1.0.0",
                "environment": "development",
                "debug": True,
                "features": {
                    "pii_detection": True,
                    "indian_pii": True,
                    "credential_detection": True,
                    "code_detection": True,
                    "secrets_detection": True,
                    "db_schema_detection": True,
                    "image_redaction": True,
                    "prompt_categorization": True,
                },
                "rate_limit": {
                    "requests_per_minute": 100,
                    "window_seconds": 60,
                    "enabled": True,
                },
                "max_scan_length": 50000,
                "mask_session_ttl": 3600,
                "supported_languages": ["en"],
            }
        }
    }
