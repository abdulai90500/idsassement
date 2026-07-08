# Sabi Core — Take-Home Assessment

**Candidate:** abdulai sillah kamara  
**Date:** July 2026  
**Questions answered:** F1, B4, A1

---

## Architectural Decisions & Trade-offs

To demonstrate readiness for a senior/platform engineering role, I approached these challenges with a focus on **resilience, auditability, and clear separation of concerns.**

### 1. F1 — Frontend Study Screener
- **State Management:** I opted for a custom hook (`useStudies.js`) over heavy libraries like Redux or Zustand. For a focused tool, React state + `localStorage` provides a fast, resilient offline-first experience without bloat.
- **Accessibility (a11y):** The UI is 100% keyboard navigable (`i`, `e`, `f`, arrow keys). I implemented strict ARIA roles and visible focus rings because high-volume screening tools must be ergonomic.
- **Animations:** Added `framer-motion` for subtle micro-interactions to deliver the requested "wow" factor without sacrificing performance.

### 2. B4 — Backend Workflow API
- **Data Integrity:** Used Prisma with PostgreSQL. Conflict detection is handled atomically: when a decision is recorded, the system immediately checks for diverging verdicts on the same study/stage and creates a `Conflict` record.
- **Schema Design:** Designed with a normalized `Reviewer` -> `Assignment` -> `Decision` chain to ensure multi-client isolation and robust inter-rater reliability.
- **Testing:** Implemented an in-memory Prisma mock using Node's native test runner (`node:test`). This allows the CI pipeline to run lightning-fast tests without spinning up a real database.

### 3. A1 — AI Screening Assistant (with A4 Evaluation Bonus)
- **Anti-Hallucination:** Instead of relying purely on LLM understanding, the system prompt embeds the exact inclusion/exclusion criteria and strictly limits the output to a Zod-validated JSON schema.
- **Responsible-AI Auditing:** Implemented a file-based logger (`logger.js`) that captures the *exact* model version, prompt, and latency for every decision.
- **Evaluation Harness (A4 bonus):** Added an evaluation script that calculates the Precision, Recall, and Confusion Matrix of the AI model against the ground-truth mock data.

---

## Questions Answered

| Folder | Track | Question |
|--------|-------|---------|
| [`/F1`](./F1) | Frontend | F1 — Study Screener Interface |
| [`/B4`](./B4) | Backend & APIs | B4 — Screening Workflow API |
| [`/A1`](./A1) | AI Integration | A1 — Abstract Screening Assistant |

---

## Prerequisites

- **Node 18+** and **npm**
- **PostgreSQL** (for B4 — or use the included `docker-compose.yml`)
- **OpenAI API key** (for A1 — or run in mock mode, see `/A1/README.md`)

---

## Running Each Solution

### F1 — Study Screener Interface
```bash
cd F1
npm install
npm run dev
# → http://localhost:5173
```

### B4 — Screening Workflow API
```bash
cd B4
cp .env.example .env          # fill in DATABASE_URL
docker-compose up -d          # optional: spin up local Postgres
npm install
npx prisma migrate dev --name init
npm start
# → http://localhost:3000
```

### A1 — Abstract Screening Assistant
```bash
cd A1
cp .env.example .env          # add OPENAI_API_KEY (or leave blank for mock mode)
npm install
node src/index.js
```

---

## Mock Data

All generated datasets are clearly labelled with `.mock.` in their filename:
- `F1/src/data/studies.mock.json` — 50 synthetic research studies
- `A1/data/abstracts.mock.json` — 20 synthetic abstracts
- `A1/data/criteria.mock.json` — inclusion/exclusion criteria
