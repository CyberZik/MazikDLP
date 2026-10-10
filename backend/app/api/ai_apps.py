"""
MazikDLP - AI Apps Registry API
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.ai_app import AIApp
from app.models.user import User, UserRole
from app.utils.deps import get_current_user, require_roles
from app.utils.exceptions import NotFoundError

router = APIRouter(prefix="/ai-apps", tags=["AI Apps"])


class AIAppCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    vendor: Optional[str] = None
    website: Optional[str] = None
    status: str = Field(default="whitelisted", pattern="^(whitelisted|blocked|restricted)$")
    risk_level: Optional[str] = None
    security_score: Optional[int] = None
    models: list[str] = Field(default_factory=list)
    compliance: list[str] = Field(default_factory=list)


class AIAppResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    vendor: Optional[str]
    website: Optional[str]
    status: str
    risk_level: Optional[str]
    security_score: Optional[int]
    models: list[str]
    compliance: list[str]

    model_config = {"from_attributes": True}


class AIAppStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(whitelisted|blocked|restricted)$")


@router.get("", response_model=list[AIAppResponse])
async def list_apps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AIApp).where(AIApp.org_id == current_user.org_id))
    apps = list(result.scalars().all())
    return [AIAppResponse.model_validate(a) for a in apps]


@router.post("", response_model=AIAppResponse, status_code=status.HTTP_201_CREATED)
async def create_app(
    payload: AIAppCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST)),
    db: AsyncSession = Depends(get_db),
):
    app = AIApp(org_id=current_user.org_id, **payload.model_dump())
    db.add(app)
    await db.flush()
    return AIAppResponse.model_validate(app)


@router.put("/{app_id}", response_model=AIAppResponse)
async def update_app(
    app_id: uuid.UUID,
    payload: AIAppCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST)),
    db: AsyncSession = Depends(get_db),
):
    app = await db.scalar(select(AIApp).where(AIApp.id == app_id, AIApp.org_id == current_user.org_id))
    if not app:
        raise NotFoundError(resource="AIApp", resource_id=str(app_id))
    for k, v in payload.model_dump().items():
        setattr(app, k, v)
    return AIAppResponse.model_validate(app)


@router.put("/{app_id}/status", response_model=AIAppResponse)
async def update_app_status(
    app_id: uuid.UUID,
    payload: AIAppStatusUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST)),
    db: AsyncSession = Depends(get_db),
):
    app = await db.scalar(select(AIApp).where(AIApp.id == app_id, AIApp.org_id == current_user.org_id))
    if not app:
        raise NotFoundError(resource="AIApp", resource_id=str(app_id))
    app.status = payload.status
    return AIAppResponse.model_validate(app)
