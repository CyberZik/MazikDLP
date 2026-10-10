#!/usr/bin/env python3
"""
Add extra demo users, AI apps, and policies to a MazikDLP demo org.

Usage:
    python scripts/seed_extra_demo.py --email admin@example.com --password password
"""

import argparse

import httpx


USERS = [
    {"email": "priya.finance@maziktest.com", "name": "Priya Sharma", "password": "DemoPass123!", "role": "manager", "department": "Finance", "team": "Accounts Payable"},
    {"email": "arjun.security@maziktest.com", "name": "Arjun Mehta", "password": "DemoPass123!", "role": "security_analyst", "department": "Security", "team": "SOC"},
    {"email": "neha.hr@maziktest.com", "name": "Neha Rao", "password": "DemoPass123!", "role": "manager", "department": "Human Resources", "team": "People Ops"},
    {"email": "kabir.engineering@maziktest.com", "name": "Kabir Khan", "password": "DemoPass123!", "role": "employee", "department": "Engineering", "team": "Platform"},
    {"email": "ananya.legal@maziktest.com", "name": "Ananya Iyer", "password": "DemoPass123!", "role": "manager", "department": "Legal", "team": "Contracts"},
    {"email": "rohan.sales@maziktest.com", "name": "Rohan Gupta", "password": "DemoPass123!", "role": "employee", "department": "Sales", "team": "Enterprise"},
    {"email": "meera.support@maziktest.com", "name": "Meera Nair", "password": "DemoPass123!", "role": "employee", "department": "Support", "team": "Customer Success"},
    {"email": "vikram.data@maziktest.com", "name": "Vikram Singh", "password": "DemoPass123!", "role": "security_analyst", "department": "Data", "team": "Governance"},
]

APPS = [
    {"name": "Notion AI", "vendor": "Notion", "website": "https://notion.so", "status": "restricted", "risk_level": "medium", "security_score": 69, "models": ["notion-ai"], "compliance": ["SOC2", "GDPR"]},
    {"name": "GitHub Copilot", "vendor": "GitHub", "website": "https://github.com/features/copilot", "status": "whitelisted", "risk_level": "medium", "security_score": 82, "models": ["copilot", "gpt-4o-copilot"], "compliance": ["SOC2", "ISO27001"]},
    {"name": "Cursor", "vendor": "Anysphere", "website": "https://cursor.com", "status": "restricted", "risk_level": "medium", "security_score": 67, "models": ["claude-sonnet", "gpt-4.1"], "compliance": ["SOC2"]},
    {"name": "Midjourney", "vendor": "Midjourney", "website": "https://midjourney.com", "status": "restricted", "risk_level": "high", "security_score": 49, "models": ["v6", "niji"], "compliance": []},
    {"name": "Runway", "vendor": "Runway AI", "website": "https://runwayml.com", "status": "restricted", "risk_level": "high", "security_score": 52, "models": ["gen-3", "gen-4"], "compliance": ["SOC2"]},
    {"name": "Character.AI", "vendor": "Character Technologies", "website": "https://character.ai", "status": "blocked", "risk_level": "critical", "security_score": 28, "models": ["c.ai-chat"], "compliance": []},
    {"name": "Jasper", "vendor": "Jasper AI", "website": "https://jasper.ai", "status": "whitelisted", "risk_level": "low", "security_score": 86, "models": ["jasper-brand-voice"], "compliance": ["SOC2", "GDPR"]},
    {"name": "Zapier AI", "vendor": "Zapier", "website": "https://zapier.com/ai", "status": "whitelisted", "risk_level": "medium", "security_score": 80, "models": ["zapier-agents"], "compliance": ["SOC2", "GDPR"]},
]

POLICIES = [
    {"name": "Source Code to Public AI - Soft Block", "description": "Warns engineers before sending proprietary source code to consumer AI tools. Overrides are logged for review.", "category": "Code Security", "protection_level": "high", "action": "soft_block", "data_types": ["SOURCE_CODE"], "user_groups": ["Engineering", "Data"], "ai_platforms": ["ChatGPT", "Claude AI", "Gemini", "Cursor", "GitHub Copilot"], "priority": 6, "status": "active"},
    {"name": "Database Schemas - Hard Block", "description": "Blocks CREATE TABLE statements, database dumps, and schema snippets from leaving controlled environments.", "category": "Data Classification", "protection_level": "critical", "action": "hard_block", "data_types": ["DATABASE_SCHEMA", "SOURCE_CODE"], "user_groups": ["Engineering", "Data"], "ai_platforms": ["ChatGPT", "Claude AI", "Gemini", "Cursor"], "priority": 2, "status": "active"},
    {"name": "Customer Support Tickets - Auto Mask", "description": "Masks customer emails and phone numbers before support teams use AI for ticket summaries.", "category": "PII Protection", "protection_level": "high", "action": "mask", "data_types": ["EMAIL_ADDRESS", "PHONE_NUMBER", "IN_PHONE_NUMBER"], "user_groups": ["Support", "Sales"], "ai_platforms": ["ChatGPT", "Claude AI", "Jasper", "Zapier AI"], "priority": 4, "status": "active"},
    {"name": "HR Records - Hard Block", "description": "Blocks employee identifiers, personal contact details, and payroll-style data in HR workflows.", "category": "Regulatory Compliance", "protection_level": "critical", "action": "hard_block", "data_types": ["EMPLOYEE_ID", "EMAIL_ADDRESS", "IN_PAN", "IN_AADHAAR"], "user_groups": ["Human Resources"], "ai_platforms": ["ChatGPT", "Claude AI", "Gemini", "Notion AI"], "priority": 1, "status": "active"},
    {"name": "Legal Contracts - Alert", "description": "Allows contract drafting help but alerts on confidential project codes or client identifiers.", "category": "Data Classification", "protection_level": "medium", "action": "alert", "data_types": ["PROJECT_CODE", "EMAIL_ADDRESS"], "user_groups": ["Legal", "Sales"], "ai_platforms": ["ChatGPT", "Claude AI", "Microsoft Copilot", "Notion AI"], "priority": 7, "status": "active"},
    {"name": "Credential Exposure - Hard Block", "description": "Prevents API keys, passwords, private keys, and access tokens from being pasted into AI applications.", "category": "Credential Safety", "protection_level": "critical", "action": "hard_block", "data_types": ["CREDENTIAL", "CUSTOM_SECRET", "AWS_ACCESS_KEY", "GENERIC_API_KEY", "GENERIC_SECRET"], "user_groups": ["all"], "ai_platforms": ["ChatGPT", "Claude AI", "Gemini", "Cursor", "GitHub Copilot", "DeepSeek"], "priority": 1, "status": "active"},
    {"name": "Blocked Consumer AI Apps - Hard Block", "description": "Blocks sensitive data going to apps with insufficient enterprise controls.", "category": "AI Governance", "protection_level": "critical", "action": "hard_block", "data_types": ["EMAIL_ADDRESS", "PHONE_NUMBER", "IN_PAN", "IN_AADHAAR", "SOURCE_CODE"], "user_groups": ["all"], "ai_platforms": ["DeepSeek", "Perplexity AI", "Character.AI"], "priority": 2, "status": "active"},
    {"name": "Marketing Content - Allow", "description": "Allows low-risk marketing and public content generation on approved AI tools.", "category": "General", "protection_level": "low", "action": "allow", "data_types": [], "user_groups": ["Marketing", "Sales"], "ai_platforms": ["Jasper", "ChatGPT", "Microsoft Copilot"], "priority": 50, "status": "active"},
]


def create_missing(client, url, headers, items, key, label):
    existing = client.get(url, headers=headers).json()
    if isinstance(existing, dict):
        existing = existing.get("data", [])
    existing_values = {item[key] for item in existing}
    created = 0
    for item in items:
        if item[key] in existing_values:
            print(f"skip {label}: {item[key]}")
            continue
        response = client.post(url, json=item, headers=headers)
        print(f"{label}: {item[key]} -> HTTP {response.status_code}")
        response.raise_for_status()
        created += 1
    return created


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()

    base = args.base_url.rstrip("/") + "/api/v1"
    with httpx.Client(timeout=20) as client:
        login = client.post(f"{base}/auth/login", json={"email": args.email, "password": args.password})
        login.raise_for_status()
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        users_created = create_missing(client, f"{base}/users?per_page=100", headers, USERS, "email", "user")
        apps_created = create_missing(client, f"{base}/ai-apps", headers, APPS, "name", "app")
        policies_created = create_missing(client, f"{base}/policies", headers, POLICIES, "name", "policy")

        users_total = client.get(f"{base}/users?per_page=100", headers=headers).json()["meta"]["total"]
        apps_total = len(client.get(f"{base}/ai-apps", headers=headers).json())
        policies_total = len(client.get(f"{base}/policies", headers=headers).json())

    print("\nDone")
    print(f"Created users={users_created}, apps={apps_created}, policies={policies_created}")
    print(f"Totals users={users_total}, apps={apps_total}, policies={policies_total}")


if __name__ == "__main__":
    main()
