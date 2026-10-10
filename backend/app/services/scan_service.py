"""
MazikDLP - Scan Service
Orchestrates detection + policy evaluation + masking.
"""

import logging
import re
import uuid
from typing import Optional

import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.detectors.pipeline import get_pipeline
from app.detectors.base import DetectionResult
from app.models.pattern import CustomPattern
from app.schemas.scan import DetectedEntity, ScanRequest, ScanResponse
from app.services import audit_service, masking_service, policy_service
from app.services.policy_service import ACTION_PRIORITY

logger = logging.getLogger(__name__)
settings = get_settings()


async def scan(
    request: ScanRequest,
    db: AsyncSession,
    redis: aioredis.Redis,
    org_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
    user_role: Optional[str] = None,
) -> ScanResponse:
    """
    Full scan pipeline:
    1. Run detection
    2. Evaluate policies
    3. Apply action (allow/alert/mask/block)
    4. Return response
    """
    text = request.text
    from app.services.prompt_categorizer import categorize as _categorize
    prompt_category = _categorize(text)

    # ── Step 1: Detect ────────────────────────────────────────────────────────
    pipeline = get_pipeline()
    entities = pipeline.analyze(text)

    # Also run org-specific custom patterns from the database
    custom_pattern_actions: dict[str, str] = {}  # entity_type → action
    if org_id:
        custom_hits, custom_pattern_actions = await _run_custom_patterns(db, org_id, text)
        entities = entities + custom_hits

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

    # ── Step 2: Evaluate policies ─────────────────────────────────────────────
    severity_map = {
        "hard_block": "critical",
        "soft_block": "high",
        "mask": "medium",
        "alert": "low",
        "allow": "info",
    }

    async def _log(
        final_action: str,
        entity_types: list[str] | None = None,
        policy_id=None,
        policy_name=None,
        session_id: Optional[str] = None,
    ) -> None:
        if org_id is None:
            return  # Can't log without org scope
        await audit_service.write_log(
            db=db,
            org_id=org_id,
            user_id=user_id,
            action=final_action,
            platform=request.platform,
            model=request.model,
            prompt_text=text,
            entities_detected=entity_types or [],
            policy_id=policy_id,
            policy_name=policy_name,
            decision=final_action,
            severity=severity_map.get(final_action, "info"),
            session_id=session_id,
            category=prompt_category,
        )

    if not entities:
        await _log("allow")
        return ScanResponse(
            action="allow",
            entities_detected=[],
        )

    if org_id:
        policies = await policy_service.list_policies(db, org_id, status="active")
        action, matched_policy = policy_service.evaluate_policies(
            entities, policies, user_role=user_role, platform=request.platform, model=request.model
        )
        # If no DB policy matched, use the custom pattern's own action as fallback
        if action == "allow" and matched_policy is None:
            if custom_pattern_actions:
                # Pick the strictest action among all matched custom patterns
                action = _strictest_action(
                    [custom_pattern_actions[e.entity_type]
                     for e in entities
                     if e.entity_type in custom_pattern_actions]
                ) or _default_action(entities)
            else:
                action = _default_action(entities)
    else:
        action = _default_action(entities)
        matched_policy = None

    # ── Step 3: Apply action ──────────────────────────────────────────────────
    policy_name = matched_policy.name if matched_policy else None
    policy_id = matched_policy.id if matched_policy else None
    entity_types = [e.entity_type for e in entities]

    if action == "hard_block":
        await _log("hard_block", entity_types=entity_types, policy_id=policy_id, policy_name=policy_name)
        return ScanResponse(
            action="hard_block",
            message="Sensitive data detected. Request blocked by security policy.",
            entities_detected=entity_responses,
            policy_matched=policy_name,
        )

    if action == "mask":
        masked_text, session_id, placeholder_map = masking_service.mask_text(text, entities)
        await masking_service.save_session(redis, session_id, placeholder_map)
        await _log("mask", entity_types=entity_types, policy_id=policy_id, policy_name=policy_name, session_id=session_id)
        return ScanResponse(
            action="mask",
            masked_text=masked_text,
            session_id=session_id,
            entities_detected=entity_responses,
            policy_matched=policy_name,
        )

    # allow / alert / soft_block — return text unchanged
    await _log(action, entity_types=entity_types, policy_id=policy_id, policy_name=policy_name)
    return ScanResponse(
        action=action,
        masked_text=text,
        entities_detected=entity_responses,
        policy_matched=policy_name,
    )


async def _run_custom_patterns(
    db: AsyncSession,
    org_id: uuid.UUID,
    text: str,
) -> tuple[list[DetectionResult], dict[str, str]]:
    """
    Load enabled custom patterns for the org and run them against the text.
    Returns:
        - DetectionResult list merged with Presidio results
        - dict mapping entity_type → pattern action (used as fallback when no policy matches)
    """
    result = await db.execute(
        select(CustomPattern).where(
            CustomPattern.org_id == org_id,
            CustomPattern.is_enabled == True,  # noqa: E712
        )
    )
    patterns = result.scalars().all()

    hits: list[DetectionResult] = []
    action_map: dict[str, str] = {}  # entity_type → action

    for p in patterns:
        try:
            matched = False
            if p.pattern_type == "regex":
                flags = 0
                if p.flags and "i" in p.flags:
                    flags |= re.IGNORECASE
                compiled = re.compile(p.pattern, flags)
                for m in compiled.finditer(text):
                    hits.append(DetectionResult(
                        entity_type=p.entity_type,
                        start=m.start(),
                        end=m.end(),
                        score=0.85,
                        text=m.group(),
                        detector="custom_pattern",
                    ))
                    matched = True
            elif p.pattern_type in ("keyword", "keyword_list"):
                keywords = [k.strip() for k in p.pattern.split(",") if k.strip()]
                for kw in keywords:
                    kw_lower = kw.lower()
                    text_lower = text.lower()
                    start = 0
                    while True:
                        idx = text_lower.find(kw_lower, start)
                        if idx == -1:
                            break
                        hits.append(DetectionResult(
                            entity_type=p.entity_type,
                            start=idx,
                            end=idx + len(kw),
                            score=0.80,
                            text=text[idx:idx + len(kw)],
                            detector="custom_pattern",
                        ))
                        matched = True
                        start = idx + 1
            if matched:
                # Keep the strictest action if multiple patterns share the same entity_type
                existing = action_map.get(p.entity_type)
                if existing is None or ACTION_PRIORITY.get(p.action, 0) > ACTION_PRIORITY.get(existing, 0):
                    action_map[p.entity_type] = p.action
        except Exception:
            logger.warning(f"Custom pattern '{p.name}' failed to run — skipping")

    return hits, action_map


def _strictest_action(actions: list[str]) -> str | None:
    """Return the strictest action from a list, or None if list is empty."""
    if not actions:
        return None
    return max(actions, key=lambda a: ACTION_PRIORITY.get(a, 0))


def _default_action(entities) -> str:
    """
    Default policy (no DB policies) — mirrors the original prototype's rule set.
    """
    BLOCK_TYPES = {
        "IN_PAN", "IN_AADHAAR", "IN_GSTIN", "CUSTOM_SECRET", "CREDENTIAL", "SOURCE_CODE",
        "IN_PASSPORT", "IN_DRIVING_LICENSE", "IN_VOTER_ID", "IN_CIN",
    }
    MASK_TYPES = {
        "EMAIL_ADDRESS", "PHONE_NUMBER", "IN_IFSC", "CREDIT_CARD", "PERSON",
        "IN_PHONE_NUMBER", "IN_UPI_ID", "IN_BANK_ACCOUNT", "IN_UAN", "IN_PRAN",
    }

    for e in entities:
        if e.entity_type in BLOCK_TYPES:
            return "hard_block"

    for e in entities:
        if e.entity_type in MASK_TYPES:
            return "mask"

    return "alert"
