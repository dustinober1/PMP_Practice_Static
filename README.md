# PMP Practice (Static)

Zero-cost PMP prep site built with React + Vite + Tailwind. Data lives in static JSON files and will be paired with local-first state (zustand + localStorage) in upcoming phases.

## Stack
- React, Vite, Tailwind CSS, React Router
- Static data in `src/data/` (domains, tasks, enablers, processes, knowledge areas)
- Config in `src/site-config.js` (site name, donation links, repo URL)

## Getting started
1) Install deps: `npm install`
2) Run dev server: `npm run dev` (default at http://localhost:5173)
3) Production build: `npm run build`
4) Preview production build: `npm run preview`

## Structure
- `src/pages/` – simple Home/Settings/NotFound routes
- `src/data/` – static JSON scaffolding to mirror the high-level plan
- `netlify.toml` / `vercel.json` – deploy config (build: `npm run build`, output: `dist`)

## Deployment
Connect the repo to Vercel or Netlify and use `npm run build` with `dist` as the publish/output directory. Everything is static; no server or database required.
