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
- `src/data/*.json` — core static data scaffold.
- `src/data/questions/people/**` — per-enabler question banks for People domain (one JSON file per enabler).
- `src/site-config.js` — site copy and donation link placeholders.

## Question Generation Workflow
- Author and edit questions per enabler in `src/data/questions/<domain>/<taskId>/<enablerId>.json`.
- Keep `src/data/questions.json` as the merged view used by the app; do not hand-edit it for People-domain enabler questions.
- Run `npm run generate:questions` to merge per-enabler files back into `src/data/questions.json` after editing.

## Definition of Done (current phase)
- Data utility/hook exists and is used by Home to render JSON.
- Settings page wired to actual zustand stores with export/import buttons functioning.
- Build passes (`npm run build`) and static deploy configs remain valid.

## Standards for questions
- Follow PMP Exam Content Outline rigorously.
- Use clear, concise language; avoid ambiguity.
- Ensure all questions have one correct answer and plausible distractors.
- Ensure questions are all tagged with domain, task, process, knowledge area, and enabler IDs.
- Ensure that all questions are scenario based  
    - Avoid simple recall questions; focus on application and analysis.
- Ensure that questions vary in difficulty level (easy, medium, hard) to reflect the exam's range.
- Ensure that questions are free from bias and culturally sensitive.
- Ensure that question distractors are the same length as the correct answer.
- Ensure that each explanation clearly states why the correct option is best and why each incorrect option is not appropriate.
- Ensure that for every enabler ID in `src/data/enablers.json`, exactly 25 questions are authored that reference that enabler in `enablerIds` (per-question coverage target is 25 per enabler).
- Commit and push to github frequently with clear, descriptive messages.
