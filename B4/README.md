# B4 — Screening Workflow API

**Track:** Backend & APIs | **Question:** B4  
**Stack:** Node.js + Express + Prisma + PostgreSQL

---

## Running

```bash
# 1. Start PostgreSQL (optional — skip if you have a DB already)
docker-compose up -d

# 2. Copy env and fill in your DATABASE_URL
cp .env.example .env

# 3. Install dependencies and run migrations
npm install
npx prisma migrate dev --name init
npx prisma generate

# 4. Start the API
npm start
# → http://localhost:3000
```

---

## Data Model

### Overview

```
Study ──< Assignment >── Reviewer
                │
                └── Decision
                        │
                    Conflict ──> resolvedBy (Reviewer)
```

### Models

| Model | Purpose |
|-------|---------|
| **Study** | A research paper to be screened. Unique on `doi`. |
| **Reviewer** | A person who screens studies. Role: `REVIEWER` / `LEAD` / `ADMIN`. |
| **Assignment** | Links a study to a reviewer for a stage (`TITLE_ABSTRACT` or `FULL_TEXT`). Unique per `(studyId, reviewerId, stage)`. |
| **Decision** | A verdict (`INCLUDE` / `EXCLUDE` / `UNCERTAIN`) for an assignment. Optional free-text note. |
| **Conflict** | Created automatically when two decisions on the same study disagree. Resolved by a `LEAD` or `ADMIN` reviewer. |

### Two-Stage Screening Workflow

1. Studies are imported and stored in the `Study` table.
2. Assignments are created for each study × reviewer × stage (at minimum 2 reviewers per study for inter-rater reliability).
3. Reviewers record their `Decision` via `POST /decisions`.
4. If two decisions disagree → a `Conflict` is created automatically.
5. A LEAD reviewer resolves the conflict via `POST /conflicts/:id/resolve`.
6. Final decisions are exported via `GET /export/csv`.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/studies` | Create a study (idempotent on DOI) |
| `GET`  | `/studies` | List all studies with their decisions |
| `GET`  | `/studies/:id` | Get a single study |
| `POST` | `/assignments` | Assign studies to a reviewer |
| `GET`  | `/assignments/:reviewerId/pending` | Fetch unreviewed assignments |
| `POST` | `/decisions` | Record a decision (triggers conflict detection) |
| `GET`  | `/decisions/:assignmentId` | Get the decision for an assignment |
| `GET`  | `/conflicts` | List unresolved conflicts |
| `POST` | `/conflicts/:id/resolve` | Resolve a conflict (LEAD/ADMIN only) |
| `GET`  | `/export/csv?stage=TITLE_ABSTRACT` | Export final decisions as CSV |
| `GET`  | `/health` | Health check |

### Example: Record a Decision

```bash
curl -X POST http://localhost:3000/decisions \
  -H "Content-Type: application/json" \
  -d '{"assignmentId": "clxxx", "verdict": "INCLUDE", "note": "Meets criteria 1, 2, 3"}'
```

### Example: Export CSV

```bash
curl "http://localhost:3000/export/csv?stage=TITLE_ABSTRACT" -o decisions.csv
```

---

## Conflict Detection Logic

When a decision is recorded:
1. All other decisions for the same `(studyId, stage)` are fetched.
2. If any differ in verdict → a `Conflict` row is upserted.
3. The conflict stores both decision IDs and the study ID.
4. A `LEAD` reviewer can resolve it, writing the final `resolvedVerdict`.

The CSV export uses the following precedence for `final_verdict`:
1. Resolved conflict verdict (if present)
2. Consensus verdict (all reviewers agreed)
3. `CONFLICT` (if unresolved disagreement)
4. `PENDING` (not enough decisions yet)

---

## Tests

```bash
npm test
```

Tests are in `src/__tests__/` and use Node's built-in `node:test` runner.

---

## What I Would Improve With More Time

- **Authentication middleware** — protect routes with JWT; extract `reviewerId` from token rather than request body (prevents impersonation)
- **Batch assignment algorithm** — automatically assign studies across reviewers to balance workload and ensure every study gets ≥2 reviewers
- **Webhooks / SSE** — notify reviewers in real-time when they receive new assignments or a conflict is resolved
