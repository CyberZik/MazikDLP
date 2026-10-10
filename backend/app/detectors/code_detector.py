"""
MazikDLP - Source Code Detector
Detects Python, JavaScript, SQL, Java, and Shell code patterns.
"""

import re
from app.detectors.base import BaseDetector, DetectionResult


class CodeDetector(BaseDetector):
    """
    Regex-based detector for source code snippets.
    Identifies code by structure/keywords, not by syntax tree.
    """

    # Each tuple: (entity_type, compiled_regex, score, min_match_length)
    PATTERNS = [
        # Python
        (
            "SOURCE_CODE",
            re.compile(
                r"(?:def\s+\w+\s*\([^)]*\)\s*:|"
                r"class\s+\w+[\s(:]|"
                r"import\s+\w+|"
                r"from\s+\w[\w.]*\s+import\s+\w+|"
                r"if\s+__name__\s*==\s*['\"]__main__['\"]|"
                r"print\s*\([^)]*\)|"
                r"@\w+(?:\.\w+)?\s*\n)",
                re.MULTILINE,
            ),
            0.75,
        ),
        # JavaScript / TypeScript
        (
            "SOURCE_CODE",
            re.compile(
                r"(?:function\s+\w+\s*\(|"
                r"(?:const|let|var)\s+\w+\s*=\s*(?:function|\([^)]*\)\s*=>)|"
                r"=>\s*\{|"
                r"(?:import|export)\s+(?:default\s+)?\{?\w+|"
                r"(?:class|interface)\s+\w+\s*(?:extends|implements|{)|"
                r"console\.(?:log|error|warn)\s*\()",
                re.MULTILINE,
            ),
            0.75,
        ),
        # SQL
        (
            "SOURCE_CODE",
            re.compile(
                r"(?i)(?:\bSELECT\b.{5,}\bFROM\b|"
                r"\bINSERT\s+INTO\b|"
                r"\bUPDATE\b.{3,}\bSET\b|"
                r"\bDELETE\s+FROM\b|"
                r"\bCREATE\s+(?:TABLE|DATABASE|INDEX|VIEW)\b|"
                r"\bDROP\s+(?:TABLE|DATABASE)\b|"
                r"\bALTER\s+TABLE\b)",
                re.MULTILINE,
            ),
            0.8,
        ),
        # Java
        (
            "SOURCE_CODE",
            re.compile(
                r"(?:(?:public|private|protected|static|final|abstract)\s+(?:class|interface|void|int|String|boolean)\s+\w+|"
                r"System\.out\.(?:println|print)\s*\(|"
                r"new\s+[A-Z]\w*\s*\(|"
                r"@Override\s*\n|"
                r"throws\s+\w+Exception)",
                re.MULTILINE,
            ),
            0.75,
        ),
        # Shell / Bash
        (
            "SOURCE_CODE",
            re.compile(
                r"(?:#!/(?:bin|usr/bin)/(?:bash|sh|python|perl)|"
                r"sudo\s+\w+|"
                r"chmod\s+[0-7]{3,4}\s+|"
                r"grep\s+-[a-zA-Z]+\s+|"
                r"awk\s+'[^']*'|"
                r"sed\s+-[einE]+\s+)",
                re.MULTILINE,
            ),
            0.75,
        ),
    ]

    @property
    def name(self) -> str:
        return "code_detector"

    def detect(self, text: str) -> list[DetectionResult]:
        results = []
        for entity_type, pattern, score in self.PATTERNS:
            for match in pattern.finditer(text):
                if len(match.group().strip()) >= 5:  # ignore very short matches
                    results.append(DetectionResult(
                        entity_type=entity_type,
                        start=match.start(),
                        end=match.end(),
                        score=score,
                        text=match.group(),
                        detector=self.name,
                    ))
        return results
