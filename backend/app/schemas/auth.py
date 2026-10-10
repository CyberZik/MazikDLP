"""
Auth request/response schemas.
"""

import re
from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """User registration payload."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 chars)")
    name: str = Field(..., min_length=1, max_length=255, description="Full name")
    org_name: str = Field(..., min_length=1, max_length=255, description="Organization name")
    org_domain: str | None = Field(None, description="Organization domain (e.g. acme.com)")

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    """Login payload."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class TokenResponse(BaseModel):
    """JWT token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Access token lifetime in seconds")


class RefreshRequest(BaseModel):
    """Token refresh payload."""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Logout payload — invalidates the refresh token."""
    refresh_token: str


class RegisterResponse(BaseModel):
    """Registration response."""
    user_id: str
    email: str
    name: str
    role: str
    org_id: str
    org_name: str
    tokens: TokenResponse
