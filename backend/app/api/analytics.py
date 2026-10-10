"""
MazikDLP - Analytics API
Usage trends, security metrics, user/app analytics.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole
from app.utils.deps import require_roles

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/usage")
async def usage_trends(
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST, UserRole.MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Daily scan counts for the past N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(
            func.date_trunc("day", AuditLog.created_at).label("day"),
            func.count().label("count"),
        )
        .where(AuditLog.org_id == current_user.org_id, AuditLog.created_at >= since)
        .group_by("day")
        .order_by("day")
    )
    rows = result.all()
    return {
        "status": "success",
        "data": [{"date": row.day.date().isoformat(), "count": row.count} for row in rows],
        "period_days": days,
    }


@router.get("/security")
async def security_metrics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST, UserRole.MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Breakdown of actions (allow/mask/block/alert)."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(AuditLog.action, func.count().label("count"))
        .where(AuditLog.org_id == current_user.org_id, AuditLog.created_at >= since)
        .group_by(AuditLog.action)
    )
    rows = result.all()
    return {
        "status": "success",
        "data": {row.action: row.count for row in rows},
        "period_days": days,
    }


@router.get("/apps")
async def app_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST, UserRole.MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Scan counts by AI platform."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(AuditLog.platform, func.count().label("count"))
        .where(
            AuditLog.org_id == current_user.org_id,
            AuditLog.created_at >= since,
            AuditLog.platform.isnot(None),
        )
        .group_by(AuditLog.platform)
        .order_by(func.count().desc())
    )
    rows = result.all()
    return {
        "status": "success",
        "data": [{"platform": row.platform, "count": row.count} for row in rows],
        "period_days": days,
    }


@router.get("/categories")
async def category_analytics(
    days: int = Query(30, ge=1, le=365),
    platform: Optional[str] = Query(None, description="Filter by AI platform"),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST, UserRole.MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Prompt counts grouped by usage category, with optional platform filter."""
    from app.services.prompt_categorizer import all_categories
    since = datetime.now(timezone.utc) - timedelta(days=days)

    query = (
        select(AuditLog.category, func.count().label("count"))
        .where(
            AuditLog.org_id == current_user.org_id,
            AuditLog.created_at >= since,
        )
    )
    if platform:
        query = query.where(AuditLog.platform == platform)

    query = query.group_by(AuditLog.category).order_by(func.count().desc())
    result = await db.execute(query)
    rows = result.all()

    # Build a map of category key → count
    cat_map = {row.category or "miscellaneous": row.count for row in rows}

    # Return all categories in definition order, filling 0 for missing ones
    all_cats = all_categories()
    data = [
        {
            "category": cat["key"],
            "label": cat["label"],
            "color": cat["color"],
            "count": cat_map.get(cat["key"], 0),
        }
        for cat in all_cats
    ]
    # Filter out zeros (unless everything is zero)
    non_zero = [d for d in data if d["count"] > 0]
    return {
        "status": "success",
        "data": non_zero if non_zero else data,
        "period_days": days,
        "platform_filter": platform,
    }


@router.get("/users")
async def user_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST, UserRole.MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Top users by scan volume."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(AuditLog.user_id, func.count().label("count"))
        .where(
            AuditLog.org_id == current_user.org_id,
            AuditLog.created_at >= since,
            AuditLog.user_id.isnot(None),
        )
        .group_by(AuditLog.user_id)
        .order_by(func.count().desc())
        .limit(20)
    )
    rows = result.all()
    return {
        "status": "success",
        "data": [{"user_id": str(row.user_id), "count": row.count} for row in rows],
        "period_days": days,
    }
