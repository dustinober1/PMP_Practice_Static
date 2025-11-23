# Agents Guide

## Project Snapshot
- App: PMP Practice (Static) — React + Vite + Tailwind, client-only.
- Data: Static JSON in `src/data/` (domains, tasks, enablers, processes, knowledge areas).
- Routing: React Router; pages in `src/pages/` (Home, Settings, NotFound).
- Config: `src/site-config.js` stores site metadata and donation links.
- Deploy: Static build (`npm run build`) to `dist` for Netlify/Vercel.

## Working Conventions
- Keep everything static; no server/database. Use localStorage for user progress.
- Prefer JSON-driven UIs; add new data under `src/data/` with predictable IDs.
- Tailwind is available; keep custom CSS minimal.
- Router lives in `src/App.jsx`; add new routes/pages under `src/pages/`.
- Use ASCII-only text; keep comments minimal and purposeful.

## Commands
- Install deps: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Near-Term Tasks (from High_Level_Plan.md)
- Week 2: Add a data loading utility/hook for JSON files; keep lazy-load in mind for future large files. Confirm the homepage renders data via that utility.
- Week 3: Add zustand + middleware for user (name, theme, donations) and progress (completedQuestions, flashcardRatings, readMaterials) with localStorage persistence. Wire export/import stubs on Settings.
- Week 4+: Add `questions.json` with at least 20 samples; build QuizCard/QuizFeedback; add filtering + shuffling logic.

## Files to Know
- `src/pages/Home.jsx` — surfaces domain/task/process data for verification.
- `src/pages/Settings.jsx` — placeholder for preferences and data export/import.
- `src/data/*.json` — current static data scaffold.
- `src/site-config.js` — site copy and donation link placeholders.

## Definition of Done (current phase)
- Data utility/hook exists and is used by Home to render JSON.
- Settings page wired to actual zustand stores with export/import buttons functioning.
- Build passes (`npm run build`) and static deploy configs remain valid.
