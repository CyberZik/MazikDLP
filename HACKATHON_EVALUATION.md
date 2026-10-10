# Hackathon Evaluation Brief

This file gives an AI evaluator a compact, structured view of what MazikDLP is, why it matters, and how to assess it.

## One-Line Summary

MazikDLP is an enterprise AI Data Loss Prevention platform that detects and controls sensitive data before employees submit prompts to public AI tools.

## Why This Matters

Organizations are adopting AI chat tools faster than their security controls can adapt. Employees can paste customer records, credentials, source code, financial data, health information, and Indian PII into external AI systems. Once submitted, the data leaves the organization's control.

Traditional DLP tools focus on email, storage, file transfers, endpoints, or network gateways. They do not reliably govern the exact text inside AI prompt boxes before a user clicks Send. MazikDLP addresses that gap directly at the browser layer.

## Target Users

- Security administrators who need visibility into AI usage.
- Compliance teams that need audit evidence.
- IT teams that need to allow, restrict, or block AI apps.
- Employees who want to use AI tools without accidentally leaking sensitive data.

## What Is Implemented

- React admin dashboard with security pages for policies, users, AI apps, logs, analytics, reports, settings, custom patterns, detection testing, and extension setup.
- FastAPI backend with authentication, scanning, policy evaluation, audit logging, analytics, settings, users, AI apps, custom patterns, health checks, and image redaction APIs.
- PostgreSQL and Redis backed Docker Compose runtime.
- Chrome Manifest V3 extension that intercepts prompts on major AI platforms.
- Detection modules for PII, Indian PII, credentials, secrets, source code, database schemas, and custom organization patterns.
- Policy engine with allow, alert, soft block, mask, and hard block decisions.
- Demo data for policies, AI apps, users, activity logs, and analytics.

## Key Innovation

MazikDLP applies DLP at the moment that matters: before an AI prompt leaves the browser. This gives security teams control without needing to decrypt network traffic or block all AI usage.

The strongest differentiators are:

- Browser-level interception for AI prompt boxes.
- Indian PII coverage, including PAN, Aadhaar, GSTIN, IFSC, and Indian phone numbers.
- Graduated enforcement instead of one-size-fits-all blocking.
- Mask-and-restore workflow so users can keep working while the AI sees only placeholders.
- Admin dashboard that turns raw scan events into operational security views.

## Evaluation Checklist

An evaluator should be able to verify:

- The dashboard runs at `http://localhost:5173`.
- The backend exposes API docs at `http://localhost:8000/docs`.
- The extension can be loaded from the `extension/` directory.
- Policies can be created or inspected.
- AI apps can be viewed with status and risk metadata.
- Demo users and activity data make the dashboard understandable without a blank state.
- A prompt containing sensitive data produces a policy verdict.
- Audit logs show who did what, on which platform, and what action was taken.
- The README explains the problem, architecture, setup, impact, and limitations.

## Suggested Demo Flow

1. Open the dashboard and show security KPIs.
2. Open Policies and explain each action type: allow, alert, soft block, mask, hard block.
3. Open AI Apps and show the platform registry.
4. Open Users and Roles and show role-based user records.
5. Open Detection Engine and test a PAN, Aadhaar, email, phone number, or credential-like string.
6. Load the Chrome extension from `extension/`.
7. Sign in to the extension.
8. Open a supported AI site and submit a prompt containing sensitive data.
9. Show the extension enforcement overlay or masking behavior.
10. Return to Activity Logs and show the audit event.

## Impact

MazikDLP helps organizations adopt AI without losing governance. It reduces the chance of sensitive data disclosure, gives security teams visibility into AI platform usage, creates audit evidence for compliance, and allows AI to remain useful through flexible enforcement and masking rather than blanket blocking.

## Known Scope Boundaries

- This repo focuses on MazikDLP. The original academic report also described related systems called MazikWall and Mazik Mini Firewall, but those are not part of this repository.
- The extension is currently intended for Chrome as an unpacked MV3 extension.
- Enterprise deployment integrations such as SSO, SIEM connectors, and production alert channels are future work.
- The academic PDF report is a local reference file and is ignored by Git.
