"""
MazikDLP - Presidio PII Detection Engine
Detects standard PII: EMAIL_ADDRESS, PHONE_NUMBER, CREDIT_CARD, PERSON.
Loads spaCy en_core_web_lg model once at startup.
"""

import logging
from typing import Optional

from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

from app.detectors.base import BaseDetector, DetectionResult

logger = logging.getLogger(__name__)

# Singleton — loaded once
_analyzer: Optional[AnalyzerEngine] = None


def get_analyzer() -> AnalyzerEngine:
    """Return the singleton AnalyzerEngine, initializing on first call."""
    global _analyzer
    if _analyzer is None:
        logger.info("Loading Presidio AnalyzerEngine with spaCy en_core_web_lg...")
        nlp_config = {
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_lg"}],
        }
        provider = NlpEngineProvider(nlp_configuration=nlp_config)
        nlp_engine = provider.create_engine()
        _analyzer = AnalyzerEngine(nlp_engine=nlp_engine)
        logger.info("Presidio AnalyzerEngine ready")
    return _analyzer


# Standard PII entity types to detect
STANDARD_PII_ENTITIES = [
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "CREDIT_CARD",
    "PERSON",
    "IBAN_CODE",
    "IP_ADDRESS",
    "LOCATION",
    "DATE_TIME",
    "NRP",  # Nationality, Religious or Political group
    "MEDICAL_LICENSE",
    "URL",
    "US_SSN",
    "US_BANK_NUMBER",
    "US_DRIVER_LICENSE",
    "US_PASSPORT",
    # Indian PII (registered via custom recognizers)
    "IN_PAN",
    "IN_AADHAAR",
    "IN_GSTIN",
    "IN_IFSC",
    "IN_PHONE_NUMBER",
    "IN_PASSPORT",
    "IN_VOTER_ID",
    "IN_DRIVING_LICENSE",
    "IN_UPI_ID",
    "IN_PIN_CODE",
    "IN_VEHICLE_REG",
    "IN_UAN",
    "IN_PRAN",
    "IN_CIN",
    "IN_BANK_ACCOUNT",
]


class PresidioDetector(BaseDetector):
    """
    Wraps Microsoft Presidio AnalyzerEngine.
    Detects standard PII entities.
    """

    def __init__(self, entities: list[str] | None = None, threshold: float = 0.5):
        self._entities = entities or STANDARD_PII_ENTITIES
        self._threshold = threshold

    @property
    def name(self) -> str:
        return "presidio"

    def detect(self, text: str) -> list[DetectionResult]:
        if not text.strip():
            return []

        analyzer = get_analyzer()
        results = analyzer.analyze(
            text=text,
            language="en",
            entities=self._entities,
            score_threshold=self._threshold,
        )

        return [
            DetectionResult(
                entity_type=r.entity_type,
                start=r.start,
                end=r.end,
                score=r.score,
                text=text[r.start:r.end],
                detector=self.name,
            )
            for r in results
        ]


def add_recognizer(recognizer) -> None:
    """Add a custom recognizer to the global Presidio AnalyzerEngine."""
    analyzer = get_analyzer()
    analyzer.registry.add_recognizer(recognizer)
