# MazikDLP

Enterprise AI Data Loss Prevention for browser-based AI usage.

MazikDLP protects organizations from accidental or deliberate leakage of sensitive data into public AI tools such as ChatGPT, Claude, Gemini, Copilot, Perplexity, Grok, GitHub Copilot, and DeepSeek. It combines a Chrome Manifest V3 extension, a FastAPI detection backend, PostgreSQL/Redis storage, and a React admin dashboard so security teams can monitor AI usage, define policies, detect sensitive content, and enforce controls before prompts leave the browser.

This repository contains the MazikDLP implementation from a larger academic AI security project. The original project report also discussed MazikWall and Mazik Mini Firewall, but this codebase is focused on the enterprise MazikDLP product.

## Problem

AI tools are now part of normal professional work: employees use them to write emails, summarize reports, debug code, analyze spreadsheets, and generate documents. That creates a new data-loss channel that traditional DLP tools do not handle well.

Key risks addressed by MazikDLP:

- Employees can paste PII, credentials, source code, customer records, financial data, and internal business information into AI chat interfaces.
- Traditional DLP products are usually designed for email, file transfer, endpoint storage, or network gateways. They do not reliably inspect the exact prompt text inside modern HTTPS AI web applications before submission.
- Organizations often lack visibility into who is using AI tools, which platforms are used, what sensitive entity types appear in prompts, and whether violations were blocked or bypassed.
- Indian compliance identifiers such as PAN, Aadhaar, GSTIN, IFSC codes, and Indian phone numbers need first-class detection alongside international PII.
- Security teams need policy controls that are flexible enough for real use: sometimes block, sometimes warn, sometimes mask, sometimes only log.

## Solution

MazikDLP intercepts prompts in the browser before they are submitted to AI platforms. The extension sends the prompt to the backend scanning API, where multiple detectors identify sensitive content and the policy engine decides what should happen. The extension then enforces the decision in the user's AI app.

Supported enforcement actions:

- `allow`: permit the prompt and log the event.
- `alert`: permit the prompt but show a low-friction warning.
- `soft_block`: show a warning modal and allow the user to proceed with an audit trail.
- `mask`: replace sensitive values with placeholders before submission, then restore placeholders in the displayed AI response.
- `hard_block`: prevent the prompt from being submitted at all.

The goal is not to ban AI adoption. The goal is to let organizations use AI safely, with visibility, governance, and a compliance trail.

## Core Features

- Chrome Manifest V3 extension for prompt interception on popular AI platforms.
- React 19 + TypeScript admin dashboard with pages for dashboard, policies, AI apps, users, logs, analytics, reports, custom patterns, detection testing, settings, and browser extension setup.
- FastAPI backend with REST APIs for authentication, users, policies, scanning, audit logs, AI apps, analytics, settings, custom patterns, health checks, and image redaction.
- PostgreSQL database for persistent multi-tenant security data.
- Redis for masking-session storage and temporary placeholder restoration.
- JWT authentication with refresh-token support.
- Role-based access control for administrators, analysts, managers, and employees.
- Detection for standard PII, Indian PII, credentials, secrets, source code, database schemas, and organization-defined custom patterns.
- Audit logging with prompt hashing so raw prompt text is not persisted.
- CSV export and report-oriented views for compliance workflows.
- Docker Compose setup for backend, PostgreSQL, and Redis.

## Architecture

MazikDLP uses a three-tier architecture:

```text
Browser / AI platform
  |
  | 1. content.js intercepts prompt submit events
  v
Chrome Extension
  |
  | 2. background.js sends scan request with JWT
  v
FastAPI Backend
  |
  | 3. detectors + policy engine produce verdict
  v
PostgreSQL + Redis
  |
  | 4. audit logs, policy data, app registry, masking sessions
  v
Chrome Extension
  |
  | 5. allow, alert, soft block, mask, or hard block
  v
AI platform receives only the approved or masked prompt
```

Main components:

- `extension/`: Chrome extension with content script, background service worker, overlay UI, and popup login/status UI.
- `backend/app/api/`: FastAPI route modules for the product API.
- `backend/app/detectors/`: detection modules and pipeline orchestration.
- `backend/app/services/`: business logic for auth, scan, policy, masking, audit, categorization, and users.
- `backend/app/models/`: SQLAlchemy ORM models.
- `src/pages/`: React dashboard pages.
- `src/data/`: demo and dashboard seed data used by the frontend experience.

## Detection Engine

The backend detection pipeline combines several detectors:

| Detector | What it detects |
| --- | --- |
| Presidio NLP | Email, phone, credit card, person, IP address, location, SSN, IBAN, URL, dates, medical license, bank number, passport |
| Indian PII | PAN, Aadhaar, GSTIN, IFSC, Indian phone numbers |
| Credential detector | Password-like values, connection strings, authorization headers, bearer tokens |
| Secrets detector | AWS keys, GitHub tokens, Stripe-like keys, JWTs, private key blocks |
| Code detector | Python, JavaScript, SQL, Java, and shell snippets |
| DB schema detector | DDL statements such as `CREATE TABLE`, `ALTER TABLE`, and `DROP DATABASE` |
| Custom patterns | Organization-specific regex or keyword detectors |

Policy evaluation uses priority order and a strictness hierarchy:

```text
hard_block > mask > soft_block > alert > allow
```

This means a high-risk match cannot be weakened by a lower-priority permissive rule.

## Supported AI Platforms

The extension is configured for:

- ChatGPT: `chatgpt.com`, `chat.openai.com`
- Claude: `claude.ai`
- Gemini: `gemini.google.com`
- Grok: `grok.com`, `x.com`
- Perplexity: `perplexity.ai`, `www.perplexity.ai`
- Microsoft Copilot: `copilot.microsoft.com`
- GitHub Copilot: `github.com`
- DeepSeek: `chat.deepseek.com`

## Dashboard Pages

- Dashboard: security KPIs, scan trends, compliance breakdown, recent events.
- Policies: create and manage DLP rules, actions, targets, and priority ordering.
- Custom Patterns: define and test regex or keyword detectors.
- Detection Engine: test sample text and inspect detected entities.
- AI Apps: manage AI platform registry, risk, and status.
- Users and Roles: manage RBAC users and account status.
- Activity Logs: inspect, filter, and export audit events.
- Analytics: usage trends, platform rankings, entity categories, top users.
- Reports: report templates and audit-data export workflows.
- Settings: organization configuration and API key management.
- Browser Extension: install and integration guide.

## Security And Privacy Design

- Prompt interception happens before browser submission to the AI platform.
- Raw prompt text is scanned for a verdict but is not stored permanently in audit logs.
- Audit logs store event metadata, detected entity types, policy decisions, platform, user context, and prompt hashes.
- Masking uses temporary placeholder mappings stored in Redis with expiration.
- Extension authentication uses access tokens and refresh tokens.
- Backend endpoints are organized with role-aware service boundaries.
- Rate limiting and structured request logging are enabled in the FastAPI app.

## Compliance Relevance

MazikDLP is designed to support compliance workflows for:

- GDPR and privacy-sensitive personal data handling.
- HIPAA-style protection of health and medical identifiers.
- PCI-DSS-style protection of payment card data.
- CCPA-style privacy auditability.
- India DPDP Act oriented protection for Indian PII such as PAN and Aadhaar.

The product helps demonstrate reasonable controls around AI usage: detection, prevention, user warning, data minimization, and auditability.

## Demo Dataset

The repository includes demo-oriented seed scripts and dashboard data so evaluators can see a realistic environment quickly:

- Multiple AI apps with whitelisted, restricted, and blocked states.
- Policies covering financial data, emails, phone numbers, secrets, medical data, and app-specific restrictions.
- Demo users across admin, analyst, manager, employee, engineering, finance, HR, legal, and security roles.
- Activity logs and analytics data for dashboard visualization.
- A demo guide in `DEMO_GUIDE.md`.
- A compact AI-evaluator brief in `HACKATHON_EVALUATION.md`.

## Quick Start

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Start the backend stack

```bash
cd backend
docker compose up -d
```

The backend stack exposes:

- FastAPI API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### 3. Start the dashboard

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

### 4. Load the browser extension

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer Mode.
3. Click Load unpacked.
4. Select the `extension/` folder from this repository.
5. Pin the MazikDLP extension.
6. Sign in from the extension popup after the backend is running.

## Useful Commands

```bash
# Frontend development server
npm run dev

# Frontend production build
npm run build

# Backend stack
cd backend
docker compose up -d

# Backend API docs
# Open http://localhost:8000/docs
```

## API Surface

The backend groups APIs under `/api/v1`:

- Health: service readiness and liveness checks.
- Configuration: runtime configuration consumed by frontend/extension.
- Authentication: login, refresh, logout flows.
- Users: user and role management.
- Scanning: prompt scan and masked value restoration.
- Policies: DLP policy CRUD and evaluation data.
- Logs: audit logs and exports.
- AI Apps: AI platform registry and app status.
- Analytics: usage and security metrics.
- Custom Patterns: regex/keyword pattern management.
- Settings: organization-level settings.
- Image Redaction: OCR and face-redaction workflow support.

## Evaluation Highlights

From the project report and local validation:

- MazikDLP was designed around browser-level AI prompt interception, which is the key gap traditional DLP products miss.
- The project report describes a test corpus of 120 prompts with an overall detection F1 score of 93.8 percent across PII, Indian PII, credentials, secrets, source code, database schema, and credit-card categories.
- Indian PII detection in the report correctly identified PAN, Aadhaar, GSTIN, IFSC, and Indian phone number samples.
- API testing in the report covered login, scanning, masking restoration, policy CRUD, audit-log export, analytics usage data, reports, and health checks.
- Reported local scan latency was approximately 120-180 ms in Docker for typical prompt scans, with Presidio/spaCy as the main latency contributor.
- In this repository, the frontend production build has been verified with `npm run build`.

## Current Limitations

- The Chrome extension is currently loaded as an unpacked developer extension.
- Firefox and Edge ports are not included in this repository.
- Enterprise SSO/LDAP integration is future work.
- Advanced SIEM integrations are not yet wired as production connectors.
- The original academic PDF report is intentionally not committed because it is a large local reference artifact.

## Future Work

- Add Firefox and Edge extension builds through the WebExtensions API.
- Add SSO integrations such as Azure AD or Okta.
- Add Slack, Microsoft Teams, and email alert webhooks for critical violations.
- Expand DPDP Act 2023 compliance mapping.
- Add screenshot and clipboard image scanning before AI upload.
- Add semantic classification to reduce false positives for ambiguous content.
- Add production deployment templates for cloud and on-prem environments.

## Repository Notes

- The browser extension lives in `extension/`.
- The academic reference report is named `reportv7.pdf` locally and is ignored by Git.
- Demo instructions are in `DEMO_GUIDE.md`.
- Backend-specific setup details are in `backend/README.md`.

## License

No license file is currently included. Add a license before using or distributing this project outside the hackathon/academic evaluation context.
