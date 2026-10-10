"""
MazikDLP - Custom Patterns API
CRUD + test + import/export for user-defined detection patterns.
"""

import re
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.pattern import CustomPattern
from app.models.user import User, UserRole
from app.utils.deps import get_current_user, require_roles
from app.utils.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/patterns", tags=["Custom Patterns"])


class PatternCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    entity_type: str = Field(..., min_length=1, max_length=100)
    pattern_type: str = Field(default="regex", pattern="^(regex|keyword|keyword_list)$")
    pattern: str = Field(..., min_length=1)
    flags: Optional[str] = None
    sensitivity: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    action: str = Field(default="mask", pattern="^(allow|alert|soft_block|mask|hard_block)$")
    category: Optional[str] = None
    examples_positive: list[str] = Field(default_factory=list)
    examples_negative: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    is_enabled: bool = True


class PatternResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    description: Optional[str]
    entity_type: str
    pattern_type: str
    pattern: str
    sensitivity: str
    action: str
    category: Optional[str]
    tags: list[str] = Field(default_factory=list)
    is_enabled: bool
    total_detections: int
    version: int

    model_config = {"from_attributes": True}


class PatternTestRequest(BaseModel):
    pattern: str
    pattern_type: str = "regex"
    flags: Optional[str] = None
    test_text: str


class PatternTestResponse(BaseModel):
    matches: list[dict]
    match_count: int
    valid: bool
    error: Optional[str] = None


@router.get("", response_model=list[PatternResponse])
async def list_patterns(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CustomPattern).where(CustomPattern.org_id == current_user.org_id)
    )
    return [PatternResponse.model_validate(p) for p in result.scalars().all()]


@router.post("", response_model=PatternResponse, status_code=status.HTTP_201_CREATED)
async def create_pattern(
    payload: PatternCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST)),
    db: AsyncSession = Depends(get_db),
):
    # Validate regex
    if payload.pattern_type == "regex":
        _validate_regex(payload.pattern, payload.flags)

    p = CustomPattern(
        org_id=current_user.org_id,
        created_by=current_user.id,
        **payload.model_dump(),
    )
    db.add(p)
    await db.flush()
    return PatternResponse.model_validate(p)


@router.put("/{pattern_id}", response_model=PatternResponse)
async def update_pattern(
    pattern_id: uuid.UUID,
    payload: PatternCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST)),
    db: AsyncSession = Depends(get_db),
):
    p = await _get_or_404(db, pattern_id, current_user.org_id)
    if payload.pattern_type == "regex":
        _validate_regex(payload.pattern, payload.flags)
    for k, v in payload.model_dump().items():
        setattr(p, k, v)
    p.version += 1
    return PatternResponse.model_validate(p)


@router.delete("/{pattern_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pattern(
    pattern_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SECURITY_ANALYST)),
    db: AsyncSession = Depends(get_db),
):
    p = await _get_or_404(db, pattern_id, current_user.org_id)
    await db.delete(p)


@router.post("/test", response_model=PatternTestResponse)
async def test_pattern(
    payload: PatternTestRequest,
    current_user: User = Depends(get_current_user),
):
    """Test a regex pattern against sample text without saving it."""
    try:
        flags = 0
        if payload.flags and "i" in payload.flags:
            flags |= re.IGNORECASE
        compiled = re.compile(payload.pattern, flags)
        matches = [
            {"match": m.group(), "start": m.start(), "end": m.end()}
            for m in compiled.finditer(payload.test_text)
        ]
        return PatternTestResponse(matches=matches, match_count=len(matches), valid=True)
    except re.error as e:
        return PatternTestResponse(matches=[], match_count=0, valid=False, error=str(e))


@router.get("/export")
async def export_patterns(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CustomPattern).where(CustomPattern.org_id == current_user.org_id)
    )
    patterns = result.scalars().all()
    return {"patterns": [PatternResponse.model_validate(p).model_dump() for p in patterns]}


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _get_or_404(db: AsyncSession, pattern_id: uuid.UUID, org_id: uuid.UUID) -> CustomPattern:
    p = await db.scalar(
        select(CustomPattern).where(
            CustomPattern.id == pattern_id,
            CustomPattern.org_id == org_id,
        )
    )
    if not p:
        raise NotFoundError(resource="CustomPattern", resource_id=str(pattern_id))
    return p


def _validate_regex(pattern: str, flags: Optional[str] = None) -> None:
    try:
        re_flags = 0
        if flags and "i" in flags:
            re_flags |= re.IGNORECASE
        re.compile(pattern, re_flags)
    except re.error as e:
        raise ValidationError(f"Invalid regex pattern: {e}")
