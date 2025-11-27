# Repository Guidelines

Contributor quickstart for the static PMP prep site; keep changes lean and reproducible.

## Project Structure & Module Organization
- App lives in `src/` with route components in `src/pages/`, shared UI in `src/components/`, hooks in `src/hooks/`, zustand stores in `src/stores/`, and static JSON content in `src/data/`.
- Content pipelines live in `scripts/`; skip hand-edits to `dist/` and merged data outputs.
- Reference PDFs/manual banks are in `data/reference/` and `references/`; they feed scripts, not builds.

## Build, Test, and Development Commands
- Setup/run: `npm install`; `npm run dev` (http://localhost:5173)
- Build/preview: `npm run build` → `dist/`; `npm run preview`
- Lint: `npm run lint`
- Data: `npm run generate:questions`
- Flashcards: `npm run generate:flashcards:ai`; `npm run generate:flashcards:validate`; `npm run generate:flashcards`
- Definitions from PDFs: `npm run generate:definitions` (Ollama by default; Anthropic when configured)

## Coding Style & Naming Conventions
- ESM React 19 with Tailwind; prefer function components and hooks over classes.
- 2-space indent, semicolon-free, single quotes; keep imports ordered by group.
- Name hooks with `use*`, stores with `use*Store`, and keep data IDs stable (`e-<domain>-<task>-<index>`).
- Follow ESLint defaults (`eslint.config.js`); fix warnings before committing.

## Testing Guidelines
- No automated tests; run `npm run lint` and click through Home → Quiz/Exam/Flashcards → Settings while on `npm run dev`.
- For content changes, run `npm run generate:flashcards:validate` + `npm run generate:questions`, and scan merged JSON for missing or duplicate IDs.

## Data & Content Workflows
- Author questions in `src/data/questions/<domain>/<task>/<enabler>.json`; regenerate `questions.json` via `npm run generate:questions` rather than editing it.
- Author flashcards in `src/data/flashcards-source/<domain>/<task>/<enabler>.json`; validate and merge with `npm run generate:flashcards`.
- Leave `.flashcard-generation-state.json` and `data-extraction/` artifacts uncommitted unless intentionally updating sources.

## Commit & Pull Request Guidelines
- Use short, imperative messages (e.g., `add flashcard validator fix`, `docs: update quiz flow`) and keep scope focused.
- PRs should note intent, key changes, and commands run; include before/after screenshots or GIFs for UI tweaks.
- Call out data regeneration (questions/flashcards/definitions) and any dependency changes; avoid bundling unrelated refactors.

## Security & Configuration
- Keep API keys and models in `.env`; never commit secrets. Ollama defaults are local—set `USE_OLLAMA=false` + `ANTHROPIC_API_KEY` to switch to Anthropic.
- Avoid editing `dist/` or `node_modules/`; coordinate changes to `netlify.toml` and `vercel.json`.
