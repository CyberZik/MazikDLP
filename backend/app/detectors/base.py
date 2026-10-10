"""
MazikDLP - Base Detector Interface
All detectors implement this interface.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class DetectionResult:
    """Represents a single detected entity in text."""
    entity_type: str       # e.g. "EMAIL_ADDRESS", "IN_PAN"
    start: int             # character offset start
    end: int               # character offset end (exclusive)
    score: float           # confidence 0.0–1.0
    text: str              # the matched text
    detector: str          # which detector found it

    def __repr__(self) -> str:
        return f"<{self.entity_type} [{self.start}:{self.end}] score={self.score:.2f} text={self.text!r}>"


class BaseDetector(ABC):
    """Abstract base class for all MazikDLP detectors."""

    @abstractmethod
    def detect(self, text: str) -> list[DetectionResult]:
        """
        Scan text for sensitive entities.
        Returns a list of DetectionResult objects.
        """
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable detector name."""
        ...
