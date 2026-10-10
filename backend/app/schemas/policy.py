"""
Policy CRUD schemas.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class PolicyCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    protection_level: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    action: str = Field(default="mask", pattern="^(allow|alert|soft_block|hard_block|mask)$")
    data_types: List[str] = Field(default_factory=list)
    user_groups: List[str] = Field(default_factory=list)
    ai_platforms: List[str] = Field(default_factory=list)
    ai_models: List[str] = Field(default_factory=list)
    priority: int = Field(default=100, ge=1, le=1000)
    status: str = Field(default="active", pattern="^(active|inactive|draft)$")


class PolicyUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    protection_level: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    action: Optional[str] = Field(None, pattern="^(allow|alert|soft_block|hard_block|mask)$")
    data_types: Optional[List[str]] = None
    user_groups: Optional[List[str]] = None
    ai_platforms: Optional[List[str]] = None
    ai_models: Optional[List[str]] = None
    priority: Optional[int] = Field(None, ge=1, le=1000)
    status: Optional[str] = Field(None, pattern="^(active|inactive|draft)$")


class PolicyResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    description: Optional[str]
    category: Optional[str]
    protection_level: str
    action: str
    data_types: List[str]
    user_groups: List[str]
    ai_platforms: List[str]
    ai_models: List[str]
    priority: int
    status: str
    created_by: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
