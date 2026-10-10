"""
Unit tests for detection pipeline (no DB/Redis required).
"""

import pytest
from app.detectors.credential_detector import CredentialDetector
from app.detectors.secrets_detector import SecretsDetector
from app.detectors.code_detector import CodeDetector
from app.detectors.indian_pii import IndianPIIDetector
from app.detectors.db_schema_detector import DBSchemaDetector


def test_credential_detector_password():
    detector = CredentialDetector()
    results = detector.detect("password=SuperSecret123")
    assert any(r.entity_type == "CREDENTIAL" for r in results)


def test_credential_detector_connection_string():
    detector = CredentialDetector()
    results = detector.detect("mongodb://user:pass@localhost:27017/mydb")
    assert any(r.entity_type == "CREDENTIAL" for r in results)


def test_secrets_detector_aws_key():
    detector = SecretsDetector()
    results = detector.detect("AKIAIOSFODNN7EXAMPLE")
    assert any(r.entity_type == "CUSTOM_SECRET" for r in results)


def test_secrets_detector_github_token():
    detector = SecretsDetector()
    results = detector.detect("ghp_ABCDEFghijklmnopqrstuvwxyz123456")
    assert any(r.entity_type == "CUSTOM_SECRET" for r in results)


def test_secrets_detector_private_key():
    detector = SecretsDetector()
    results = detector.detect("-----BEGIN RSA PRIVATE KEY-----")
    assert any(r.entity_type == "CUSTOM_SECRET" for r in results)


def test_code_detector_python():
    detector = CodeDetector()
    results = detector.detect("def calculate_sum(a, b):\n    return a + b")
    assert any(r.entity_type == "SOURCE_CODE" for r in results)


def test_code_detector_sql():
    detector = CodeDetector()
    results = detector.detect("SELECT * FROM users WHERE id = 1")
    assert any(r.entity_type == "SOURCE_CODE" for r in results)


def test_indian_pan():
    detector = IndianPIIDetector()
    results = detector.detect("My PAN is ABCDE1234F")
    assert any(r.entity_type == "IN_PAN" for r in results)


def test_indian_aadhaar():
    detector = IndianPIIDetector()
    results = detector.detect("Aadhaar: 2345 6789 0123")
    assert any(r.entity_type == "IN_AADHAAR" for r in results)


def test_indian_gstin():
    detector = IndianPIIDetector()
    results = detector.detect("GSTIN: 29ABCDE1234F1Z5")
    assert any(r.entity_type == "IN_GSTIN" for r in results)


def test_db_schema_create_table():
    detector = DBSchemaDetector()
    results = detector.detect("CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));")
    assert any(r.entity_type == "SOURCE_CODE" for r in results)


def test_no_false_positives_empty():
    detector = CredentialDetector()
    results = detector.detect("")
    assert results == []


def test_no_false_positives_clean_text():
    detector = SecretsDetector()
    results = detector.detect("Hello, how are you today? I am fine thank you.")
    # May have some low-confidence matches for hex strings, but no high-confidence ones
    high_conf = [r for r in results if r.score >= 0.8]
    assert high_conf == []


# ── New Indian PII pattern tests ──────────────────────────────────────────────

def test_indian_passport():
    detector = IndianPIIDetector()
    results = detector.detect("Passport number: A1234567")
    assert any(r.entity_type == "IN_PASSPORT" for r in results)


def test_indian_voter_id():
    detector = IndianPIIDetector()
    results = detector.detect("Voter ID: ABC1234567")
    assert any(r.entity_type == "IN_VOTER_ID" for r in results)


def test_indian_driving_license():
    detector = IndianPIIDetector()
    results = detector.detect("DL: MH-12-2024-0001234")
    assert any(r.entity_type == "IN_DRIVING_LICENSE" for r in results)


def test_indian_upi_id():
    detector = IndianPIIDetector()
    results = detector.detect("Pay me at user.name@okaxis")
    assert any(r.entity_type == "IN_UPI_ID" for r in results)


def test_indian_vehicle_reg():
    detector = IndianPIIDetector()
    results = detector.detect("Vehicle: MH-01-AB-1234")
    assert any(r.entity_type == "IN_VEHICLE_REG" for r in results)


def test_indian_cin():
    detector = IndianPIIDetector()
    results = detector.detect("CIN: L21091KA2019PLC123456")
    assert any(r.entity_type == "IN_CIN" for r in results)


def test_indian_ifsc():
    detector = IndianPIIDetector()
    results = detector.detect("IFSC: HDFC0001234")
    assert any(r.entity_type == "IN_IFSC" for r in results)


def test_indian_phone():
    detector = IndianPIIDetector()
    results = detector.detect("Call me at +91 98765 43210")
    assert any(r.entity_type == "IN_PHONE_NUMBER" for r in results)
