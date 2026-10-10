"""
MazikDLP - Policies API Endpoints
Full CRUD for DLP policies.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.policy import PolicyCreateRequest, PolicyResponse, PolicyUpdateRequest
from app.services import policy_service
from app.utils.deps import get_current_user, require_roles

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.get("", response_model=list[PolicyResponse], summary="List policies")
async def list_policies(
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    policies = await policy_service.list_policies(db, current_user.org_id, status=status)
    return [PolicyResponse.model_validate(p) for p in policies]


@router.post(
    "",
    response_model=PolicyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create policy",
)
async def create_policy(
    payload: PolicyCreateRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST)),
    db: AsyncSession = Depends(get_db),
):
    policy = await policy_service.create_policy(
        db, current_user.org_id, current_user.id, payload
    )
    return PolicyResponse.model_validate(policy)


@router.get("/{policy_id}", response_model=PolicyResponse, summary="Get policy by ID")
async def get_policy(
    policy_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    policy = await policy_service.get_policy(db, policy_id, current_user.org_id)
    return PolicyResponse.model_validate(policy)


@router.put("/{policy_id}", response_model=PolicyResponse, summary="Update policy")
async def update_policy(
    policy_id: uuid.UUID,
    payload: PolicyUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST)),
    db: AsyncSession = Depends(get_db),
):
    policy = await policy_service.update_policy(db, policy_id, current_user.org_id, payload)
    return PolicyResponse.model_validate(policy)


@router.delete(
    "/{policy_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete policy",
)
async def delete_policy(
    policy_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    await policy_service.delete_policy(db, policy_id, current_user.org_id)
