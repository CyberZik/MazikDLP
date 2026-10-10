"""
MazikDLP - Settings & API Keys API
"""

import secrets
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.settings import APIKey, SystemSettings
from app.models.user import User, UserRole
from app.utils.deps import get_current_user, require_roles
from app.utils.exceptions import NotFoundError
from app.utils.security import hash_password

router = APIRouter(tags=["Settings"])


class SettingsUpdate(BaseModel):
    settings: dict = Field(default_factory=dict)


class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    expires_at: Optional[datetime] = None


class APIKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    is_active: bool
    expires_at: Optional[datetime]
    last_used_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class APIKeyCreateResponse(APIKeyResponse):
    """Returned only on creation — includes the full plaintext key (shown once)."""
    plaintext_key: str


# ── Settings ──────────────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings_endpoint(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    row = await db.scalar(
        select(SystemSettings).where(SystemSettings.org_id == current_user.org_id)
    )
    settings_dict = row.settings if row else {}
    return {"status": "success", "data": settings_dict}


@router.put("/settings")
async def update_settings_endpoint(
    payload: SettingsUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    row = await db.scalar(
        select(SystemSettings).where(SystemSettings.org_id == current_user.org_id)
    )
    if row:
        row.settings = {**(row.settings or {}), **payload.settings}
    else:
        row = SystemSettings(org_id=current_user.org_id, settings=payload.settings)
        db.add(row)
    return {"status": "success", "data": row.settings}


# ── API Keys ──────────────────────────────────────────────────────────────────

@router.get("/api-keys", response_model=list[APIKeyResponse])
async def list_api_keys(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(APIKey).where(APIKey.org_id == current_user.org_id, APIKey.is_active == True)
    )
    return [APIKeyResponse.model_validate(k) for k in result.scalars().all()]


@router.post("/api-keys", response_model=APIKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: APIKeyCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    raw_key = f"mk_live_{secrets.token_urlsafe(32)}"
    prefix = raw_key[:16] + "..."

    key = APIKey(
        org_id=current_user.org_id,
        name=payload.name,
        key_hash=hash_password(raw_key),
        key_prefix=prefix,
        expires_at=payload.expires_at,
        created_by=current_user.id,
    )
    db.add(key)
    await db.flush()

    response = APIKeyCreateResponse.model_validate(key)
    response.plaintext_key = raw_key
    return response


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    key = await db.scalar(
        select(APIKey).where(APIKey.id == key_id, APIKey.org_id == current_user.org_id)
    )
    if not key:
        raise NotFoundError(resource="APIKey", resource_id=str(key_id))
    key.is_active = False


@router.post("/api-keys/{key_id}/rotate", response_model=APIKeyCreateResponse)
async def rotate_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    old_key = await db.scalar(
        select(APIKey).where(APIKey.id == key_id, APIKey.org_id == current_user.org_id)
    )
    if not old_key:
        raise NotFoundError(resource="APIKey", resource_id=str(key_id))

    # Revoke old key
    old_key.is_active = False

    # Create new key
    raw_key = f"mk_live_{secrets.token_urlsafe(32)}"
    prefix = raw_key[:16] + "..."
    new_key = APIKey(
        org_id=current_user.org_id,
        name=old_key.name + " (rotated)",
        key_hash=hash_password(raw_key),
        key_prefix=prefix,
        created_by=current_user.id,
    )
    db.add(new_key)
    await db.flush()

    response = APIKeyCreateResponse.model_validate(new_key)
    response.plaintext_key = raw_key
    return response
