"""
MazikDLP - Database Schema Detector
Detects SQL DDL statements and schema references.
"""

import re
from app.detectors.base import BaseDetector, DetectionResult


class DBSchemaDetector(BaseDetector):
    """
    Detects database schema definitions (DDL):
    CREATE TABLE, ALTER TABLE, column definitions, etc.
    """

    PATTERNS = [
        # CREATE TABLE
        (
            "SOURCE_CODE",
            re.compile(
                r"(?i)\bCREATE\s+(?:TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"
                r"\w+[\w.`\"]*\s*\(",
                re.MULTILINE,
            ),
            0.9,
        ),
        # ALTER TABLE
        (
            "SOURCE_CODE",
            re.compile(
                r"(?i)\bALTER\s+TABLE\s+\w+[\w.`\"]*\s+(?:ADD|DROP|MODIFY|RENAME|ALTER)\b",
                re.MULTILINE,
            ),
            0.85,
        ),
        # DROP TABLE / DATABASE
        (
            "SOURCE_CODE",
            re.compile(
                r"(?i)\bDROP\s+(?:TABLE|DATABASE|SCHEMA)\s+(?:IF\s+EXISTS\s+)?\w+",
                re.MULTILINE,
            ),
            0.85,
        ),
        # CREATE INDEX
        (
            "SOURCE_CODE",
            re.compile(
                r"(?i)\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+\w+\s+ON\s+\w+",
                re.MULTILINE,
            ),
            0.8,
        ),
        # Column definitions with data types
        (
            "SOURCE_CODE",
            re.compile(
                r"(?i)\b\w+\s+(?:INT|INTEGER|BIGINT|SMALLINT|VARCHAR|TEXT|BOOLEAN|BOOL|"
                r"FLOAT|DOUBLE|DECIMAL|NUMERIC|DATE|TIMESTAMP|DATETIME|UUID|JSONB|JSON|BLOB|BYTEA)"
                r"(?:\s*\([^)]+\))?\s*(?:NOT\s+NULL|PRIMARY\s+KEY|UNIQUE|DEFAULT|REFERENCES)?",
                re.MULTILINE,
            ),
            0.6,
        ),
    ]

    @property
    def name(self) -> str:
        return "db_schema_detector"

    def detect(self, text: str) -> list[DetectionResult]:
        results = []
        for entity_type, pattern, score in self.PATTERNS:
            for match in pattern.finditer(text):
                if len(match.group().strip()) >= 10:
                    results.append(DetectionResult(
                        entity_type=entity_type,
                        start=match.start(),
                        end=match.end(),
                        score=score,
                        text=match.group(),
                        detector=self.name,
                    ))
        return results
