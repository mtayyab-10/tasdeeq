# Tasdeeq / TrueNorth

> 🤖 **Multi-Agent Pre-Submission Quality Gate & Automated Accounting Office**
> 🌐 **Live Deployment:** https://gotruenorth-ai.vercel.app/

[![Multi-Agent System](https://img.shields.io/badge/Architecture-7%20Specialized%20Agents%20%2B%20Manager-0F7B6C.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Model: Gemma 4 26B A4B IT](https://img.shields.io/badge/Model-Gemma%204%2026B-orange)](https://ai.google.dev/gemma)
[![Platform: Web + Extension](https://img.shields.io/badge/Platform-Web%20%2B%20Browser%20Extension-blueviolet)](#)
[![Stack: Next.js 16 + TypeScript](https://img.shields.io/badge/Stack-Next.js%2016%20%7C%20TypeScript-black)](#)

**Context-Aware Data Quality & Pre-Submission Verification System**

> *Catch the wrong number before it is saved.* A pre-submission quality gate before the database that checks context, provides evidence, and gives analysts a clear decision before data is accepted.

---

## The Product Vision & Core Principle

**TrueNorth** is an intelligent, context-aware pre-submission quality gate engineered to identify suspicious, inconsistent, incorrect, or insufficiently supported data before it is committed to downstream accounting, ERP, or ledger systems.

Inspired by industrial *Poka-Yoke* (mistake-proofing) principles, TrueNorth catches clerical blunders, arithmetic mismatches, digit transpositions, and contextual outliers directly at entry time — in the web workspace and across third-party web forms via its browser extension.

### Core Architecture Principle

> **Ordinary code for certainty. Statistics for signals. An agent for context. Human review for accountability.**

TrueNorth separates verification into four distinct categories:
1. **Rule Violations (Deterministic Code)**: Checks proving a strict rule has failed (e.g. arithmetic mismatches like `qty × unit_price ≠ total`, missing mandatory fields, negative amounts, future dates).
2. **Contextual Suspicions (Statistical & Agent Signals)**: AI and statistical signals highlighting domain anomalies that warrant human review (e.g., commodity unit prices 10x higher than market benchmarks, mismatched vendor classifications).
3. **Uncertain Extractions (Visual Confidence)**: Low-confidence OCR or illegible handwritten/scanned receipt values flagged for analyst confirmation.
4. **Missing Context (Information Gaps)**: Data that cannot be responsibly verified without prerequisite parameters (e.g. unspecified currency or missing tax exemption justifications).

---

## Two Complementary Interfaces, One Unified Engine

TrueNorth provides two synchronized interfaces powered by the same backend verification engine (`/api/verify`):

### 1. Main Web Workspace (`/`)
- Enter entries manually or upload document photos/invoices.
- Configure business context (business domain, currency, reporting period, variance tolerance).
- Run the unified verification pipeline combining deterministic math rules, benchmark statistics, and Gemma 4 contextual reasoning.
- Interactive findings review with visual evidence, explanations, and suggested actions (e.g. 1-click adopt document value).
- Human review accountability: correct values, accept legitimate exceptions with required business justifications, or dismiss with audit notes.
- Strict **Quality Gate**: Prevents release while blocking errors remain. Generates cryptographically verified release certificates (`/api/release`) with full audit history export (JSON & CSV).

### 2. Browser Extension (`extension/`)
- Manifest V3 extension compatible with Chromium browsers (Google Chrome & Microsoft Edge).
- Automatically inspects input fields, selects, and labels on active web forms.
- Runs verification against the shared TrueNorth engine.
- Highlights flagged fields directly on the page DOM (glowing red outline for blocking errors, amber for suspicions, with floating tooltips).
- **Pre-Submission Guard**: Intercepts form submissions if unresolved blocking discrepancies exist, halting erroneous data release before external databases are updated.
- Quick in-popup exception review or one-click session transfer into the full Web Workspace (`?session=TN-...`).

### 3. Controlled Demonstration Form (`/demo-form`) & Google Forms Support
- Realistic supplier payable and expense ingestion portal.
- Pre-loaded with one-click clean and flawed datasets (arithmetic errors, digit transpositions, price outliers).
- Built-in live testing ground for both in-page Pre-Submission Guarding and the TrueNorth Browser Extension.
- **Google Forms Support (`docs.google.com/forms`)**: `extension/content.js` extracts `aria-labelledby` and `[role="listitem"] [role="heading"]` question labels, tags inputs with `data-tasdeeq-field` for in-page highlighting and auto-fix, and intercepts Google Forms `[role="button"]` Submit clicks when blocking errors remain.

---

## Multi-Agent Accounting Office Workflow

Tasdeeq orchestrates **7 specialized agents** under a single **Manager Agent**, where each agent owns one focused accounting responsibility:

| # | Agent | MCP / Tool Target | Responsibility |
|---|---|---|---|
| 1 | **Reader Agent** | Google Drive + Gemma 4 Vision | Reads bill photos (English or Urdu) from uploads/shared folders and auto-fills vendor, invoice #, date, total, quantity, and unit price. |
| 2 | **Checker Agent** | Database (`ledger-db.ts` / Supabase) | Compares new entries against historical vouchers using exact invoice matching and fuzzy vendor + amount matching to block duplicate bills. |
| 3 | **Sorter Agent** | Database + `localStorage` | Auto-classifies expenses into 8 accounting categories (e.g. *Utilities*, *Raw Materials*, *Logistics & Fuel*) and learns party-to-category rules whenever corrected. |
| 4 | **Alert Agent** | Gmail | Dispatches a discrepancy alert to the business owner (`GmailAlertModal` + `/api/alert`) with 1-click **Approve** or **Request Fix** actions. |
| 5 | **Report Agent (Weekly)** | Gmail | Compiles the Monday Weekly Quality Summary (*mistakes caught, hours saved, PKR protected, top flagged vendors*) via `/api/reports/weekly`. |
| 6 | **Report Agent (Export)** | Google Sheets / Excel | Writes verified audit records after Quality Gate release and generates one-click Excel-compatible UTF-8 BOM CSV exports. |
| 7 | **Closing Agent** | Google Sheets / Excel | Runs the Month-End Financial Closing Checklist (`/api/closing`), tracks remaining fixes, and issues a SHA-256 closing seal once all items are resolved. |
| 8 | **Manager Agent** | Calendar | Master orchestrator coordinating all 7 agents and scheduling the Monday morning summary and month-end closing review. |

---

## Automated & Interactive Tasks

### What Runs Automatically in the App
- **Auto-Fill from Bill Photo (`Reader Agent`)**: Extracting an invoice image via `/api/extract` populates document fields and enables one-click form auto-fill.
- **Duplicate Bill Prevention (`Checker Agent`)**: Every `/api/verify` run checks the historical ledger (`ledger-db.ts`), and every Quality Gate `/api/release` persists the newly verified voucher into the ledger so subsequent duplicate submissions are caught automatically.
- **Live Expense Categorization (`Sorter Agent`)**: Typing or updating a vendor name in `EntryTable` automatically classifies the expense category; manual changes teach the Sorter Agent across both browser `localStorage` and `/api/agents`.
- **Server-Side Quality Gate & SHA-256 Sealing**: `/api/release` re-evaluates all findings server-side, blocks release if any `blocking` or `high` findings remain open, and generates a cryptographic SHA-256 `ReleaseRecord` (and `/api/closing` generates a SHA-256 month-end closing seal).

- **One-Click Native `.xlsx` Export (`ExportGate.tsx`)**: Quality Gate release generates a true multi-sheet Excel workbook (`Audit Record` + `Findings Log`) via `xlsx`, alongside CSV and JSON audit bundles.
- **Automated Monday Cron (`vercel.json`) & Gmail SMTP (`src/lib/mailer.ts`)**: `vercel.json` triggers `/api/reports/weekly` every Monday at `04:00 UTC` (`09:00 AM PKT`), sending HTML briefings via Nodemailer when `GMAIL_USER` + `GMAIL_APP_PASSWORD` are configured.
- **Optional Cloud Persistence (`supabase/schema.sql` & `src/lib/google-workspace.ts`)**: Automatically persists vouchers, learned Sorter categories, alerts, and Google Sheets/Drive sync when Supabase or Google Service Account env vars are set (with zero-config in-memory fallback for local/demo runs).
- **Production Chrome Extension (`extension/`)**: Configured for `https://gotruenorth-ai.vercel.app` with `http://localhost:3000` fallback and full Google Forms (`docs.google.com/forms`) support.

---

## Architecture Overview

```
truenorth/
├── extension/                     ← Chromium Manifest V3 Browser Extension
│   ├── manifest.json              ← MV3 manifest with activeTab & scripting
│   ├── content.js                 ← Form field discovery, DOM highlighting, pre-submission guard
│   ├── content.css                ← In-page glow borders and badge styles
│   ├── popup.html / popup.js      ← In-workflow extension UI & verification trigger
│   └── icons/                     ← 16px, 48px, 128px PNG icons
│
├── src/
│   ├── app/
│   │   ├── page.tsx               ← Main Web Workspace UI (Poka-Yoke layout)
│   │   ├── demo-form/page.tsx     ← Controlled Demo Form & Pre-Submission Guard
│   │   ├── api/
│   │   │   ├── agents/route.ts        ← Agent roster, Sorter teach/auto-sort & Checker API
│   │   │   ├── alert/route.ts         ← Alert Agent dispatch & owner Approve/Fix API
│   │   │   ├── closing/route.ts       ← Closing Agent checklist & SHA-256 sign-off API
│   │   │   ├── reports/weekly/route.ts← Report Agent Monday summary API
│   │   │   ├── verify/route.ts        ← Unified Verification API (Deterministic + Stat + Gemma 4)
│   │   │   ├── release/route.ts       ← Server-side Quality Gate, ledger save & signed release
│   │   │   ├── session/route.ts       ← Shared review state between Extension & Web
│   │   │   ├── extract/route.ts       ← Multimodal document OCR via Gemma 4 (Reader Agent)
│   │   │   └── summarize/route.ts     ← Executive plain-language summary (EN / UR)
│   │   └── globals.css                ← Pokayoke Design System, Agent Hub & Gmail Modal styles
│   │
│   ├── lib/
│   │   ├── types.ts                   ← Zod schemas, Agent/Alert/Checklist/Gate types
│   │   ├── verification-engine.ts     ← Core engine: deterministic + stats + Checker + Gemma 4
│   │   ├── ledger-db.ts               ← Checker Agent historical ledger & duplicate detector
│   │   ├── sorter-agent.ts            ← Sorter Agent rule classifier & learned party memory
│   │   ├── multi-agent-system.ts      ← Manager, Alert, Report & Closing Agent orchestrator
│   │   ├── review-store.ts            ← In-memory session store for cross-interface sync
│   │   ├── rules-engine.ts            ← Rule dispatch & resolution helpers
│   │   └── demo-cache.ts              ← Pre-cached invoice extraction for instant offline demo
│   │
│   └── components/
│       ├── Uploader.tsx               ← Drag-and-drop document photo zone
│       ├── EntryTable.tsx             ← Manual entry table + live Sorter Agent category row
│       ├── FindingsPanel.tsx          ← Categorized findings review, audit trail & actions
│       ├── ExportGate.tsx             ← Quality gate release + One-Click Excel/CSV/JSON export
│       ├── MultiAgentHub.tsx          ← 8-agent swarm roster & Sorter memory trainer
│       ├── GmailAlertModal.tsx        ← Alert Agent Gmail inbox review & Approve/Fix modal
│       ├── WeeklySummaryModal.tsx     ← Report Agent Monday briefing modal
│       └── MonthEndChecklistModal.tsx ← Closing Agent checklist & SHA-256 closing seal modal
│
├── test-suite.mjs                     ← 20-test automated suite (Verification, Checker, Sorter, Ledger)
└── package.json
```

---

## Open-Source AI & Model Verification (Challenge Compliance)

TrueNorth / Tasdeeq fulfills the **Hackathon Multi-Agent & Open-Weight AI Challenge** requirements through an open-weight multimodal foundation model (`Gemma 4`) paired with an original verification engine and 7-agent accounting office harness.

| Requirement | Project Verification | Direct Link |
|---|---|---|
| **Open-Source Project License** | Permissive OSI-approved open-source license | [MIT License](LICENSE) |
| **Open-Weight Model Name** | `Gemma 4 26B A4B IT` (`gemma-4-26b-a4b-it`) | [Gemma Overview](https://ai.google.dev/gemma) |
| **Model Classification** | Open-Weight Large Language Model (26B parameters, multimodal) | [Google DeepMind Gemma](https://ai.google.dev/gemma) |
| **Model Terms & License** | Google Gemma Terms of Use | [Gemma Terms of Use](https://ai.google.dev/gemma/terms) |
| **Model Harness / Pipeline** | Original 4-tier verification engine + browser extension pre-submission guard | [`src/lib/verification-engine.ts`](src/lib/verification-engine.ts) |
| **Key Dependencies** | `@google/genai` (Apache-2.0), `next` (MIT), `zod` (MIT) | [`package.json`](package.json) |

### AI Technology Contribution & Relevant Code (in Plain Language)

Gemma 4 is integrated strictly on the server side across three high-impact verification roles:

1. **Multimodal Document Extraction ([`src/app/api/extract/route.ts`](src/app/api/extract/route.ts))**:
   - *Plain-Language Contribution*: Interprets messy photos of handwritten or printed bills/invoices (supporting mixed English and Urdu labels) and structures them into verified JSON (vendor, invoice number, line items, subtotals, taxes, totals) without needing a third-party proprietary OCR service.
2. **Contextual Reasoning & Anomaly Detection ([`src/lib/verification-engine.ts`](src/lib/verification-engine.ts) & [`src/app/api/verify/route.ts`](src/app/api/verify/route.ts))**:
   - *Plain-Language Contribution*: Acts as an intelligent context checker. While ordinary deterministic code checks arithmetic (`qty × price = total`), Gemma 4 inspects semantic domain mismatches (e.g., medical pharmacy ordering industrial raw materials, or currency conflicts) and flags them as contextual suspicions for human review.
3. **Plain-Language Bilingual Executive Summary ([`src/app/api/summarize/route.ts`](src/app/api/summarize/route.ts))**:
   - *Plain-Language Contribution*: Synthesizes complex findings into concise, readable summaries in either English or Urdu (اردو) for shop owners, bookkeepers, and auditors.

*Security Guarantee:* The Gemini API key remains strictly on the server (`process.env.gemini_api_key`) and is never exposed to the client-side DOM or browser extension.

---

## Quickstart & Installation

### Prerequisites
- Node.js 18+ (tested on Node 20 & 22)
- Google Gemini API key ([Google AI Studio](https://aistudio.google.com/)) — free tier supported

### 1. Run the Web Workspace
```bash
git clone https://github.com/mtayyab-10/true-north.git
cd true-north
npm install
```

Copy the environment template and add your API key:
```bash
cp .env.example .env.local
```
*(On Windows PowerShell: `Copy-Item .env.example .env.local`)*

Edit `.env.local`:
```env
gemini_api_key=YOUR_GEMINI_API_KEY_HERE
```

Start the application:
```bash
npm run dev -- --port 3001
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

### 2. Install the Browser Extension
1. Open Google Chrome or Microsoft Edge and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in top right).
3. Click **Load unpacked**.
4. Select the `extension/` folder located inside the repository.
5. The **TrueNorth** extension icon (`T`) will appear in your browser toolbar.

---

## Automated Verification Tests

Run the standalone verification engine test suite:
```bash
npm test
# runs: node --experimental-strip-types test-suite.mjs
```
Validates all **20 automated tests**: deterministic arithmetic discrepancy detection, required field enforcement, statistical outlier detection, quality gate state transitions, Checker Agent duplicate matching, Sorter Agent auto-classification & learned memory, and Ledger DB persistence.

---

## End-to-End Demonstration Script

### Scenario A: Web Workspace Verification & Quality Gate Release
1. Open `http://localhost:3001`.
2. Click **"⚡ Load Demo Invoice Sample"**.
3. Notice that 3 discrepancies are detected:
   - Arithmetic error: Total 54,000 does not equal 5 × 3,200 = 16,000.
   - Document total mismatch: Typed 54,000 vs document visual 50,400.
   - Invoice transposition: Typed `INV-2026-0824` vs document visual `INV-2026-0842`.
4. Observe that the **Quality Gate is Blocked** (Release button locked).
5. Resolve findings:
   - Click **"✓ Adopt Document Value (50400)"**.
   - Click **"✓ Adopt Document Value (INV-2026-0842)"**.
   - Correct the arithmetic line or accept the legitimate manual override with a required reason.
6. Once all blocking findings are resolved, the Quality Gate transitions to **Ready for Release**.
7. Click **"🚀 Authorize & Release Data"** to generate the signed release record and download verified CSV/JSON audit bundles.

### Scenario B: In-Workflow Browser Extension & Pre-Submission Guard
1. Open `http://localhost:3001/demo-form`.
2. Click **"⚡ Load Flawed Sample"**.
3. Click the TrueNorth extension icon in your browser toolbar.
4. Click **"Inspect Form"** — all visible fields are instantly captured into the extension.
5. Click **"Verify Entries"** — the extension calls the verification engine, highlights flagged inputs in red on the webpage, and displays blocking findings.
6. Attempt to click **"🚀 Submit Voucher to Accounting"** on the webpage — the in-page **Pre-Submission Guard halts submission** with a blocking alert!
7. Resolve or accept the exceptions inside the extension or click **"Open Full Web Workspace →"** to sync the session to the main workspace.

---

## Quality Gate States

| State | Condition | Downstream Action |
|---|---|---|
| `not_checked` | Data has not been verified | Submission blocked by guard |
| `checking` | Pipeline executing | In-progress spinner |
| `blocked` | Open blocking rule violations exist | **Release strictly forbidden** |
| `needs_review` | Open contextual warnings or suspicions | Review recommended before sign-off |
| `ready_for_release` | All blocking findings resolved | Authorized for downstream release |
| `released` | Released with cryptographic seal | Verified audit record generated |

---

## License

- **License**: MIT License. Designed and engineered for high-integrity data verification and multi-agent accounting workflows.
