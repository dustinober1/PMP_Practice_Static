# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PMP Practice (Static)** is a zero-cost PMP exam prep application built with React, Vite, and Tailwind CSS. The app is entirely client-side with no server or database—all data is static JSON files in `src/data/`, and user progress is persisted locally via zustand + localStorage.

**Modern Design & Accessibility**: The UI features a professional dark theme, responsive mobile navigation, and WCAG 2.1 Level AA accessibility compliance. All interactions are keyboard accessible, screen reader compatible, and support system dark mode preferences.

**AI-Powered Content Generation**: The app includes workflows for:
- Extracting PMP terminology and definitions from reference PDFs using AI vision
- Generating scenario-based practice questions per enabler
- Creating flashcards with difficulty distribution
- Building exam simulators with timed sessions

See `QWEN.md` for project context and recent updates.
See `docs/FLASHCARD_DEFINITIONS.md` for AI-powered definition extraction from PDFs.
See `docs/RUNNING_EXTRACTION.md` for executing definition extraction workflows.

## Quick Start Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run dev server (port 5173) | `npm run dev` |
| Build for production | `npm run build` |
| Lint code | `npm run lint` |
| Preview production build | `npm run preview` |
| Merge per-enabler questions into main bank | `npm run generate:questions` |
| Generate flashcards with AI (all enablers) | `npm run generate:flashcards:ai` |
| Generate flashcards for single enabler | `npm run generate:flashcards:ai -- --enabler=e-people-1-1` |
| Validate flashcard source files | `npm run generate:flashcards:validate` |
| Merge flashcard source files into domain files | `npm run generate:flashcards:merge` |
| Validate and merge flashcards (full workflow) | `npm run generate:flashcards` |
| Extract definitions from reference PDFs (priority docs) | `npm run extract:definitions` |
| Format extracted definitions into flashcards | `npm run format:definitions` |
| Extract + format definitions (full workflow) | `npm run generate:definitions` |

## Key Project Structure

```
src/
├── App.jsx                    # Top-level router and theme management
├── main.jsx                   # Vite entry point
├── pages/
│   ├── Home.jsx              # Homepage; displays domain/task data
│   ├── Quiz.jsx              # Main quiz experience
│   ├── Exam.jsx              # Full exam simulator with timer
│   ├── Flashcards.jsx        # Flashcard study mode
│   ├── Settings.jsx          # User preferences, data export/import
│   └── NotFound.jsx          # 404 fallback
├── components/
│   ├── Button.jsx            # Reusable button (primary, secondary, ghost)
│   ├── Card.jsx              # Semantic card with animations
│   ├── Input.jsx             # Form input with labels, errors, ARIA
│   ├── Select.jsx            # Dropdown with keyboard navigation
│   ├── Badge.jsx             # Status badges (5 variants)
│   ├── LoadingSpinner.jsx    # Accessible loading indicator
│   ├── Toast.jsx             # Auto-dismissing notifications
│   ├── Skeleton.jsx          # Loading state placeholders
│   ├── Navigation.jsx        # Mobile hamburger menu + desktop nav
│   ├── Modal.jsx             # Accessible modal dialogs
│   ├── QuizCard.jsx          # Single question + options + selection (dark mode)
│   ├── QuizFeedback.jsx      # Correctness feedback + explanation (dark mode)
│   ├── ExamTimer.jsx         # Exam countdown timer
│   ├── ExamNavigator.jsx     # Exam question navigation
│   ├── ExamProgress.jsx      # Exam completion progress
│   ├── FlashcardCard.jsx     # Flashcard display with flip animation
│   ├── FlashcardFilters.jsx  # Flashcard filtering controls
│   └── FlashcardProgress.jsx # Flashcard study progress
├── stores/
│   ├── useUserStore.js       # User profile, theme, donations (persisted)
│   └── useProgressStore.js   # Quiz/exam/flashcard progress (persisted)
├── hooks/
│   └── useStaticData.js      # Data loader with caching and flashcard merging
├── data/
│   ├── domains.json          # PMP domains
│   ├── tasks.json            # Tasks keyed by domain
│   ├── enablers.json         # Enablers with stable IDs
│   ├── processes.json        # PMP processes
│   ├── knowledge_areas.json  # Knowledge area tags
│   ├── questions.json        # Merged question bank (generated)
│   ├── questions/            # Per-enabler question source files
│   │   └── <domain>/<taskId>/*.json  # e.g., people/people-4/e-people-4-1.json
│   ├── flashcards/           # Flashcard data by domain (generated)
│   │   ├── people.json       # People domain flashcards (merged)
│   │   ├── process.json      # Process domain flashcards (merged)
│   │   └── business.json     # Business domain flashcards (merged)
│   ├── flashcards-source/    # Per-enabler flashcard source files
│   │   ├── people/           # People domain source files
│   │   │   └── <taskId>/<enablerId>.json  # e.g., people-1/e-people-1-1.json
│   │   ├── process/          # Process domain source files
│   │   └── business/         # Business domain source files
│   └── questions_templates.json   # Scaffolds for consistent authoring
├── assets/                   # Static images/icons referenced from React
└── site-config.js            # Site metadata, donation links

scripts/
├── generate-questions.mjs              # Question bank generation script
├── generate-flashcards-ai.mjs          # AI flashcard generation (Ollama)
├── generate-flashcards-merge.mjs       # Merge flashcard sources into domain files
├── validate-flashcards.mjs             # Validate flashcard source files
├── extract-definitions-ai.mjs          # Extract PMP definitions from reference PDFs
├── format-definition-flashcards.mjs    # Format extracted definitions into flashcards
├── extract-pdf-page-by-page.mjs        # PDF to images converter
├── extract_2026_structure.py           # Extract 2026 exam structure from PDF
├── generate_2026_files.py              # Generate 2026 structure JSON files
├── pdf_to_flashcards_agent.py          # PDF processing agent using Claude vision
└── test-extraction.mjs                 # Test extraction workflows

references/                   # Source PDFs for definition extraction
├── AgilePracticeGuide.pdf
├── AI Essentials for Project Professionals.pdf
└── ...

data-extraction/             # Extracted data output directory
├── definitions-raw/         # Raw extracted definitions from PDFs
└── definitions-formatted/   # Formatted definitions as flashcards

data/
├── reference/              # Auxiliary reference data (not bundled into app)
│   ├── exam-outline/2026_structure.json    # 2026 PMP exam structure
│   ├── flashcards/                        # Manual/curated flashcard banks
│   └── extracted/                         # Raw text notes from PDFs
└── ...

public/                      # Static assets copied to build
├── favicon.ico
└── ...

dist/                        # Vite build output (do not edit)
```

## Critical Concepts

### Data Flow

1. **Static Data**: All data lives in `src/data/*.json`. Vite imports these as ES modules (not fetched at runtime).
2. **Question Generation**: Author questions per-enabler in `src/data/questions/<domain>/<taskId>/<enablerId>.json`, then run `npm run generate:questions` to merge them into the main bank. **Do not hand-edit the merged questions file.**
3. **Flashcard Generation**: Generate flashcards per-enabler using AI in `src/data/flashcards-source/<domain>/<taskId>/<enablerId>.json`, then run `npm run generate:flashcards` to validate and merge them into domain files. **Do not hand-edit the merged flashcard files.**
4. **User State**: `useUserStore` (profile, theme, donations) and `useProgressStore` (quiz, exam, flashcard progress) store data in localStorage. Both use zustand with versioning; bump version if breaking changes occur.

### Routing

All routes are defined in `src/App.jsx`. Add new pages by:
1. Creating a file in `src/pages/<PageName>.jsx`
2. Adding a `<Route>` element to `<Routes>` in App.jsx

### Styling & Design System

- **Tailwind CSS** is configured with a custom theme (see `tailwind.config.js`):
  - Zinc-based dark palette (zinc-950, zinc-900, zinc-800)
  - WCAG AA compliant contrast ratios (4.5:1 minimum)
  - Custom animations, shadows, and spacing
  - `darkMode: 'class'` strategy for theme switching
- **Dark Mode**: Automatically detects system preference or can be set manually in Settings
  - All components include `dark:` Tailwind variants
  - Smooth 300ms transitions between themes
  - CSS custom properties for dynamic colors
- **Component Library**: Use reusable components in `src/components/`:
  - `<Button>` - Primary/secondary/ghost variants
  - `<Card>` - Semantic HTML with hover animations
  - `<Input>` - Accessible form inputs
  - `<Select>` - Keyboard-accessible dropdowns
  - `<Badge>` - Status badges with 5 variants
  - `<Toast>` - Notification system
  - All components include dark mode and accessibility built-in
- **Global Styles**: Entry points are `src/index.css` and `src/App.css`
  - CSS variables for theme colors
  - Utilities for focus rings, transitions, and sr-only text
  - Support for reduced motion preference

### Accessibility (WCAG 2.1 Level AA)

The application is fully accessible and compliant with WCAG 2.1 Level AA standards:

- **Semantic HTML**: Proper use of `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`
- **Keyboard Navigation**: All interactive elements are keyboard accessible via Tab, Enter, Space, and Escape
- **Screen Readers**: ARIA labels, live regions, and screen-reader-only text (`.sr-only` class)
- **Color Contrast**: All text meets 4.5:1 contrast minimum in both light and dark modes
- **Focus Management**: Visible focus indicators (2px sky-colored outline) on all focusable elements
- **Touch Targets**: Minimum 44×44px for mobile controls
- **Reduced Motion**: Respects `prefers-reduced-motion` system setting

**Testing**: See `ACCESSIBILITY.md` for complete testing procedures, tools, and screen reader instructions.

### Data Loading

The `useStaticData()` hook in `src/hooks/useStaticData.js` loads all JSON data asynchronously with caching:
- Returns `{ data, loading, error }` state object
- Data keys: `domains`, `tasks`, `enablers`, `processes`, `knowledgeAreas`, `questions`, `flashcards`
- Flashcards are merged from three domain-specific files (`people.json`, `process.json`, `business.json`) into a single array
- Cache is in-memory; cleared only on page reload

Example usage:
```jsx
const { data, loading, error } = useStaticData()
if (loading) return <div>Loading...</div>
if (error) return <div>Error: {error.message}</div>
return <div>{data.domains.length} domains loaded</div>
```

## Definition & Terminology Extraction

The project includes AI-powered workflows to extract PMP terminology and definitions from reference PDFs using vision models.

### Setup

**Choose Your AI Provider**:

- **Ollama (Recommended - Free & Local)**:
  ```bash
  # Install Ollama from https://ollama.ai
  ollama pull llama3.2-vision:11b
  ollama serve  # In one terminal
  ```

- **Anthropic Claude (Cloud - Paid)**:
  ```bash
  # Create .env file
  echo "USE_OLLAMA=false" > .env
  echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
  ```

### Definition Extraction Workflow

**Extract from Priority Documents** (PMBOK, Agile Guide, 2026 Outline, BA Guide):
```bash
npm run extract:definitions
```

**Format Extracted Definitions as Flashcards**:
```bash
npm run format:definitions
```

**Full Workflow** (extract + format):
```bash
npm run generate:definitions
```

**Test Single PDF**:
```bash
node scripts/test-extraction.mjs
```

### Output Locations

- **Raw Definitions**: `data-extraction/definitions-raw/` — Term/definition pairs extracted from PDFs
- **Formatted Flashcards**: `data-extraction/definitions-formatted/` — Ready-to-import flashcard JSON
- **Reference Data**: `data/reference/extracted/` — Additional auxiliary extracts

### Key Scripts

- **`scripts/extract-definitions-ai.mjs`**: Extracts definitions from PDFs using vision
  - Supports Ollama or Anthropic Claude
  - Processes multiple PDFs in sequence
  - Generates structured term/definition pairs

- **`scripts/format-definition-flashcards.mjs`**: Converts raw definitions to flashcard format
  - Validates term/definition structure
  - Generates flashcard metadata
  - Groups by source document

- **`scripts/extract-pdf-page-by-page.mjs`**: Converts PDF pages to PNG images for vision processing

## Question Authoring & Data

**Structure**: Questions are organized per-enabler with 25 questions per enabler (scalable).

**Format**: Scenario-based questions with realistic PMP contexts; 4 distractors with similar plausibility.

**Workflow**:
1. Edit `src/data/questions/<domain>/<taskId>/<enablerId>.json`
2. Run `npm run generate:questions` to rebuild the main questions bank
3. The app automatically loads from the merged `src/data/questions.json`

**Note**: `src/data/questions.json` is generated; do not edit it by hand. Edit per-enabler files and run `npm run generate:questions`.

## Flashcard Generation with AI

**Overview**: The app includes AI-powered flashcard generation using Ollama to create 100 flashcards per enabler (13,000 total across all 130 enablers).

### Prerequisites

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Pull the model**: Run `ollama pull gpt-oss:20b` (or use a different model)

### Flashcard Generation Workflow

**Generate Flashcards**:
```bash
# Test single enabler
npm run generate:flashcards:ai -- --enabler=e-people-1-1

# Generate all enablers (takes 6-11 hours with gpt-oss:20b)
npm run generate:flashcards:ai

# Resume from interruption
npm run generate:flashcards:ai -- --resume

# Use different model
FLASHCARDS_MODEL=llama3.1:8b npm run generate:flashcards:ai
```

**Validate and Merge**:
```bash
# Validate all source files
npm run generate:flashcards:validate

# Merge source files into domain files
npm run generate:flashcards:merge

# Validate + merge (full workflow)
npm run generate:flashcards
```

### Flashcard Data Structure

**Source Files** (`src/data/flashcards-source/<domain>/<task>/<enabler>.json`):
```json
[
  {
    "front": "What is progressive elaboration?",
    "back": "The iterative process of continuously improving and detailing a plan as more information becomes available.",
    "tags": ["planning", "iterative"],
    "difficulty": "easy"
  }
]
```

**Merged Files** (`src/data/flashcards/<domain>.json`):
```json
[
  {
    "id": "fc-people-1-1-001",
    "domainId": "people",
    "taskId": "people-1",
    "type": "concept",
    "front": "What is progressive elaboration?",
    "back": "The iterative process of continuously improving...",
    "tags": ["planning", "iterative"],
    "difficulty": "easy"
  }
]
```

### Quality Standards

- **Quantity**: Exactly 100 cards per enabler
- **Difficulty Distribution**: 50 easy, 30 medium, 20 hard (±5 tolerance)
- **Content**:
  - Front: 10-200 characters, clear question format
  - Back: 10-500 characters, 1-3 sentences
  - Tags: 1-3 lowercase, hyphen-separated tags
- **No Duplicates**: Within each enabler
- **PMBOK Aligned**: All content follows PMBOK 7th Edition

### Scripts

- **`scripts/generate-flashcards-ai.mjs`**: AI generation using Ollama
  - Context-enriched prompts with domain/task/enabler info
  - Comprehensive validation
  - State persistence with resume capability
  - Progress tracking with ETA

- **`scripts/generate-flashcards-merge.mjs`**: Merge source files into domain files
  - Adds metadata (id, domainId, taskId, type)
  - Preserves manually created cards
  - Generates 4-segment IDs (e.g., `fc-people-1-1-001`)

- **`scripts/validate-flashcards.mjs`**: Validate source files
  - Checks card count, difficulty distribution
  - Validates field requirements and formats
  - Generates detailed validation reports

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Model not found | Run `ollama pull gpt-oss:20b` |
| Generation too slow | Use faster model: `FLASHCARDS_MODEL=llama3.1:8b` |
| Validation errors | Regenerate failed enabler: `npm run generate:flashcards:ai -- --enabler=e-xxx` |
| State file corrupt | Delete `.flashcard-generation-state.json` and restart |

**Note**: Generated flashcard files in `src/data/flashcards/` should not be edited manually. Always edit source files in `src/data/flashcards-source/` and run the merge script.

## Reusable Component Library

All UI components are in `src/components/` and support dark mode by default. When building features:

### Button Component
```jsx
import Button from '../components/Button'

<Button variant="primary">Click Me</Button>
<Button variant="secondary" size="sm">Small Button</Button>
<Button variant="ghost">Ghost Button</Button>
<Button fullWidth onClick={handleClick}>Full Width</Button>
```
Props: `variant` (primary|secondary|ghost), `size` (sm|md|lg), `disabled`, `fullWidth`, `ariaLabel`, `className`

### Card Component
```jsx
import Card from '../components/Card'

<Card as="article" hoverable>
  <h2>Card Title</h2>
  <p>Card content here</p>
</Card>
```
Props: `as` (article|section|div), `hoverable`, `animated`, `className`

### Form Components
```jsx
import Input from '../components/Input'
import Select from '../components/Select'

<Input
  id="name"
  label="Your Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
  required
/>

<Select
  id="domain"
  label="Select Domain"
  value={domain}
  onChange={(e) => setDomain(e.target.value)}
  options={[{ value: 'people', label: 'People' }]}
/>
```

### Other Utilities
```jsx
import Badge from '../components/Badge'
import Toast from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import Skeleton from '../components/Skeleton'
import Modal from '../components/Modal'

<Badge variant="success">Passed</Badge>
<Toast message="Action completed!" type="success" />
<LoadingSpinner size="md" label="Loading..." />
<Skeleton count={3} height="h-6" />

<Modal isOpen={isOpen} onClose={handleClose}>
  <h2>Modal Title</h2>
  <p>Modal content</p>
</Modal>
```

All components automatically support:
- Dark mode variants
- ARIA attributes for accessibility
- Keyboard navigation
- Smooth transitions (300ms)

## Deployment & Build

- **Build output**: `dist/` (do not edit by hand)
- **Static hosting**: Configured for Netlify (`netlify.toml`) and Vercel (`vercel.json`)
- **Deploy**: Push to main → Netlify/Vercel auto-builds with `npm run build` and serves `dist`

## Development Tips

### Adding a New Feature

1. **Page**: Create `src/pages/FeatureName.jsx`, add route to `App.jsx`
2. **Component**: Create `src/components/ComponentName.jsx`, import into page or other components
3. **State**: Use `useUserStore` (profile, theme, donations) or `useProgressStore` (quiz, exam, flashcard progress) for persistent data; local state via `useState` for transient UI state
4. **Data**: For new static data, add JSON to `src/data/` and update loaders in `src/hooks/useStaticData.js`

### Debugging

- Dev server runs on `http://localhost:5173`
- Check browser console for runtime errors
- Use React DevTools to inspect component state and zustand store snapshots
- localStorage keys: `pmp-user`, `pmp-progress`

### Dark Mode & Theme

The application supports three theme modes (managed in `useUserStore`):
1. **Light** - White backgrounds with dark text
2. **Dark** - Zinc-950 backgrounds with light text
3. **System** - Follows OS preference (default)

Theme is applied via CSS classes on the `<html>` element and synced automatically in `src/App.jsx`. All components include `dark:` Tailwind variants for seamless theme switching.

To test:
```bash
npm run dev
# Visit Settings page, toggle theme selector
# Changes apply instantly with smooth transitions
```

### Responsive Design

The app is mobile-first and fully responsive:
- **Mobile** (< 640px): Hamburger menu, stacked layout
- **Tablet** (640px - 1024px): 2-column grids, optimized spacing
- **Desktop** (1024px+): Full navigation, 3-column grids

Test with Chrome DevTools responsive mode:
```bash
F12  # Open DevTools
Ctrl+Shift+M  # Toggle device toolbar
# Test at 375px, 768px, 1024px widths
```

### Linting

Run `npm run lint` to check for ESLint violations (no auto-fix configured). Fix issues manually before committing.

## Adding Features with Components

When building new features, always use the reusable component library:

### Example: Adding a Form Page
```jsx
import { useState } from 'react'
import Card from '../components/Card'
import Input from '../components/Input'
import Select from '../components/Select'
import Button from '../components/Button'
import Toast from '../components/Toast'

export default function MyForm() {
  const [formData, setFormData] = useState({})
  const [toast, setToast] = useState(null)

  const handleSubmit = () => {
    // Your logic here
    setToast({ type: 'success', message: 'Saved successfully!' })
  }

  return (
    <div className="space-y-6">
      <Card as="section">
        <h2 className="text-2xl font-bold mb-4 dark:text-zinc-50">My Form</h2>

        <Input
          id="name"
          label="Name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <Select
          id="domain"
          label="Domain"
          value={formData.domain || ''}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          options={[{ value: 'people', label: 'People' }]}
        />

        <Button onClick={handleSubmit} fullWidth>Submit</Button>
      </Card>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
```

Key points:
- Import components from `src/components/`
- Use `Card` for content containers
- Use `Input`/`Select` for forms
- Use `Button` for actions
- All components automatically support dark mode
- Always include labels for form inputs (accessibility)
- Use `Toast` for user feedback

## Git Conventions

- Commit frequently with clear, descriptive messages
- Reference the enabler/task/domain when adding or updating questions
- Use conventional commit prefixes when relevant: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Update component usage examples if modifying component APIs

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Questions not appearing | Run `npm run generate:questions` to rebuild the merged bank |
| Data won't load | Check browser console for JSON import errors; verify file paths in `src/data/` |
| localStorage corrupted | Clear `pmp-user` and `pmp-progress` keys manually in DevTools |
| Build fails | Ensure `npm install` is run; check `npm run lint` output for syntax errors |
| Dark mode not working | Check that `<html>` element has `class="dark"` in DevTools Inspector |
| Dark mode not persisting | Verify localStorage is enabled; check `pmp-user` key contains `"theme":"dark"` |
| Component styling wrong | Ensure you're using `dark:` classes for dark mode; check Tailwind config loaded |
| Focus ring not visible | Verify `.focus-ring` class is applied; check CSS in DevTools Inspector |
| Animations not smooth | Check for `prefers-reduced-motion` system setting; animations respect this preference |

## Key Architecture Patterns

### Data Generation Pipeline

The project has three separate data generation workflows:

1. **Questions** → Scenario-based practice questions per enabler
   - Source: `src/data/questions/<domain>/<taskId>/<enablerId>.json` (hand-authored)
   - Merge: `npm run generate:questions`
   - Output: `src/data/questions.json` (bundled into app)

2. **Flashcards** → Concept mastery cards per enabler
   - Source: `src/data/flashcards-source/<domain>/<taskId>/<enablerId>.json` (AI or manual)
   - Validate & Merge: `npm run generate:flashcards`
   - Output: `src/data/flashcards/<domain>.json` (bundled into app)

3. **Definitions** → Terminology flashcards from reference PDFs
   - Source: Reference PDF files in `references/`
   - Extract: `npm run extract:definitions`
   - Format: `npm run format:definitions`
   - Output: `data-extraction/definitions-formatted/` (auxiliary, not bundled)

**Key Rule**: Only edit source files. Generated files in `src/data/questions.json` and `src/data/flashcards/*.json` are overwritten by scripts.

### State Management Pattern

Two persistent stores (zustand + localStorage):

- **`useUserStore`**: User preferences, theme, donations (key: `pmp-user`)
- **`useProgressStore`**: Quiz, exam, flashcard progress (key: `pmp-progress`)

Both stores have versioning; increment version if breaking changes occur to trigger localStorage reset.

## Files to Know

### Documentation
- `QWEN.md` — project context and recent updates
- `CLAUDE.md` — this file; guidance for working in the codebase
- `docs/FLASHCARD_DEFINITIONS.md` — AI-powered definition extraction setup and usage
- `docs/RUNNING_EXTRACTION.md` — step-by-step extraction workflow instructions
- `README.md` — quick project overview

### Configuration & Data
- `tailwind.config.js` — Tailwind theme with dark mode, WCAG-compliant colors
- `vite.config.js` — Vite build configuration
- `eslint.config.js` — ESLint rules for project
- `src/site-config.js` — site name, tagline, donation links
- `src/data/enablers.json` — canonical PMP enabler IDs (source of truth)
- `src/data/questions_templates.json` — template structure for new questions

### Core Application Files
- `src/App.jsx` — top-level router, theme management, global layout
- `src/hooks/useStaticData.js` — data loading with caching and flashcard merging
- `src/stores/useUserStore.js` — user preferences, theme, donation settings (persisted)
- `src/stores/useProgressStore.js` — quiz, exam, flashcard progress (persisted)
- `src/main.jsx` — Vite entry point
- `index.html` — HTML shell

### Styling
- `src/index.css` — global styles, CSS variables, animations, utilities
- `src/App.css` — application shell styles (minimal)
- Tailwind utilities in components (prefer Tailwind classes over CSS files)

### Scripts & Build
- `scripts/generate-questions.mjs` — merge per-enabler questions into main bank
- `scripts/generate-flashcards-ai.mjs` — AI flashcard generation (Ollama)
- `scripts/extract-definitions-ai.mjs` — extract definitions from PDFs
- `scripts/format-definition-flashcards.mjs` — format extracted definitions as flashcards
- `package.json` — dependencies, scripts, project metadata