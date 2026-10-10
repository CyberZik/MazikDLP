"""
MazikDLP - Secrets & API Key Detector
Detects AWS keys, GCP keys, GitHub tokens, private keys, JWTs, and generic secrets.
"""

import re
from app.detectors.base import BaseDetector, DetectionResult


class SecretsDetector(BaseDetector):
    """
    High-confidence regex patterns for API keys, tokens, and private keys.
    """

    PATTERNS = [
        # AWS Access Key ID
        (
            "CUSTOM_SECRET",
            re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
            0.95,
        ),
        # AWS Secret Access Key (typically 40 chars, base64-ish)
        (
            "CUSTOM_SECRET",
            re.compile(r"(?i)aws.{0,20}secret.{0,20}['\"]?([A-Za-z0-9/+=]{40})['\"]?"),
            0.9,
        ),
        # Google API Key
        (
            "CUSTOM_SECRET",
            re.compile(r"\bAIza[0-9A-Za-z_\-]{35}\b"),
            0.95,
        ),
        # GitHub Personal Access Token (classic)
        (
            "CUSTOM_SECRET",
            re.compile(r"\bghp_[A-Za-z0-9]{36}\b"),
            0.95,
        ),
        # GitHub OAuth Token
        (
            "CUSTOM_SECRET",
            re.compile(r"\bgho_[A-Za-z0-9]{36}\b"),
            0.95,
        ),
        # GitHub App Token
        (
            "CUSTOM_SECRET",
            re.compile(r"\bghu_[A-Za-z0-9]{36}\b"),
            0.95,
        ),
        # Slack Token
        (
            "CUSTOM_SECRET",
            re.compile(r"\bxox[baprs]-[0-9A-Za-z\-]{10,}\b"),
            0.95,
        ),
        # RSA / EC private key
        (
            "CUSTOM_SECRET",
            re.compile(
                r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
                re.MULTILINE,
            ),
            1.0,
        ),
        # JWT token (three base64url parts separated by dots)
        (
            "CUSTOM_SECRET",
            re.compile(r"\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\b"),
            0.85,
        ),
        # Generic high-entropy secret (looks like API key: 32–64 hex chars)
        (
            "CUSTOM_SECRET",
            re.compile(r"\b[0-9a-f]{32,64}\b"),
            0.5,  # lower score — may be false positive
        ),
        # Stripe secret key
        (
            "CUSTOM_SECRET",
            re.compile(r"\bsk_(?:live|test)_[A-Za-z0-9]{24,}\b"),
            0.95,
        ),
        # Twilio Account SID / Auth Token
        (
            "CUSTOM_SECRET",
            re.compile(r"\bAC[0-9a-f]{32}\b"),
            0.9,
        ),
        # Heroku API key
        (
            "CUSTOM_SECRET",
            re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b"),
            0.4,  # UUIDs are common; low score
        ),
        # npm token
        (
            "CUSTOM_SECRET",
            re.compile(r"\bnpm_[A-Za-z0-9]{36}\b"),
            0.95,
        ),
    ]

    @property
    def name(self) -> str:
        return "secrets_detector"

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
