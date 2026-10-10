"""
MazikDLP - Scan API Endpoints
POST /scan, /restore, /detect/test
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db, get_redis
from app.schemas.scan import (
    DetectTestRequest,
    DetectTestResponse,
    DetectedEntity,
    RestoreRequest,
    RestoreResponse,
    ScanRequest,
    ScanResponse,
)
from app.services import masking_service, scan_service
from app.utils.deps import get_current_user
from app.models.user import User

router = APIRouter(tags=["Scanning"])


@router.post(
    "/scan",
    response_model=ScanResponse,
    summary="Scan text for sensitive data and apply DLP policy",
)
async def scan_text(
    payload: ScanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    return await scan_service.scan(
        request=payload,
        db=db,
        redis=redis,
        org_id=current_user.org_id,
        user_id=current_user.id,
        user_role=current_user.role,
    )


@router.post(
    "/restore",
    response_model=RestoreResponse,
    summary="Restore masked text using session ID",
)
async def restore_text(
    payload: RestoreRequest,
    current_user: User = Depends(get_current_user),
    redis: aioredis.Redis = Depends(get_redis),
):
    restored = await masking_service.restore_text(redis, payload.masked_text, payload.session_id)
    return RestoreResponse(restored_text=restored, session_id=payload.session_id)


@router.post(
    "/detect/test",
    response_model=DetectTestResponse,
    summary="Test detection without applying policies (debug use)",
)
async def test_detection(
    payload: DetectTestRequest,
    current_user: User = Depends(get_current_user),
):
    from app.detectors.pipeline import get_pipeline
    pipeline = get_pipeline()
    entities = pipeline.analyze(payload.text)
    entity_responses = [
        DetectedEntity(
            entity_type=e.entity_type,
            start=e.start,
            end=e.end,
            score=e.score,
            text=e.text,
            detector=e.detector,
        )
        for e in entities
    ]
    return DetectTestResponse(
        entities=entity_responses,
        count=len(entity_responses),
        entity_types=list({e.entity_type for e in entities}),
    )
