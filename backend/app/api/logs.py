"""
MazikDLP - Audit Logs API Endpoints
GET /logs, /logs/{id}, /logs/stats, /logs/export
"""

import csv
import io
import math
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.audit_log import AuditLogResponse, AuditLogStatsResponse
from app.services import audit_service
from app.utils.deps import get_current_user, require_roles

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("/stats", response_model=AuditLogStatsResponse, summary="Log statistics")
async def get_stats(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST, UserRole.MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    return await audit_service.get_stats(db, current_user.org_id)


@router.get("", summary="Query audit logs (paginated)")
async def list_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    user_id: Optional[uuid.UUID] = Query(None),
    action: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST, UserRole.MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    logs, total = await audit_service.query_logs(
        db,
        current_user.org_id,
        page=page,
        per_page=per_page,
        user_id=user_id,
        action=action,
        platform=platform,
        date_from=date_from,
        date_to=date_to,
    )
    pages = math.ceil(total / per_page) if total else 0
    return {
        "status": "success",
        "data": [AuditLogResponse.model_validate(log) for log in logs],
        "meta": {"page": page, "per_page": per_page, "total": total, "pages": pages},
    }


@router.get("/export", summary="Export audit logs as CSV download")
async def export_logs(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    action: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST, UserRole.MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    logs, _ = await audit_service.query_logs(
        db,
        current_user.org_id,
        page=1,
        per_page=2000,
        action=action,
        platform=platform,
        date_from=date_from,
        date_to=date_to,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "timestamp", "action", "decision", "severity", "platform", "model",
        "entities_detected", "policy_name", "response_time_ms",
        "user_id", "ip_address", "session_id",
    ])
    for log in logs:
        writer.writerow([
            log.created_at.isoformat() if log.created_at else "",
            log.action or "",
            log.decision or "",
            log.severity or "",
            log.platform or "",
            log.model or "",
            ", ".join(log.entities_detected or []),
            log.policy_name or "",
            log.response_time_ms or "",
            str(log.user_id) if log.user_id else "",
            log.ip_address or "",
            log.session_id or "",
        ])

    output.seek(0)
    filename = f"mazikdlp_audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{log_id}", response_model=AuditLogResponse, summary="Get log by ID")
async def get_log(
    log_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST)),
    db: AsyncSession = Depends(get_db),
):
    log = await audit_service.get_log(db, log_id, current_user.org_id)
    return AuditLogResponse.model_validate(log)
