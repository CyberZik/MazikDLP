

# MazikDLP — Mid-Semester Evaluation Demo Guide

## ─── SETUP (Do this the night before) ───────────────────────────────────────

### 1. Start the backend
```bash
cd backend
docker compose up -d
```
Wait ~10 seconds for the DB to be ready.

### 2. Seed demo data
```bash
# Install httpx if not already installed
pip install httpx

# Run the seed script with YOUR admin credentials
python backend/scripts/seed_demo.py --email your@email.com --password yourpassword
```
Expected output:
```
── AI Applications ─────────────────────────────────────────────────────────
  ✓  ChatGPT
  ✓  Claude AI
  ✓  Gemini
  ✓  Microsoft Copilot
  ✓  DeepSeek
  ✓  Perplexity AI
  ✓  Grok

── Policies ─────────────────────────────────────────────────────────────────
  ✓  Financial Data — Hard Block
  ✓  Email Address — Soft Block
  ✓  Phone Numbers — Auto Mask
  ✓  API Keys & Secrets — Alert
  ✓  Medical Records — Hard Block
  ✓  Unrestricted AI Apps — Allow

── Custom Patterns ──────────────────────────────────────────────────────────
  ✓  MazikCorp Employee ID
  ✓  Project Code — Confidential

── Done ─────────────────────────────────────────────────────────────────────
  Platform is ready for the demo.
```

### 3. Load the Chrome extension
- Open `chrome://extensions`
- Enable **Developer Mode** (top right)
- Click **"Load unpacked"** → select the `extension/` folder
- Pin the MazikDLP icon to the toolbar

### 4. Sign into the extension
- Click the MazikDLP icon in Chrome
- Enter your admin email + password → Sign In
- Status should show **"Active"**

### 5. Start the React dashboard
```bash
npm run dev
```
Open `http://localhost:5173` → sign in

---

## ─── DEMO FLOW ───────────────────────────────────────────────────────────────

---

### SCENE 1 — Dashboard Overview (2 min)

**Show:** `http://localhost:5173` → Dashboard

**Talk points:**
- Top KPI cards: Total Scans, Threats Blocked, Entities Masked, Active Policies, Protected Users
- AI Usage by Platform chart (real data if you've done test scans)
- Activity log at the bottom showing recent policy decisions

**Action:** Point out the "AI Apps Monitored" count — 7 apps already registered.

---

### SCENE 2 — Policy Engine: 4 Action Types (3 min)

**Show:** Sidebar → Policies

**Walk through each pre-seeded policy:**

| Policy | Action | What to say |
|--------|--------|-------------|
| Financial Data — Hard Block | `hard_block` | "Zero-tolerance — PAN, Aadhaar, Credit Card — never reaches any AI" |
| Email Address — Soft Block | `soft_block` | "Warn but let user decide with audit trail" |
| Phone Numbers — Auto Mask | `mask` | "Replaces the number with a token, AI never sees it, we restore it in the response" |
| API Keys & Secrets — Alert | `alert` | "Logs it as high-severity but doesn't interrupt the user flow" |

**Live test from the dashboard (Policies → Test Policy):**
1. Click on **"Financial Data — Hard Block"** → open it
2. Use the built-in test panel, enter: `My PAN is ABCDE1234F`
3. Show result: `hard_block` triggered, entity `IN_PAN` detected

**Then create a NEW policy during the demo:**
> "Now I'll create one live — let's say we want to block any Aadhaar numbers going to DeepSeek specifically."

- Click **"New Policy"**
- Name: `Aadhaar — DeepSeek Block`
- Action: `hard_block`
- Data Types: `IN_AADHAAR`
- Platform: `DeepSeek`
- Priority: `1`
- Save → show it appears in the list instantly

---

### SCENE 3 — Live Extension Demo: Block (2 min)

**Open a new tab → go to `chat.openai.com`**

1. Type: `My PAN card is ABCDE1234F, help me fill this form`
2. Press **Enter** (or click Send)
3. **Show:** MazikDLP scanning indicator flashes → **Hard Block overlay** appears
4. Show the detected entity `IN_PAN` listed in the overlay
5. Click **"Edit Prompt"** — overlay closes, cursor returns to input

**Say:** "The prompt never reached OpenAI. The block happened client-side before the HTTP request was made."

---

### SCENE 4 — Live Extension Demo: Soft Block (1 min)

**Still on ChatGPT (or go to claude.ai)**

1. Type: `Please email the report to john.doe@company.com`
2. Press Enter
3. **Show:** Warning overlay — "Sensitive Data Warning" with `EMAIL_ADDRESS` detected
4. Two options: **"Edit Prompt"** or **"Send Anyway"**
5. Click "Send Anyway" → prompt goes through, activity is logged

**Say:** "This is the soft block — user gets to decide, but every bypass is recorded in the audit log."

---

### SCENE 5 — Live Extension Demo: Masking (2 min)

**Prerequisite:** Make sure "Phone Numbers — Auto Mask" policy is active with action = `mask`

**On ChatGPT:**
1. Type: `Call me back on +91 98765 43210 to discuss the project`
2. Press Enter
3. **Show:** The text in the input box changes — the phone number becomes `<PHONENUM_xxxx>`
4. The masked prompt gets sent to ChatGPT
5. ChatGPT's response will contain the placeholder
6. The extension automatically restores the original number in the AI's reply

**Say:** "The AI never saw the real number. Our backend stores the mapping in Redis with a session ID. The extension restores it in the response so the user experience is seamless."

---

### SCENE 6 — Custom Patterns (2 min)

**Show:** Sidebar → Custom Patterns

**Walk through pre-seeded patterns:**
- **MazikCorp Employee ID** (`EMP-\d{5}`) — regex pattern, alert action
- **Project Code** (`PRJ-[A-Z]{4}-\d{2}`) — soft_block

**Show the test panel:**
1. Click on **"MazikCorp Employee ID"**
2. In test text, enter: `My employee ID is EMP-10042`
3. Click **"Test Pattern"** → show match highlight

**Create a NEW pattern live:**
> "Let me add a pattern for our internal invoice numbers."

- Click **"New Pattern"**
- Name: `Invoice Number`
- Entity Type: `INVOICE_NUMBER`
- Pattern Type: `regex`
- Pattern: `INV-\d{4}-[A-Z]{3}`
- Sensitivity: `high`
- Action: `soft_block`
- Test with: `Please process invoice INV-2024-MAR`
- Save

---

### SCENE 7 — AI Apps: Block / Whitelist (2 min)

**Show:** Sidebar → AI Apps

**What to show:**
- ChatGPT, Claude AI, Microsoft Copilot → **Whitelisted** (green)
- Gemini, Grok → **Restricted** (amber)
- DeepSeek, Perplexity → **Blocked** (red)

**Live action — block an app:**
1. Click on **Gemini** (currently Restricted)
2. Click **"Block"** → status changes to Blocked (red)
3. Say: "Any employee attempting to use Gemini now gets blocked at the policy level"

**Then whitelist it back:**
1. Click **"Allow"** → back to Whitelisted

**Say:** "This gives IT admins instant control over which AI tools employees can use, without any software deployment."

---

### SCENE 8 — Activity Logs (1 min)

**Show:** Sidebar → Activity Logs

**What to show:**
- The log entries from your demo actions (blocks, allows, masks)
- Filter by **Action = hard_block** → shows only blocked prompts
- Filter by **Platform = ChatGPT** → shows only ChatGPT activity
- Click on a log entry → show full detail: entities detected, policy matched, response time

**Say:** "Every single AI interaction is logged with full context — who, when, what platform, what was detected, what action was taken. Full audit trail for compliance."

---

### SCENE 9 — Image Redaction (2 min)

**Show the extension popup:**
1. Click MazikDLP icon in Chrome
2. Scroll to **"Image Redaction"** section
3. Click **"Choose Image"** → select any photo with text or a face
4. Click **"Redact & Download"**
5. Show the downloaded redacted image — faces blurred, text OCR'd and redacted
6. Say: "The extension also marks this file with an invisible MAZIKDLP_REDACTED tag"

**Show the upload gate:**
1. Go to ChatGPT → click the attachment button → try to upload the ORIGINAL (unredacted) photo
2. **Show:** "Image Not Redacted" warning overlay
3. Options: "Cancel Upload" or "Upload Anyway"
4. Upload the REDACTED version → no warning, goes through cleanly

---

### SCENE 10 — Report Generation (1 min)

**Show:** Sidebar → Reports

**Walk through tabs:**
- **Generated Reports** — history of all exported reports (pre-seeded examples)
- **Report Templates** — Executive Summary, Security Report, Compliance Report, etc.
- **Compliance** — GDPR, HIPAA, PCI-DSS compliance scorecards

**Generate a real report:**
1. Click on **"Security Threat Report"** template
2. Click **"Generate Report"**
3. In the modal, keep defaults (PDF, 7-day range)
4. Click **"Generate & Download CSV"**
5. Show the downloaded CSV file with all real audit log data

**Say:** "In a production setup this would generate a full PDF with charts. Right now it exports the complete audit log as CSV — the same data your compliance team would need."

---

## ─── WHAT TO DO IF THINGS BREAK ──────────────────────────────────────────────

| Problem | Fix |
|---------|-----|
| Extension not intercepting | Reload extension at `chrome://extensions` + refresh AI site |
| Backend 401 errors | Sign out and back in from the popup |
| Scan returns `allow` always | Check that policies are **active** in the dashboard |
| Block overlay not appearing | Check browser console — look for `[MazikDLP]` logs |
| Docker not starting | `docker compose down && docker compose up -d` |

**Backup plan:** If the live extension demo fails, open the browser console on the AI site, paste this to show the content script is loaded:
```
// In browser console on chatgpt.com
document.querySelectorAll('[id^="mazikdlp"]')  // Shows any active overlays
```

---

## ─── DEMO CHECKLIST (Do the day of) ─────────────────────────────────────────

- [ ] `docker compose up -d` — backend running
- [ ] Seed script ran with no errors
- [ ] Dashboard loads at `http://localhost:5173`
- [ ] Extension signed in, status = Active
- [ ] Test: type PAN on ChatGPT → hard block appears
- [ ] Test: type email on Claude → soft block appears
- [ ] Policies page shows 6 policies
- [ ] AI Apps page shows 7 apps (2 blocked, 2 restricted, 3 whitelisted)
- [ ] Custom Patterns page shows 2 pre-seeded patterns
- [ ] Reports → Generate & Download → CSV downloads successfully
- [ ] Browser zoom set to **110%** so the extension popup is visible to audience
- [ ] Screen resolution: **1920×1080** recommended

---

## ─── THINGS YOU CREATE LIVE ─────────────────────────────────────────────────

### Policy (Scene 2):
- Name: `Aadhaar — DeepSeek Block`
- Action: `hard_block` | Data Types: `IN_AADHAAR` | Platform: `DeepSeek` | Priority: `1`

### Custom Pattern (Scene 6):
- Name: `Invoice Number`
- Pattern: `INV-\d{4}-[A-Z]{3}` | Action: `soft_block` | Sensitivity: `high`
- Test with: `Please process invoice INV-2024-MAR`
