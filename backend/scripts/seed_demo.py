#!/usr/bin/env python3
"""
MazikDLP Demo Seed Script
Populates the platform with realistic demo data for the mid-semester evaluation.

Usage:
    python seed_demo.py --email admin@example.com --password yourpassword
    python seed_demo.py --email admin@example.com --password yourpassword --base-url http://localhost:8000

Requirements:
    pip install httpx
"""

import argparse
import sys
import httpx

# ── CLI args ──────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description="Seed MazikDLP with demo data")
parser.add_argument("--email", required=True, help="Admin account email")
parser.add_argument("--password", required=True, help="Admin account password")
parser.add_argument("--base-url", default="http://localhost:8000", help="Backend base URL")
args = parser.parse_args()

BASE = args.base_url.rstrip("/") + "/api/v1"

# ── Helpers ───────────────────────────────────────────────────────────────────

def ok(label, resp):
    if resp.status_code in (200, 201):
        print(f"  ✓  {label}")
        return resp.json()
    else:
        print(f"  ✗  {label} — HTTP {resp.status_code}: {resp.text[:120]}")
        return None

def skip(label, reason="already exists"):
    print(f"  ↷  {label} ({reason})")

# ── Auth ──────────────────────────────────────────────────────────────────────

print("\n── Authenticating ─────────────────────────────────────────────────────")
with httpx.Client(timeout=15) as client:
    resp = client.post(f"{BASE}/auth/login", json={"email": args.email, "password": args.password})

if resp.status_code != 200:
    print(f"Login failed: {resp.status_code} {resp.text}")
    sys.exit(1)

token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"  ✓  Logged in as {args.email}")

# ── AI Apps ───────────────────────────────────────────────────────────────────

print("\n── AI Applications ────────────────────────────────────────────────────")

AI_APPS = [
    {
        "name": "ChatGPT",
        "vendor": "OpenAI",
        "website": "https://chat.openai.com",
        "status": "whitelisted",
        "risk_level": "medium",
        "security_score": 78,
        "models": ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
        "compliance": ["SOC2", "GDPR"],
    },
    {
        "name": "Claude AI",
        "vendor": "Anthropic",
        "website": "https://claude.ai",
        "status": "whitelisted",
        "risk_level": "low",
        "security_score": 88,
        "models": ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
        "compliance": ["SOC2", "GDPR", "HIPAA"],
    },
    {
        "name": "Gemini",
        "vendor": "Google",
        "website": "https://gemini.google.com",
        "status": "restricted",
        "risk_level": "medium",
        "security_score": 72,
        "models": ["gemini-2.0-flash", "gemini-1.5-pro"],
        "compliance": ["SOC2", "GDPR", "ISO27001"],
    },
    {
        "name": "Microsoft Copilot",
        "vendor": "Microsoft",
        "website": "https://copilot.microsoft.com",
        "status": "whitelisted",
        "risk_level": "low",
        "security_score": 91,
        "models": ["gpt-4o"],
        "compliance": ["SOC2", "GDPR", "HIPAA", "ISO27001"],
    },
    {
        "name": "DeepSeek",
        "vendor": "DeepSeek AI",
        "website": "https://chat.deepseek.com",
        "status": "blocked",
        "risk_level": "high",
        "security_score": 31,
        "models": ["deepseek-r1", "deepseek-v3"],
        "compliance": [],
    },
    {
        "name": "Perplexity AI",
        "vendor": "Perplexity",
        "website": "https://perplexity.ai",
        "status": "blocked",
        "risk_level": "high",
        "security_score": 44,
        "models": ["sonar-pro", "sonar"],
        "compliance": ["SOC2"],
    },
    {
        "name": "Grok",
        "vendor": "xAI",
        "website": "https://grok.com",
        "status": "restricted",
        "risk_level": "medium",
        "security_score": 55,
        "models": ["grok-2"],
        "compliance": [],
    },
]

with httpx.Client(timeout=15) as client:
    # Fetch existing apps to avoid duplicates
    existing_resp = client.get(f"{BASE}/ai-apps", headers=headers)
    existing_names = {a["name"] for a in (existing_resp.json() if existing_resp.status_code == 200 else [])}

    for app in AI_APPS:
        if app["name"] in existing_names:
            skip(app["name"])
        else:
            resp = client.post(f"{BASE}/ai-apps", json=app, headers=headers)
            ok(app["name"], resp)

# ── Policies ──────────────────────────────────────────────────────────────────

print("\n── Policies ───────────────────────────────────────────────────────────")

POLICIES = [
    {
        "name": "Financial Data — Hard Block",
        "description": "Blocks prompts containing PAN, Aadhaar, or credit card numbers. Zero tolerance for financial PII leakage.",
        "category": "Financial",
        "protection_level": "critical",
        "action": "hard_block",
        "data_types": ["IN_PAN", "IN_AADHAAR", "CREDIT_CARD", "IBAN_CODE", "US_SSN"],
        "ai_platforms": ["ChatGPT", "Claude AI", "Gemini", "Grok", "Perplexity AI", "Microsoft Copilot", "DeepSeek"],
        "priority": 1,
        "status": "active",
    },
    {
        "name": "Email Address — Soft Block",
        "description": "Warns users before submitting email addresses to AI tools. User can override with justification logged.",
        "category": "Communication",
        "protection_level": "high",
        "action": "soft_block",
        "data_types": ["EMAIL_ADDRESS"],
        "ai_platforms": ["ChatGPT", "Claude AI", "Gemini", "Grok", "Perplexity AI", "Microsoft Copilot"],
        "priority": 2,
        "status": "active",
    },
    {
        "name": "Phone Numbers — Auto Mask",
        "description": "Automatically replaces phone numbers with placeholder tokens before sending to AI. Restores originals in the AI's response.",
        "category": "Personal",
        "protection_level": "high",
        "action": "mask",
        "data_types": ["PHONE_NUMBER", "IN_PHONE_NUMBER"],
        "ai_platforms": ["ChatGPT", "Claude AI", "Gemini", "Microsoft Copilot"],
        "priority": 3,
        "status": "active",
    },
    {
        "name": "API Keys & Secrets — Alert",
        "description": "Detects and logs API keys, access tokens, and passwords. Allows submission but creates a high-severity audit event.",
        "category": "Technical",
        "protection_level": "medium",
        "action": "alert",
        "data_types": ["AWS_ACCESS_KEY", "GENERIC_API_KEY", "GENERIC_SECRET"],
        "ai_platforms": ["ChatGPT", "Claude AI", "Gemini", "Grok", "Microsoft Copilot"],
        "priority": 4,
        "status": "active",
    },
    {
        "name": "Medical Records — Hard Block",
        "description": "Strict HIPAA-aligned block for any medical or health-related PII in AI prompts.",
        "category": "Healthcare",
        "protection_level": "critical",
        "action": "hard_block",
        "data_types": ["MEDICAL_LICENSE", "US_HEALTHCARE_NPI"],
        "ai_platforms": ["ChatGPT", "Claude AI", "Gemini", "Grok", "Perplexity AI", "DeepSeek"],
        "priority": 5,
        "status": "active",
    },
    {
        "name": "Unrestricted AI Apps — Allow",
        "description": "Default allow policy for whitelisted platforms with no detected PII.",
        "category": "General",
        "protection_level": "low",
        "action": "allow",
        "data_types": [],
        "ai_platforms": ["ChatGPT", "Claude AI", "Microsoft Copilot"],
        "priority": 10,
        "status": "active",
    },
]

with httpx.Client(timeout=15) as client:
    existing_resp = client.get(f"{BASE}/policies", headers=headers)
    existing_names = {p["name"] for p in (existing_resp.json() if existing_resp.status_code == 200 else [])}

    for policy in POLICIES:
        if policy["name"] in existing_names:
            skip(policy["name"])
        else:
            resp = client.post(f"{BASE}/policies", json=policy, headers=headers)
            ok(policy["name"], resp)

# ── Custom Patterns ───────────────────────────────────────────────────────────

print("\n── Custom Patterns ────────────────────────────────────────────────────")

PATTERNS = [
    {
        "name": "MazikCorp Employee ID",
        "description": "Detects internal employee IDs in the format EMP-XXXXX. Used to prevent employee directory enumeration.",
        "entity_type": "EMPLOYEE_ID",
        "pattern_type": "regex",
        "pattern": r"EMP-\d{5}",
        "sensitivity": "medium",
        "action": "alert",
        "category": "Internal",
        "examples_positive": ["EMP-10042", "EMP-99871", "My ID is EMP-55310"],
        "examples_negative": ["EMPLOYEE-1234", "EMP-123", "EMP1234"],
        "is_enabled": True,
    },
    {
        "name": "Project Code — Confidential",
        "description": "Detects internal project codenames in the format PRJ-XXXX-YY. Prevents leakage of unreleased project names.",
        "entity_type": "PROJECT_CODE",
        "pattern_type": "regex",
        "pattern": r"PRJ-[A-Z]{4}-\d{2}",
        "sensitivity": "high",
        "action": "alert",
        "category": "Internal",
        "examples_positive": ["PRJ-NOVA-24", "Working on PRJ-ZEUS-25"],
        "examples_negative": ["PROJECT-NOVA", "PRJ-24", "PROJ-NOVA-24"],
        "is_enabled": True,
    },
]

with httpx.Client(timeout=15) as client:
    existing_resp = client.get(f"{BASE}/patterns", headers=headers)
    existing_names = {p["name"] for p in (existing_resp.json() if existing_resp.status_code == 200 else [])}

    for pattern in PATTERNS:
        if pattern["name"] in existing_names:
            skip(pattern["name"])
        else:
            resp = client.post(f"{BASE}/patterns", json=pattern, headers=headers)
            ok(pattern["name"], resp)

# ── Done ──────────────────────────────────────────────────────────────────────

print("\n── Done ───────────────────────────────────────────────────────────────")
print("  Platform is ready for the demo.")
print("  Reload the MazikDLP admin dashboard to see the seeded data.\n")
