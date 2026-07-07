# Sabi Core — Take-Home Assessment

**Candidate:** [Your Name]  
**Date:** July 2026  
**Questions answered:** F1, B4, A1

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
