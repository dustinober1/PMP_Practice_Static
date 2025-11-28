                                            # CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **static React application** for Project Management Professional (PMP) exam preparation. The application is built with a zero-cost architecture using React + Vite + Tailwind CSS, with all data stored in static JSON files and state persisted to localStorage.

## Core Technology Stack

- **React 19.2.0** with JSX for component-based UI
- **Vite 7.2.4** as build tool and dev server
- **Tailwind CSS 3.4.14** with custom color system and WCAG AA contrast compliance
- **React Router DOM 7.9.6** for client-side routing
- **Zustand 5.0.8** for state management with localStorage persistence
- **Python AI/ML stack** for content generation (ChromaDB, Anthropic SDK, Ollama, PyPDF)

## Common Development Commands

### Basic Development
```bash
npm install              # Install dependencies
npm run dev             # Start development server (localhost:5173)
npm run build           # Production build
npm run preview         # Preview production build locally
npm run lint            # Run ESLint
```

### AI Content Generation
```bash
npm run generate:definitions      # Extract definitions from PDFs using AI
npm run generate:flashcards       # Generate and merge flashcards
npm run vectorize                 # Create vector embeddings for RAG
npm run vectorize:full           # Full vectorization of all content
```

### Content Management
```bash
npm run generate:flashcards:validate   # Validate flashcard format
npm run generate:flashcards:merge      # Merge generated flashcards
npm run format:definitions            # Format extracted definitions
```

## Architecture & Key Patterns

### State Management
Uses **Zustand stores** with localStorage persistence:
- `useUserStore.js` - User preferences, theme, donation codes
- `useProgressStore.js` - Study progress and tracking
- `useExamStore.js` - Exam state and results

All stores follow the same pattern:
```javascript
create(persist((set, get) => ({...}), { name: 'storage-key', storage: createJSONStorage(() => localStorage) }))
```

### Data Architecture
**Static JSON data** in `/src/data/`:
- `domains.json` - PMP exam domains
- `enablers.json` - Task enablers with detailed breakdowns
- `flashcards.json` - Study flashcards (400KB+ content)
- `processes.json` - Process groups
- `knowledge_areas.json` - Knowledge areas
- `tasks.json` - Specific tasks

**Reference materials** in `/references/` - raw PDFs and extracted content:
- `references/markdown/core/` - Core PMBOK content (PMBOK Guide 8th Edition)
- `references/markdown/practice-guides/` - Practice guides (Agile Practice Guide)
- `references/markdown/themes/` - Thematic content (Megatrends 2024, PMP Exam Outline 2026)
- `references/markdown/standards/` - PMI standards and frameworks

### Component Structure
- `/src/pages/` - Route components (Home, Quiz, Exam, Flashcards, Settings)
- `/src/components/` - Reusable UI components
- `/src/hooks/` - Custom React hooks
- `/src/utils/` - Utility functions (exam helpers, PDF generation)

### AI/ML Infrastructure
Python scripts handle AI content generation:
- Uses **Anthropic Claude** and **Ollama** for local models
- **ChromaDB** for vector database and RAG
- Processes PDFs with **PyPDF** and **PyMuPDF**
- Vector embeddings for semantic search
- **markitdown MCP** for PDF to markdown conversion
- **Context7 MCP** integration for documentation reference

## Development Guidelines

### Theme System
- Supports **light/dark/system** themes via `useUserStore`
- Tailwind configuration includes custom color palette
- WCAG AA contrast compliance required

### Content Generation Workflow
1. Convert PDFs to markdown: Use markitdown MCP to process PDFs in `/references/`
2. Extract definitions from PDFs: `npm run extract:definitions`
3. Format definitions: `npm run format:definitions`
4. Generate flashcards: `npm run generate:flashcards`
5. Vectorize for RAG: `npm run vectorize`
6. Load content into Context7 MCP for enhanced flashcard generation

### State Persistence
All user data persists to localStorage automatically via Zustand persistence middleware. Keys are prefixed with 'pmp-' to avoid conflicts.

### Static Site Deployment
- **Build output**: `dist/` directory
- **No server dependencies**: Fully static
- **Netlify/Vercel ready**: Configuration files included
- **Environment variables**: See `.env.example`

## Testing & Validation

Run content validation before committing:
```bash
npm run generate:flashcards:validate   # Validate flashcard structure
npm run lint                           # Code quality checks
```

Manual test scripts available in `/scripts/` for AI extraction testing.

## Key Files to Understand

### Core Application
- `src/site-config.js` - Site configuration and metadata
- `src/App.jsx` - Main application with routing
- `src/main.jsx` - Application entry point
- `vite.config.js` - Vite build configuration
- `package.json` - Dependencies and scripts

### Data & Content
- `src/data/` - Static JSON data (domains, flashcards, tasks, etc.)
- `references/` - PDF reference materials and converted markdown
- `requirements.txt` - Python AI/ML dependencies
- `prompts/flashcards.md` - Flashcard generation prompts

### Scripts & Tools
- `scripts/generate-questions.mjs` - Question generation script
- `scripts/validate-questions.mjs` - Flashcard validation script
- `src/hooks/useStaticData.js` - Data loading and management hook

## Deployment

Built for static hosting platforms:
- **Netlify**: Auto-deploys via `netlify.toml`
- **Vercel**: Auto-deploys via `vercel.json`
- Build command: `npm run build`
- Output directory: `dist`

No server, database, or API endpoints required - everything runs client-side.