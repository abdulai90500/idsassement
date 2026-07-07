# F1 — Study Screener Interface

**Track:** Frontend | **Question:** F1  
**Stack:** React (JSX) + Vite

---

## Running

```bash
npm install
npm run dev
# → http://localhost:5173
```

No environment variables required.

---

## Features

| Feature | Implementation |
|---------|---------------|
| 50 mock studies | `src/data/studies.mock.json` — clearly labelled as mock |
| Persistent decisions | `localStorage` keyed by study ID via `useStudies` hook |
| Keyboard navigation | `←` `→` (or `j` `k`) to move between studies |
| Keyboard decisions | `I` include · `E` exclude · `F` flag · press again to undo |
| Filter chips | All / Undecided / Include / Exclude / Flagged |
| Progress bar | Animated, with per-status counts |
| Accessible UI | ARIA roles, `aria-pressed`, `aria-label`, `focus-visible` rings on all interactive elements |
| Responsive layout | Stacks vertically on mobile (<768px) |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` or `k` | Previous study |
| `→` or `j` | Next study |
| `I` | Toggle include |
| `E` | Toggle exclude |
| `F` | Toggle flag for discussion |

---

## Architecture

```
src/
├── App.jsx              — root layout, keyboard event listener
├── hooks/useStudies.js  — localStorage persistence, status aggregation
├── components/
│   ├── StudyList.jsx    — sidebar with filter chips
│   ├── StudyCard.jsx    — abstract reader + decision footer
│   ├── DecisionButtons.jsx — include/exclude/flag buttons
│   └── ProgressBar.jsx  — animated progress indicator
└── data/studies.mock.json — 50 synthetic research studies (MOCK DATA)
```

---

## What I Would Improve With More Time

- **Search bar** across study titles and abstracts (in-memory fuzzy search)
- **Conflict resolution view** — when two reviewers have diverging decisions, surface them in a dedicated view (maps to B4 backend)
- **Export to CSV** — button to download all decisions directly from the browser

---

## Mock Data Note

`studies.mock.json` contains 50 synthetic research studies generated for this assessment.
All studies have realistic titles, author names, years, DOIs, and abstracts drawn from publicly available medical research topics.
No real patient data is used.
