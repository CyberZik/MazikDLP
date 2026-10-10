# MazikDLP — Complete Project Details

## 1. Project Overview

**MazikDLP** is an enterprise-grade **AI Data Loss Prevention (DLP)** system that intercepts, scans, and enforces security policies on every prompt sent to public AI tools — before it leaves the browser.

**Problem it solves:** Employees routinely paste sensitive data (PAN cards, Aadhaar, emails, credentials, source code) into public AI platforms like ChatGPT and Claude, with zero organizational visibility or control.

**Core value:**
- Real-time prompt interception — no changes needed to how users work
- Organization-wide policy enforcement across all AI tools
- Full audit trail for compliance (GDPR, HIPAA, PCI-DSS, CCPA)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│  ┌────────────────┐      ┌──────────────────────────┐   │
│  │  AI Platform   │      │   Chrome Extension MV3   │   │
│  │ (ChatGPT, etc) │◄────►│  content.js (DOM hook)   │   │
│  └────────────────┘      │  popup.html (UI)         │   │
│                           └──────────┬───────────────┘   │
└──────────────────────────────────────┼───────────────────┘
                                       │ chrome.runtime
                              ┌────────▼────────┐
                              │  background.js  │
                              │ (Service Worker)│
                              └────────┬────────┘
                                       │ HTTPS REST
                        ┌──────────────▼──────────────┐
                        │     FastAPI Backend          │
                        │  ┌──────────┐ ┌──────────┐  │
                        │  │ Presidio │ │  Policy  │  │
                        │  │   NLP    │ │  Engine  │  │
                        │  └──────────┘ └──────────┘  │
                        │  ┌──────────┐ ┌──────────┐  │
                        │  │  Audit   │ │ Masking  │  │
                        │  │ Logger   │ │ Service  │  │
                        │  └──────────┘ └──────────┘  │
                        └───────┬──────────────┬───────┘
                                │              │
                    ┌───────────▼──┐    ┌──────▼──────┐
                    │  PostgreSQL  │    │    Redis     │
                    │  (8 tables)  │    │(mask sessions│
                    └──────────────┘    └─────────────┘

     ┌─────────────────────────────────────┐
     │   React Admin Dashboard             │
     │   (13 pages, Tailwind, Recharts)    │
     └──────────────────┬──────────────────┘
                        │ REST API
                        └──── same FastAPI backend
```

---

## 3. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Dashboard | React | 19.2.3 |
| Frontend Dashboard | TypeScript | 5.9.3 |
| Frontend Dashboard | Tailwind CSS | 4.1.17 |
| Frontend Dashboard | Recharts | 3.8.0 |
| Frontend Dashboard | Vite | 7.2.4 |
| Chrome Extension | Manifest V3 | — |
| Backend API | FastAPI (Python) | 0.115.6 |
| Backend API | Uvicorn (ASGI) | 0.34.0 |
| ORM | SQLAlchemy (async) | 2.0.36 |
| Migrations | Alembic | 1.14.1 |
| NLP / PII Detection | Microsoft Presidio | 2.2.354 |
| NLP Model | spaCy en_core_web_lg | 3.8.3 |
| Image Redaction | Presidio Image Redactor + OpenCV | ≥0.0.44 |
| Primary Database | PostgreSQL | 16 (Alpine) |
| Cache / Sessions | Redis | 7 (Alpine) |
| Authentication | JWT (python-jose) | 3.3.0 |
| Password Hashing | bcrypt (passlib) | 1.7.4 |
| Rate Limiting | SlowAPI | 0.1.9 |
| Logging | structlog | 24.4.0 |
| Containerization | Docker + Docker Compose | — |

---

## 4. Features (13 Admin Dashboard Pages)

| Page | Description |
|------|-------------|
| **Dashboard** | KPI cards (scans, blocks, masks), activity trend chart, compliance detection overview (HIPAA/GDPR/PCI-DSS/CCPA), recent security events |
| **Policies** | Full CRUD for DLP policies with 5 enforcement actions, priority ordering, platform/user-group targeting |
| **Custom Patterns** | User-defined regex/keyword detectors with test harness, category grouping, false-positive tracking |
| **Detection Engine** | Real-time detection testing UI showing which built-in detectors fired |
| **AI Apps** | Registry of AI platforms with whitelisted/blocked/restricted status management |
| **Users & Roles** | User management, RBAC (Admin/Security Analyst/Manager/Employee), per-user activity logs |
| **Activity Logs** | Queryable audit logs with filters (user, action, platform, date), CSV export |
| **Analytics** | Usage trends, security breakdown, platform rankings, category analysis, top users |
| **Reports** | PDF executive summary report generation (real data from backend), CSV export |
| **Settings** | Org settings, API key management (create/rotate/revoke) |
| **Browser Extension** | Extension install status, version tracking, integration guide |

---

## 5. Supported AI Platforms (11)

1. ChatGPT (`chatgpt.com`)
2. ChatGPT Legacy (`chat.openai.com`)
3. Claude (`claude.ai`)
4. Gemini (`gemini.google.com`)
5. Grok (`grok.com`)
6. Grok via X (`x.com`)
7. Perplexity (`perplexity.ai`)
8. Microsoft Copilot (`copilot.microsoft.com`)
9. GitHub Copilot (`github.com`)
10. DeepSeek (`chat.deepseek.com`)
11. Perplexity www (`www.perplexity.ai`)

---

## 6. Detection Capabilities (7 Detectors)

| Detector | Entity Types Detected |
|----------|----------------------|
| **Presidio NLP** | EMAIL_ADDRESS, PHONE_NUMBER, CREDIT_CARD, PERSON, IP_ADDRESS, LOCATION, US_SSN, IBAN_CODE, URL, DATE_TIME, NRP, MEDICAL_LICENSE, US_BANK_NUMBER, US_PASSPORT |
| **Indian PII** | IN_PAN, IN_AADHAAR, IN_GSTIN, IN_IFSC, IN_PHONE_NUMBER |
| **Credential Detector** | CREDENTIAL (passwords, connection strings, auth headers, bearer tokens) |
| **Secrets Detector** | CUSTOM_SECRET (AWS keys, GitHub tokens, Stripe keys, JWT, RSA keys, etc.) |
| **Code Detector** | SOURCE_CODE (Python, JavaScript, SQL, Java, Shell) |
| **DB Schema Detector** | SOURCE_CODE DDL (CREATE TABLE, ALTER TABLE, DROP DATABASE) |
| **Custom Patterns** | User-defined entity types via regex or keyword lists |

---

## 7. DLP Policy Actions

| Action | Behavior | Severity Logged |
|--------|----------|----------------|
| **allow** | Permit, log silently | info |
| **alert** | Permit, show toast notification | low |
| **soft_block** | Show warning modal — user can bypass | high |
| **mask** | Replace PII with `<ENTITY_xxxx>` placeholder, restore in AI reply | medium |
| **hard_block** | Block submission entirely, show block screen | critical |

Priority: `hard_block > mask > soft_block > alert > allow`

---

## 8. Scan Pipeline (Step by Step)

1. User presses Enter / clicks Send on any AI platform
2. Extension's `content.js` intercepts the event (capture phase, before React)
3. Text is sent via `chrome.runtime.sendMessage` to `background.js`
4. Background forwards to `POST /api/v1/scan` with JWT auth
5. Backend runs 7 detectors in parallel → collects all entity hits
6. Custom patterns for the org are loaded from PostgreSQL and run
7. Active policies are fetched and evaluated against detected entities
8. Strictest matching policy action is applied
9. If `mask`: entities replaced with placeholders, mapping saved in Redis with `session_id`
10. Audit log written to PostgreSQL
11. Response returns to extension → extension enforces UI (block/warn/mask/allow)
12. If `mask`: extension watches AI's response for placeholders, calls `/restore` to swap them back

---

## 9. Database Schema (8 Tables)

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant root — each org is isolated |
| `users` | User accounts with roles, department, status |
| `policies` | DLP rules with action, data types, platform targeting |
| `custom_patterns` | Org-specific regex/keyword detection patterns |
| `ai_apps` | Registry of AI platforms with risk/compliance metadata |
| `audit_logs` | Immutable event log for every scan |
| `system_settings` | Per-org configuration (JSONB) |
| `api_keys` | Hashed API keys for programmatic access |

---

## 10. API Summary (30+ Endpoints)

| Module | Endpoints |
|--------|-----------|
| Auth | register, login, refresh, logout |
| Users | CRUD + role assignment |
| Policies | CRUD |
| Custom Patterns | CRUD + test + export |
| AI Apps | CRUD + status update |
| Scan | scan, restore, detect/test |
| Audit Logs | list, stats, get, export CSV |
| Analytics | usage, security, apps, categories, users |
| Settings | org settings + API key management |
| Image Redaction | redact JPEG/PNG/WebP |
| Health | health, detailed, ready, live |
| Config | app config + feature flags |

---

## 11. Security Features

- **JWT Authentication** — access token (15 min) + refresh token (7 days), token blacklisting
- **RBAC** — 4 roles: Admin, Security Analyst, Manager, Employee
- **Rate Limiting** — SlowAPI on all endpoints
- **Multi-tenancy** — every query scoped to `org_id`, no cross-org data leakage
- **Prompt Privacy** — only SHA-256 hash of prompt stored, not raw text
- **Image Redaction** — Presidio OCR + face blurring + embedded `MAZIKDLP_REDACTED` marker in EXIF
- **Token Refresh** — background.js handles silent refresh, popup retries on 401

---

## 12. Key Technical Challenges Solved

| Challenge | Solution |
|-----------|----------|
| React controlled inputs ignore `innerText =` | Used `document.execCommand('insertText')` to go through native editing pipeline |
| Submit fires before React flushes masked state | Added 150ms `setTimeout` before resubmit |
| Token expiry in extension popup | Background service worker handles silent refresh + retry transparently |
| `libGL.so.1` missing in Docker for OpenCV | Switched to `opencv-python-headless` |
| Custom patterns ignored by policy engine | `_run_custom_patterns` now returns action map used as fallback |
| Compliance metrics with no extra backend work | Dashboard derives HIPAA/GDPR/PCI-DSS/CCPA counts by mapping entity types |

---

## 13. Project Structure

```
MazikDLP/
├── src/                          # React Admin Dashboard
│   ├── pages/                    # 13 pages
│   ├── data/                     # Static data / mock data
│   ├── lib/api.ts                # API client
│   └── index.css                 # Theme (Tailwind v4)
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── api/                  # 12 route modules
│   │   ├── models/               # 8 SQLAlchemy models
│   │   ├── services/             # scan, policy, masking, audit
│   │   ├── detectors/            # 7 detection engines
│   │   └── schemas/              # Pydantic request/response models
│   ├── alembic/versions/         # DB migrations
│   ├── requirements.txt
│   └── docker-compose.yml
└── extension/                    # Chrome Extension MV3
    ├── manifest.json
    ├── content.js                # DOM interception (11 platforms)
    ├── background.js             # Service worker + auth
    └── popup/                    # Popup UI
```

---

## 14. Color Theme

- **Primary:** Violet `#8B5CF6` (buttons, active states, links)
- **Page BG:** `#F9FAFB` (very light gray)
- **Cards:** `#FFFFFF` with `#E5E7EB` borders
- **Text:** `#1F2937` (deep) → `#6B7280` (muted) → `#9CA3AF` (subtle)
- **Danger:** `#EF4444` / **Warning:** `#F59E0B` / **Success:** `#10B981` / **Info:** `#3B82F6`
- **Font:** Inter

---

## 15. Deployment

- **Backend:** Docker Compose (3 containers: FastAPI + PostgreSQL 16 + Redis 7)
- **Frontend:** Vite dev server (port 5173) or static build
- **Extension:** Loaded unpacked in Chrome (`chrome://extensions`)
- **Backend port:** 8000
- **API docs:** `http://localhost:8000/docs` (Swagger UI)
