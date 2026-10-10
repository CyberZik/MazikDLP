"""
MazikDLP - Detection Pipeline Orchestrator
Runs all detectors, deduplicates results, resolves overlaps, and returns ranked entities.
"""

import logging
from functools import lru_cache

from app.config import get_settings
from app.detectors.base import DetectionResult
from app.detectors.code_detector import CodeDetector
from app.detectors.credential_detector import CredentialDetector
from app.detectors.db_schema_detector import DBSchemaDetector
from app.detectors.presidio_engine import PresidioDetector
from app.detectors.secrets_detector import SecretsDetector

logger = logging.getLogger(__name__)


def _resolve_overlaps(entities: list[DetectionResult]) -> list[DetectionResult]:
    """
    Remove overlapping detections by keeping the highest-scoring entity.
    When scores are equal, prefer the longer match.
    """
    if not entities:
        return []

    # Sort by start position, then by score descending, then by length descending
    sorted_entities = sorted(
        entities,
        key=lambda e: (e.start, -(e.score), -(e.end - e.start)),
    )

    resolved: list[DetectionResult] = []
    last_end = -1

    for entity in sorted_entities:
        if entity.start >= last_end:
            resolved.append(entity)
            last_end = entity.end
        elif entity.score > (resolved[-1].score if resolved else 0):
            # Better score — replace previous
            resolved.pop()
            resolved.append(entity)
            last_end = entity.end

    return resolved


def _deduplicate(entities: list[DetectionResult]) -> list[DetectionResult]:
    """
    Remove exact duplicates (same start, end, entity_type).
    Keep the one with the highest score.
    """
    seen: dict[tuple, DetectionResult] = {}
    for e in entities:
        key = (e.start, e.end, e.entity_type)
        if key not in seen or e.score > seen[key].score:
            seen[key] = e
    return list(seen.values())


class DetectionPipeline:
    """
    Runs all enabled detectors and returns a clean, sorted list of detections.
    Respects feature flags from settings.
    """

    def __init__(self):
        settings = get_settings()
        self._detectors = []

        # Presidio (covers standard PII + Indian PII via registered recognizers)
        if settings.FEATURE_PII_DETECTION or settings.FEATURE_INDIAN_PII:
            presidio = PresidioDetector(threshold=settings.DETECTION_THRESHOLD)
            self._detectors.append(presidio)

            # Register Indian PII recognizers into Presidio
            if settings.FEATURE_INDIAN_PII:
                try:
                    from app.detectors.indian_pii import register_indian_recognizers
                    register_indian_recognizers()
                    logger.info("Indian PII recognizers registered")
                except Exception as e:
                    logger.warning(f"Failed to register Indian PII recognizers: {e}")

        if settings.FEATURE_CREDENTIAL_DETECTION:
            self._detectors.append(CredentialDetector())

        if settings.FEATURE_CODE_DETECTION:
            self._detectors.append(CodeDetector())

        if settings.FEATURE_SECRETS_DETECTION:
            self._detectors.append(SecretsDetector())

        if settings.FEATURE_DB_SCHEMA_DETECTION:
            self._detectors.append(DBSchemaDetector())

        logger.info(f"Detection pipeline initialized with {len(self._detectors)} detectors")

    def analyze(self, text: str) -> list[DetectionResult]:
        """
        Run all detectors on the given text.
        Returns a deduplicated, overlap-resolved, sorted list of DetectionResult.
        """
        if not text or not text.strip():
            return []

        all_results: list[DetectionResult] = []
        for detector in self._detectors:
            try:
                results = detector.detect(text)
                all_results.extend(results)
            except Exception as e:
                logger.error(f"Detector {detector.name} failed: {e}")

        # Clean up
        deduped = _deduplicate(all_results)
        resolved = _resolve_overlaps(deduped)

        # Sort by position
        resolved.sort(key=lambda e: e.start)

        logger.debug(f"Detection complete: {len(resolved)} entities found")
        return resolved


# Singleton pipeline — loaded once at startup
_pipeline: DetectionPipeline | None = None


def get_pipeline() -> DetectionPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = DetectionPipeline()
    return _pipeline
