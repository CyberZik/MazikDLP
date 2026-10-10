"""
MazikDLP - Masking Service
Reversible placeholder-based text masking using Redis session storage.

Flow:
  1. detect() finds john@gmail.com at [10:24]
  2. mask() replaces with <EMAIL_a3f7>, stores {<EMAIL_a3f7>: john@gmail.com} in Redis
  3. masked text is sent to AI
  4. restore() replaces placeholders back with original values
"""

import hashlib
import json
import uuid
import logging
from typing import Optional

import redis.asyncio as aioredis

from app.config import get_settings
from app.detectors.base import DetectionResult

logger = logging.getLogger(__name__)
settings = get_settings()

# Redis key prefix
SESSION_KEY_PREFIX = "masking:session:"


def _placeholder(entity_type: str, text: str) -> str:
    """Generate a deterministic placeholder for a detected entity."""
    short_hash = hashlib.md5(text.encode()).hexdigest()[:4]
    # Shorten long entity types for readability
    short_type = entity_type.replace("_", "").upper()[:8]
    return f"{settings.MASK_PREFIX}{short_type}_{short_hash}{settings.MASK_SUFFIX}"


def mask_text(
    text: str,
    entities: list[DetectionResult],
) -> tuple[str, str, dict[str, str]]:
    """
    Replace detected entities with placeholders.

    Returns:
        (masked_text, session_id, placeholder_map)
    """
    if not entities:
        session_id = str(uuid.uuid4())
        return text, session_id, {}

    # Sort by start descending so we can replace without offset drift
    sorted_entities = sorted(entities, key=lambda e: e.start, reverse=True)

    placeholder_map: dict[str, str] = {}
    masked = text

    for entity in sorted_entities:
        original = text[entity.start:entity.end]
        placeholder = _placeholder(entity.entity_type, original)
        placeholder_map[placeholder] = original
        masked = masked[:entity.start] + placeholder + masked[entity.end:]

    session_id = str(uuid.uuid4())
    return masked, session_id, placeholder_map


async def save_session(
    redis: aioredis.Redis,
    session_id: str,
    placeholder_map: dict[str, str],
    ttl: Optional[int] = None,
) -> None:
    """Persist the placeholder map in Redis."""
    if not placeholder_map:
        return
    key = f"{SESSION_KEY_PREFIX}{session_id}"
    ttl = ttl or settings.MASK_SESSION_TTL
    await redis.setex(key, ttl, json.dumps(placeholder_map))
    logger.debug(f"Saved masking session {session_id} with {len(placeholder_map)} placeholders")


async def restore_text(
    redis: aioredis.Redis,
    masked_text: str,
    session_id: str,
) -> str:
    """
    Replace all placeholders in masked_text with their original values.
    Deletes the session from Redis after restoring.
    """
    key = f"{SESSION_KEY_PREFIX}{session_id}"
    raw = await redis.get(key)
    if not raw:
        logger.warning(f"Masking session {session_id} not found or expired")
        return masked_text

    placeholder_map: dict[str, str] = json.loads(raw)
    restored = masked_text
    for placeholder, original in placeholder_map.items():
        restored = restored.replace(placeholder, original)

    # Clean up session
    await redis.delete(key)
    logger.debug(f"Restored masking session {session_id}")
    return restored
