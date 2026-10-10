"""
MazikDLP - Credential Detector
Detects passwords, usernames, and connection strings in text.
"""

import re
from app.detectors.base import BaseDetector, DetectionResult


class CredentialDetector(BaseDetector):
    """
    Regex-based detector for credentials:
    - password=... / passwd=... / pwd=...
    - connection strings (jdbc:, mongodb://, redis://, mysql://)
    - Basic auth headers
    - username:password patterns
    """

    PATTERNS = [
        # password assignment patterns
        (
            "CREDENTIAL",
            re.compile(
                r"(?i)(password|passwd|pwd|secret|api_key|apikey|access_key|auth_token)"
                r"\s*[=:]\s*['\"]?([^\s'\"]{4,})['\"]?",
                re.IGNORECASE,
            ),
            0.85,
        ),
        # JDBC connection strings
        (
            "CREDENTIAL",
            re.compile(r"jdbc:[a-zA-Z0-9]+://[^\s]+"),
            0.9,
        ),
        # MongoDB connection strings
        (
            "CREDENTIAL",
            re.compile(r"mongodb(\+srv)?://[^\s]+"),
            0.9,
        ),
        # Redis with password
        (
            "CREDENTIAL",
            re.compile(r"redis://:[^\s@]+@[^\s]+"),
            0.9,
        ),
        # MySQL / Postgres connection strings
        (
            "CREDENTIAL",
            re.compile(r"(mysql|postgresql|postgres)://[^\s]+:[^\s]+@[^\s]+"),
            0.9,
        ),
        # Basic auth header value
        (
            "CREDENTIAL",
            re.compile(r"Basic\s+[A-Za-z0-9+/]{8,}={0,2}"),
            0.8,
        ),
        # Bearer token (non-JWT) — long opaque token
        (
            "CREDENTIAL",
            re.compile(r"Bearer\s+[A-Za-z0-9_\-]{20,}"),
            0.7,
        ),
    ]

    @property
    def name(self) -> str:
        return "credential_detector"

    def detect(self, text: str) -> list[DetectionResult]:
        results = []
        for entity_type, pattern, score in self.PATTERNS:
            for match in pattern.finditer(text):
                results.append(DetectionResult(
                    entity_type=entity_type,
                    start=match.start(),
                    end=match.end(),
                    score=score,
                    text=match.group(),
                    detector=self.name,
                ))
        return results
