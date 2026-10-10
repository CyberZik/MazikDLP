"""
User CRUD request/response schemas.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole, UserStatus


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    role: UserRole = UserRole.EMPLOYEE
    department: Optional[str] = None
    team: Optional[str] = None
    status: UserStatus = UserStatus.ACTIVE


class UserResponse(UserBase):
    """Full user object returned in API responses."""
    id: uuid.UUID
    org_id: uuid.UUID
    mfa_enabled: bool
    extension_installed: bool
    extension_version: Optional[str]
    last_active: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    """Allowed fields for user update."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    department: Optional[str] = None
    team: Optional[str] = None
    status: Optional[UserStatus] = None


class UserRoleUpdateRequest(BaseModel):
    """Change a user's role."""
    role: UserRole


class UserListResponse(BaseModel):
    """Paginated user list."""
    status: str = "success"
    data: list[UserResponse]
    meta: dict


class UserInviteRequest(BaseModel):
    """Invite a user by email."""
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    department: Optional[str] = None
    team: Optional[str] = None


class UserCreateRequest(BaseModel):
    """Admin creates a user directly (sets a temporary password)."""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.EMPLOYEE
    department: Optional[str] = None
    team: Optional[str] = None
