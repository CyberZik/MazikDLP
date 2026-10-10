"""
MazikDLP - Indian PII Recognizers
Custom Presidio recognizers for Indian identifiers: PAN, Aadhaar, GSTIN, IFSC.
"""

from presidio_analyzer import Pattern, PatternRecognizer

from app.detectors.base import BaseDetector, DetectionResult
from app.detectors.presidio_engine import add_recognizer


# ── Individual Presidio recognizers ───────────────────────────────────────────

class IndianPANRecognizer(PatternRecognizer):
    """
    PAN (Permanent Account Number): ABCDE1234F
    Format: 5 uppercase letters + 4 digits + 1 uppercase letter
    """
    PATTERNS = [
        Pattern(
            name="PAN_PATTERN",
            regex=r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b",
            score=0.85,
        )
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_PAN",
            patterns=self.PATTERNS,
            context=["pan", "permanent account", "income tax", "pan card"],
        )


class IndianAadhaarRecognizer(PatternRecognizer):
    """
    Aadhaar: 1234 5678 9012
    Format: 12 digits in groups of 4 (first digit 2-9)
    """
    PATTERNS = [
        Pattern(
            name="AADHAAR_PATTERN",
            regex=r"\b[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}\b",
            score=0.85,
        ),
        Pattern(
            name="AADHAAR_NODASH_PATTERN",
            regex=r"\b[2-9]{1}[0-9]{11}\b",
            score=0.6,
        ),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_AADHAAR",
            patterns=self.PATTERNS,
            context=["aadhaar", "aadhar", "uid", "uidai"],
        )


class IndianGSTINRecognizer(PatternRecognizer):
    """
    GSTIN: 29ABCDE1234F1Z5
    Format: 2-digit state code + 10-char PAN + 1 entity number + Z + 1 checksum
    """
    PATTERNS = [
        Pattern(
            name="GSTIN_PATTERN",
            regex=r"\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b",
            score=0.9,
        )
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_GSTIN",
            patterns=self.PATTERNS,
            context=["gstin", "gst", "goods and services tax"],
        )


class IndianIFSCRecognizer(PatternRecognizer):
    """
    IFSC (Indian Financial System Code): HDFC0001234
    Format: 4 uppercase letters + 0 + 6 alphanumeric characters
    """
    PATTERNS = [
        Pattern(
            name="IFSC_PATTERN",
            regex=r"\b[A-Z]{4}0[A-Z0-9]{6}\b",
            score=0.8,
        )
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_IFSC",
            patterns=self.PATTERNS,
            context=["ifsc", "bank", "neft", "rtgs", "imps"],
        )


class IndianPhoneRecognizer(PatternRecognizer):
    """
    Indian mobile numbers:
      - International: +91 98765 43210 / +91-9876543210
      - Local 10-digit: 9876543210 / 98765 43210 (starts with 6-9)
    """
    PATTERNS = [
        Pattern(name="IN_PHONE_INTL", regex=r"\+91[\s\-]?[6-9]\d{4}[\s\-]?\d{5}\b", score=0.85),
        Pattern(name="IN_PHONE_LOCAL", regex=r"\b[6-9]\d{4}[\s\-]?\d{5}\b", score=0.75),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_PHONE_NUMBER",
            patterns=self.PATTERNS,
            context=["phone", "mobile", "call", "contact", "number", "mob", "tel"],
        )


class IndianPassportRecognizer(PatternRecognizer):
    """Indian Passport: A1234567 — 1 uppercase letter + 7 digits."""
    PATTERNS = [
        Pattern(name="IN_PASSPORT", regex=r"\b[A-Z][0-9]{7}\b", score=0.7),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_PASSPORT",
            patterns=self.PATTERNS,
            context=["passport", "travel document", "passport number", "passport no"],
        )


class IndianVoterIDRecognizer(PatternRecognizer):
    """Voter ID / EPIC: ABC1234567 — 3 uppercase letters + 7 digits."""
    PATTERNS = [
        Pattern(name="IN_VOTER_ID", regex=r"\b[A-Z]{3}[0-9]{7}\b", score=0.75),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_VOTER_ID",
            patterns=self.PATTERNS,
            context=["voter", "epic", "voter id", "election", "voter card"],
        )


class IndianDrivingLicenseRecognizer(PatternRecognizer):
    """Driving License: MH-12-2024-0001234 — State(2) + RTO(2) + Year(4) + Serial(7)."""
    PATTERNS = [
        Pattern(name="IN_DL", regex=r"\b[A-Z]{2}[ -]?\d{2}[ -]?\d{4}[ -]?\d{7}\b", score=0.8),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_DRIVING_LICENSE",
            patterns=self.PATTERNS,
            context=["driving license", "driving licence", "dl", "driver license", "dl no"],
        )


class IndianUPIRecognizer(PatternRecognizer):
    """UPI ID / VPA: user@upi or name@okaxis etc."""
    PATTERNS = [
        Pattern(name="IN_UPI", regex=r"\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b", score=0.6),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_UPI_ID",
            patterns=self.PATTERNS,
            context=["upi", "vpa", "upi id", "pay", "gpay", "phonepe", "paytm", "bhim"],
        )


class IndianPINCodeRecognizer(PatternRecognizer):
    """Indian PIN Code: 6 digits starting with 1-9."""
    PATTERNS = [
        Pattern(name="IN_PIN_CODE", regex=r"\b[1-9][0-9]{5}\b", score=0.4),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_PIN_CODE",
            patterns=self.PATTERNS,
            context=["pin code", "pincode", "postal code", "zip", "pin"],
        )


class IndianVehicleRegRecognizer(PatternRecognizer):
    """Vehicle Registration: MH-01-AB-1234."""
    PATTERNS = [
        Pattern(name="IN_VEHICLE_REG", regex=r"\b[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{1,3}[ -]?\d{4}\b", score=0.75),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_VEHICLE_REG",
            patterns=self.PATTERNS,
            context=["vehicle", "registration", "car number", "plate", "rto", "rc"],
        )


class IndianUANRecognizer(PatternRecognizer):
    """UAN (EPFO Universal Account Number): 12 digits."""
    PATTERNS = [
        Pattern(name="IN_UAN", regex=r"\b\d{12}\b", score=0.4),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_UAN",
            patterns=self.PATTERNS,
            context=["uan", "epfo", "provident fund", "pf", "epf", "universal account"],
        )


class IndianPRANRecognizer(PatternRecognizer):
    """PRAN (NPS Permanent Retirement Account Number): 12 digits."""
    PATTERNS = [
        Pattern(name="IN_PRAN", regex=r"\b\d{12}\b", score=0.4),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_PRAN",
            patterns=self.PATTERNS,
            context=["pran", "nps", "pension", "retirement", "national pension"],
        )


class IndianCINRecognizer(PatternRecognizer):
    """CIN (Corporate Identity Number): L/U + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits."""
    PATTERNS = [
        Pattern(name="IN_CIN", regex=r"\b[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b", score=0.9),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_CIN",
            patterns=self.PATTERNS,
            context=["cin", "corporate identity", "company id", "mca", "roc"],
        )


class IndianBankAccountRecognizer(PatternRecognizer):
    """Indian Bank Account Number: 9 to 18 digits (very generic — needs context)."""
    PATTERNS = [
        Pattern(name="IN_BANK_ACCOUNT", regex=r"\b\d{9,18}\b", score=0.3),
    ]

    def __init__(self):
        super().__init__(
            supported_entity="IN_BANK_ACCOUNT",
            patterns=self.PATTERNS,
            context=["bank account", "account number", "a/c", "savings", "current account", "account no"],
        )


# ── Register all Indian recognizers ───────────────────────────────────────────

def register_indian_recognizers() -> None:
    """Register all Indian PII recognizers with the global Presidio AnalyzerEngine."""
    add_recognizer(IndianPANRecognizer())
    add_recognizer(IndianAadhaarRecognizer())
    add_recognizer(IndianGSTINRecognizer())
    add_recognizer(IndianIFSCRecognizer())
    add_recognizer(IndianPhoneRecognizer())
    add_recognizer(IndianPassportRecognizer())
    add_recognizer(IndianVoterIDRecognizer())
    add_recognizer(IndianDrivingLicenseRecognizer())
    add_recognizer(IndianUPIRecognizer())
    add_recognizer(IndianPINCodeRecognizer())
    add_recognizer(IndianVehicleRegRecognizer())
    add_recognizer(IndianUANRecognizer())
    add_recognizer(IndianPRANRecognizer())
    add_recognizer(IndianCINRecognizer())
    add_recognizer(IndianBankAccountRecognizer())


# ── Standalone detector (for use without Presidio) ────────────────────────────

class IndianPIIDetector(BaseDetector):
    """
    Standalone Indian PII detector using regex directly.
    Used when Presidio is not available.
    """

    PATTERNS = [
        ("IN_PAN", r"[A-Z]{5}[0-9]{4}[A-Z]{1}", 0.85),
        ("IN_AADHAAR", r"[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}", 0.85),
        ("IN_GSTIN", r"[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}", 0.9),
        ("IN_IFSC", r"[A-Z]{4}0[A-Z0-9]{6}", 0.8),
        ("IN_PHONE_NUMBER", r"\+91[\s\-]?[6-9]\d{4}[\s\-]?\d{5}", 0.85),
        ("IN_PHONE_NUMBER", r"[6-9]\d{4}[\s\-]?\d{5}", 0.75),
        ("IN_PASSPORT", r"[A-Z][0-9]{7}", 0.7),
        ("IN_VOTER_ID", r"[A-Z]{3}[0-9]{7}", 0.75),
        ("IN_DRIVING_LICENSE", r"[A-Z]{2}[ -]?\d{2}[ -]?\d{4}[ -]?\d{7}", 0.8),
        ("IN_UPI_ID", r"[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}", 0.6),
        ("IN_PIN_CODE", r"[1-9][0-9]{5}", 0.4),
        ("IN_VEHICLE_REG", r"[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{1,3}[ -]?\d{4}", 0.75),
        ("IN_UAN", r"\d{12}", 0.4),
        ("IN_PRAN", r"\d{12}", 0.4),
        ("IN_CIN", r"[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}", 0.9),
        ("IN_BANK_ACCOUNT", r"\d{9,18}", 0.3),
    ]

    def __init__(self):
        import re
        self._compiled = [
            (entity, re.compile(r"\b" + pattern + r"\b"), score)
            for entity, pattern, score in self.PATTERNS
        ]

    @property
    def name(self) -> str:
        return "indian_pii"

    def detect(self, text: str) -> list[DetectionResult]:
        results = []
        for entity_type, pattern, score in self._compiled:
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
