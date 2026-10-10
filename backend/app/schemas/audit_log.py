"""
Audit log schemas.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    user_id: Optional[uuid.UUID]
    action: str
    platform: Optional[str]
    model: Optional[str]
    entities_detected: List[str]
    policy_id: Optional[uuid.UUID]
    policy_name: Optional[str]
    decision: Optional[str]
    severity: Optional[str]
    response_time_ms: Optional[int]
    session_id: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogStatsResponse(BaseModel):
    total_scans: int
    total_blocks: int
    total_masks: int
    total_allows: int
    total_alerts: int
    top_entities: List[dict]
    top_platforms: List[dict]
