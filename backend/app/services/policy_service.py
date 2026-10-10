"""
MazikDLP - Policy Service
CRUD + policy evaluation engine.
"""

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.detectors.base import DetectionResult
from app.models.policy import Policy
from app.schemas.policy import PolicyCreateRequest, PolicyUpdateRequest
from app.utils.exceptions import ConflictError, NotFoundError

# Priority order for policy actions (higher index = stricter)
ACTION_PRIORITY = {
    "allow": 0,
    "alert": 1,
    "soft_block": 2,
    "mask": 3,
    "hard_block": 4,
}


async def list_policies(
    db: AsyncSession,
    org_id: uuid.UUID,
    status: Optional[str] = None,
) -> list[Policy]:
    query = select(Policy).where(Policy.org_id == org_id)
    if status:
        query = query.where(Policy.status == status)
    query = query.order_by(Policy.priority.asc(), Policy.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_policy(db: AsyncSession, policy_id: uuid.UUID, org_id: uuid.UUID) -> Policy:
    policy = await db.scalar(
        select(Policy).where(Policy.id == policy_id, Policy.org_id == org_id)
    )
    if not policy:
        raise NotFoundError(resource="Policy", resource_id=str(policy_id))
    return policy


async def create_policy(
    db: AsyncSession,
    org_id: uuid.UUID,
    created_by: uuid.UUID,
    data: PolicyCreateRequest,
) -> Policy:
    policy = Policy(
        org_id=org_id,
        created_by=created_by,
        **data.model_dump(),
    )
    db.add(policy)
    await db.flush()
    return policy


async def update_policy(
    db: AsyncSession,
    policy_id: uuid.UUID,
    org_id: uuid.UUID,
    data: PolicyUpdateRequest,
) -> Policy:
    policy = await get_policy(db, policy_id, org_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(policy, field, value)
    return policy


async def delete_policy(db: AsyncSession, policy_id: uuid.UUID, org_id: uuid.UUID) -> None:
    policy = await get_policy(db, policy_id, org_id)
    await db.delete(policy)


def evaluate_policies(
    entities: list[DetectionResult],
    policies: list[Policy],
    user_role: Optional[str] = None,
    platform: Optional[str] = None,
    model: Optional[str] = None,
) -> tuple[str, Optional[Policy]]:
    """
    Evaluate detected entities against active policies.

    Returns:
        (final_action, matched_policy | None)
        final_action is one of: allow, alert, soft_block, mask, hard_block
    """
    detected_types = {e.entity_type for e in entities}

    best_action = "allow"
    best_policy: Optional[Policy] = None

    for policy in sorted(policies, key=lambda p: p.priority):
        if not policy.is_active:
            continue

        # Check if policy data_types intersect with detected entities
        policy_types = set(policy.data_types or [])
        if policy_types and not policy_types.intersection(detected_types):
            continue  # policy doesn't match any detected type

        # Check user group filter — empty list or ['all'] means apply to everyone
        if policy.user_groups and "all" not in policy.user_groups:
            if user_role and user_role not in policy.user_groups:
                continue

        # Check platform filter — case-insensitive (extension sends 'ChatGPT', UI stores 'chatgpt')
        if policy.ai_platforms and platform:
            platform_ids = [p.lower() for p in policy.ai_platforms]
            if platform.lower() not in platform_ids:
                continue

        # Check model filter — empty list means all models
        if policy.ai_models and model:
            model_ids = [m.lower() for m in policy.ai_models]
            if model.lower() not in model_ids:
                continue

        action = policy.action
        if ACTION_PRIORITY.get(action, 0) > ACTION_PRIORITY.get(best_action, 0):
            best_action = action
            best_policy = policy

    return best_action, best_policy
