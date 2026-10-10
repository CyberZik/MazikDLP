"""
MazikDLP - Audit Service
Write and query audit log entries.
"""

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.utils.exceptions import NotFoundError


async def write_log(
    db: AsyncSession,
    org_id: uuid.UUID,
    action: str,
    user_id: Optional[uuid.UUID] = None,
    platform: Optional[str] = None,
    model: Optional[str] = None,
    prompt_text: Optional[str] = None,
    entities_detected: Optional[list[str]] = None,
    policy_id: Optional[uuid.UUID] = None,
    policy_name: Optional[str] = None,
    decision: Optional[str] = None,
    severity: Optional[str] = None,
    response_time_ms: Optional[int] = None,
    session_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    category: Optional[str] = None,
) -> AuditLog:
    """Create an audit log entry."""
    prompt_hash = None
    if prompt_text:
        prompt_hash = hashlib.sha256(prompt_text.encode()).hexdigest()

    log = AuditLog(
        org_id=org_id,
        user_id=user_id,
        action=action,
        platform=platform,
        model=model,
        prompt_hash=prompt_hash,
        entities_detected=entities_detected or [],
        policy_id=policy_id,
        policy_name=policy_name,
        decision=decision,
        severity=severity,
        response_time_ms=response_time_ms,
        session_id=session_id,
        ip_address=ip_address,
        user_agent=user_agent,
        category=category,
    )
    db.add(log)
    return log


async def query_logs(
    db: AsyncSession,
    org_id: uuid.UUID,
    page: int = 1,
    per_page: int = 50,
    user_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    platform: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> tuple[list[AuditLog], int]:
    query = select(AuditLog).where(AuditLog.org_id == org_id)

    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if action:
        query = query.where(AuditLog.action == action)
    if platform:
        query = query.where(AuditLog.platform == platform)
    if date_from:
        query = query.where(AuditLog.created_at >= date_from)
    if date_to:
        query = query.where(AuditLog.created_at <= date_to)

    count_q = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_q) or 0

    query = query.order_by(AuditLog.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def get_log(db: AsyncSession, log_id: uuid.UUID, org_id: uuid.UUID) -> AuditLog:
    log = await db.scalar(
        select(AuditLog).where(AuditLog.id == log_id, AuditLog.org_id == org_id)
    )
    if not log:
        raise NotFoundError(resource="AuditLog", resource_id=str(log_id))
    return log


async def get_stats(db: AsyncSession, org_id: uuid.UUID) -> dict:
    """Return summary statistics for the organization's audit logs."""
    base = select(AuditLog).where(AuditLog.org_id == org_id)

    async def count_action(action_val: str) -> int:
        q = select(func.count()).select_from(
            select(AuditLog).where(AuditLog.org_id == org_id, AuditLog.action == action_val).subquery()
        )
        return await db.scalar(q) or 0

    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0

    # Top entity types: unnest the JSONB array entities_detected and count occurrences
    entity_rows = await db.execute(
        text("""
            SELECT elem AS entity_type, COUNT(*) AS cnt
            FROM audit_logs,
                 jsonb_array_elements_text(entities_detected) AS elem
            WHERE org_id = :org_id
              AND entities_detected IS NOT NULL
              AND jsonb_array_length(entities_detected) > 0
            GROUP BY elem
            ORDER BY cnt DESC
            LIMIT 10
        """),
        {"org_id": str(org_id)},
    )
    top_entities = [
        {"entity_type": row.entity_type, "count": row.cnt}
        for row in entity_rows
    ]

    # Top platforms: group by platform column
    platform_rows = await db.execute(
        select(AuditLog.platform, func.count().label("cnt"))
        .where(AuditLog.org_id == org_id, AuditLog.platform.isnot(None))
        .group_by(AuditLog.platform)
        .order_by(func.count().desc())
        .limit(10)
    )
    top_platforms = [
        {"platform": row.platform, "count": row.cnt}
        for row in platform_rows
    ]

    return {
        "total_scans": total,
        "total_blocks": await count_action("hard_block"),
        "total_masks": await count_action("mask"),
        "total_allows": await count_action("allow"),
        "total_alerts": await count_action("alert"),
        "top_entities": top_entities,
        "top_platforms": top_platforms,
    }
