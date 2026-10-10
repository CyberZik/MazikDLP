"""
MazikDLP - Users API Endpoints
GET/PUT/DELETE /users, /users/{id}/role
"""

import math
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreateRequest,
    UserListResponse,
    UserResponse,
    UserRoleUpdateRequest,
    UserUpdateRequest,
)
from app.services import user_service
from app.utils.deps import get_current_user, require_roles

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create a new user")
async def create_user(
    payload: UserCreateRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user = await user_service.create_user(
        db,
        org_id=current_user.org_id,
        email=payload.email,
        name=payload.name,
        password=payload.password,
        role=payload.role,
        department=payload.department,
        team=payload.team,
    )
    return UserResponse.model_validate(user)


@router.get("", response_model=UserListResponse, summary="List users (paginated)")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST, UserRole.MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    users, total = await user_service.list_users(
        db, current_user.org_id, page, per_page, status, role, search
    )
    pages = math.ceil(total / per_page) if total else 0
    return UserListResponse(
        data=[UserResponse.model_validate(u) for u in users],
        meta={"page": page, "per_page": per_page, "total": total, "pages": pages},
    )


@router.get("/{user_id}", response_model=UserResponse, summary="Get user by ID")
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Users can view their own profile; admins can view any
    target_id = user_id
    if current_user.role not in [UserRole.ADMIN.value, UserRole.SECURITY_ANALYST.value, UserRole.MANAGER.value]:
        target_id = current_user.id  # force own profile
    user = await user_service.get_user(db, target_id, current_user.org_id)
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse, summary="Update user")
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    user = await user_service.update_user(
        db,
        user_id,
        current_user.org_id,
        name=payload.name,
        department=payload.department,
        team=payload.team,
        status=payload.status.value if payload.status else None,
    )
    return UserResponse.model_validate(user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user",
)
async def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    await user_service.delete_user(db, user_id, current_user.org_id)


@router.put("/{user_id}/role", response_model=UserResponse, summary="Change user role")
async def change_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user = await user_service.change_user_role(
        db, user_id, current_user.org_id, payload.role
    )
    return UserResponse.model_validate(user)
