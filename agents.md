# Agents Guide

## Project Snapshot
- App: PMP Practice (Static) — React + Vite + Tailwind, client-only.
- Data: Static JSON in `src/data/` (domains, tasks, enablers, processes, knowledge areas).
- Routing: React Router; pages in `src/pages/` (Home, Settings, NotFound).
- Config: `src/site-config.js` stores site metadata and donation links.
- Deploy: Static build (`npm run build`) to `dist` for Netlify/Vercel.

## Top-Level Layout
- `index.html` entry shell used by Vite.
- `src/` React app source (components, pages, stores, hooks, data).
- `public/` static assets copied as-is to the build.
- `dist/` Vite build output (do not edit by hand).
- `scripts/` helper scripts, including question generation.
- `netlify.toml` and `vercel.json` static hosting config.
- `tailwind.config.js` and `postcss.config.js` Tailwind pipeline setup.

## src Structure
- `src/main.jsx` Vite entry; mounts React app to the DOM.
- `src/App.jsx` top-level router and layout shell.
- `src/index.css` and `src/App.css` shared styling, wired to Tailwind.
- `src/assets/` static images or icons referenced from React.

### Pages (`src/pages/`)
- `Home.jsx` reads domain/task/process data and surfaces it for verification.
- `Quiz.jsx` main quiz experience wired to questions and stores.
- `Settings.jsx` preferences, data export/import, and user settings.
- `NotFound.jsx` 404 route for unknown paths.

### Components (`src/components/`)
- `QuizCard.jsx` renders a single question, options, and selection state.
- `QuizFeedback.jsx` shows correctness, explanations, and follow-up info.
- Future shared UI (buttons, layout wrappers) should live here.

### Stores (`src/stores/`)
- `useUserStore.js` zustand store for user profile, theme, and donation prefs.
- `useProgressStore.js` zustand store for quiz and study progress.
- Both stores use localStorage persistence; prefer derived selectors in views.

### Hooks (`src/hooks/`)
- Reusable data and UI hooks belong here.
- Data-loading utilities for JSON (e.g. questions, domains) should live here.

### Config (`src/site-config.js`)
- Site metadata (title, tagline) and donation links.
- Central place for external URLs shown in the UI.

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

## Data And Questions Layout
- `src/data/domains.json` PMP domains and IDs.
- `src/data/tasks.json` tasks keyed by domain and ID.
- `src/data/enablers.json` enablers with stable IDs used by questions.
- `src/data/processes.json` PMP processes.
- `src/data/knowledge_areas.json` knowledge areas for tagging.
- `src/data/questions.json` merged question bank consumed by the app.
- `src/data/questions/` per-domain question sources, organized as:
  - `src/data/questions/<domain>/<taskId>/<enablerId>.json`
  - Example: `src/data/questions/people/people-4/e-people-4-1.json`.
- `src/data/questions_templates.json` and `src/data/questions_process_template.json` scaffolds for consistent authoring.

## Quiz Flow Overview
- Pages and components consume questions from `src/data/questions.json`.
- Progress and user prefs are read/written via zustand stores in `src/stores/`.
- LocalStorage keys and shapes should be stable; version if breaking changes.

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
- Ensure there is a balanced distribution of correct answers across options (a, b, c, d) so that no consistent pattern appears within an exam-length set of questions.
- Ensure that for every enabler ID in `src/data/enablers.json`, exactly 25 questions are authored that reference that enabler in `enablerIds` (per-question coverage target is 25 per enabler).
- Commit and push to github frequently with clear, descriptive messages.
