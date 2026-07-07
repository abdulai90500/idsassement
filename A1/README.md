# A1 — Abstract Screening Assistant

**Track:** AI Integration | **Question:** A1  
**Stack:** Node.js + OpenAI API (gpt-4o-mini) + Zod

---

## Running

```bash
# 1. Copy env and add your key (or leave blank for mock mode)
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Run the screener on all 20 mock abstracts
node src/index.js

# 4. Screen a single abstract by ID
node src/index.js --id abs-001
```

**Mock mode:** If `OPENAI_API_KEY` is not set (or `MOCK_MODE=true`), the screener uses a lightweight keyword heuristic instead of making real API calls. Results are labelled `(mock)` in output. The logging format is identical.

---

## Architecture

```
src/
├── screener.js   — core function: abstract + criteria → { verdict, reason, log }
├── logger.js     — responsible-AI provenance logger (writes to logs/ai_calls.jsonl)
└── index.js      — CLI demo runner with confusion matrix
data/
├── abstracts.mock.json  — 20 synthetic abstracts with ground-truth verdicts (MOCK DATA)
└── criteria.mock.json   — inclusion/exclusion criteria (MOCK DATA)
logs/
└── ai_calls.jsonl       — audit log (auto-created; gitignored)
```

---

## Core Function

```js
screenAbstract(abstract, criteria, abstractId?)
  → { verdict: 'include' | 'exclude' | 'uncertain', reason: string, isMock: boolean, log: Object }
```

`criteria` must be `{ inclusion: string[], exclusion: string[] }`.  
The function is safe to call concurrently.

---

## Responsible-AI Logging

Every call writes one JSON line to `logs/ai_calls.jsonl`:

```json
{
  "timestamp": "2026-07-07T19:00:00.000Z",
  "abstractId": "abs-001",
  "model": "gpt-4o-mini",
  "modelVersion": "gpt-4o-mini",
  "prompt": "[SYSTEM]\n...[USER]\n...",
  "rawResponse": "{\"verdict\":\"include\",\"reason\":\"...\"}",
  "verdict": "include",
  "reason": "The abstract reports a clinical health intervention...",
  "latencyMs": 843,
  "isMock": false,
  "validationPassed": true
}
```

This log captures the **exact model, version, and prompt** used for every call, satisfying Sabi Core's responsible-AI audit requirements.

---

## Anti-Hallucination Measures

1. **System prompt embeds criteria verbatim** — the model is told: *"You MUST NOT reference or invent any criteria not listed below."*
2. **Temperature = 0** — deterministic output for reproducibility.
3. **`response_format: json_object`** — enforces structured output, prevents prose leaking outside JSON.
4. **Zod schema validation** — the parsed response is validated against `{ verdict: enum, reason: string }` before use.
5. **Post-hoc reason audit** — key terms in the reason are checked against the criteria text; suspicious terms are logged as warnings.

---

## Mock Data

- `abstracts.mock.json` — 20 abstracts: 12 health-related (expected `include`), 7 clearly off-topic (expected `exclude`), 1 ambiguous (expected `uncertain`)
- `criteria.mock.json` — inclusion/exclusion criteria for a health intervention systematic review

---

## What I Would Improve With More Time

- **Retry with exponential backoff** — the current implementation fails fast on API errors; production should retry transient 429/500 errors with jitter
- **Prompt versioning** — store a hash of the system prompt in the log so changes to the prompt can be detected during audits
- **Batch embedding** — for large corpora, process abstracts in parallel batches respecting OpenAI rate limits rather than one-by-one