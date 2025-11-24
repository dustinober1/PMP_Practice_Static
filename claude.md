# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PMP Practice (Static)** is a zero-cost PMP exam prep application built with React, Vite, and Tailwind CSS. The app is entirely client-side with no server or database—all data is static JSON files in `src/data/`, and user progress is persisted locally via zustand + localStorage.

**Modern Design & Accessibility**: The UI has been redesigned with a professional dark theme, responsive mobile navigation, and full WCAG 2.1 Level AA accessibility compliance. All interactions are keyboard accessible, screen reader compatible, and support system dark mode preferences.

See `AGENTS.md` for comprehensive project architecture, question authoring standards, and data layout.
See `ACCESSIBILITY.md` for accessibility testing procedures and standards.
See `REDESIGN_SUMMARY.md` for complete redesign documentation.

## Quick Start Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run dev server (port 5173) | `npm run dev` |
| Build for production | `npm run build` |
| Lint code | `npm run lint` |
| Merge per-enabler questions into main bank | `npm run generate:questions` |

## Key Project Structure

```
src/
├── App.jsx                    # Top-level router and shell layout
├── pages/
│   ├── Home.jsx              # Homepage; displays domain/task data
│   ├── Quiz.jsx              # Main quiz experience
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
│   ├── QuizCard.jsx          # Single question + options + selection (dark mode)
│   └── QuizFeedback.jsx      # Correctness feedback + explanation (dark mode)
├── stores/
│   ├── useUserStore.js       # User profile, theme, donations (persisted)
│   └── useProgressStore.js   # Quiz/study progress (persisted)
├── hooks/
│   └── useStaticData.js      # Data loader with caching for JSON imports
├── data/
│   ├── domains.json          # PMP domains
│   ├── tasks.json            # Tasks keyed by domain
│   ├── enablers.json         # Enablers with stable IDs
│   ├── processes.json        # PMP processes
│   ├── knowledge_areas.json  # Knowledge area tags
│   ├── questions/            # Per-enabler question source files
│   │   └── <domain>/<taskId>/*.json  # e.g., people/people-4/e-people-4-1.json
│   └── questions_templates.json   # Scaffolds for consistent authoring
└── site-config.js            # Site metadata, donation links
```

## Critical Concepts

### Data Flow

1. **Static Data**: All data lives in `src/data/*.json`. Vite imports these as ES modules (not fetched at runtime).
2. **Question Generation**: Author questions per-enabler in `src/data/questions/<domain>/<taskId>/<enablerId>.json`, then run `npm run generate:questions` to merge them into the main bank. **Do not hand-edit the merged questions file.**
3. **User State**: `useUserStore` and `useProgressStore` store data in localStorage. Both use zustand with versioning; bump version if breaking changes occur.

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
- Data keys: `domains`, `tasks`, `enablers`, `processes`, `knowledgeAreas`, `questions`
- Cache is in-memory; cleared only on page reload

Example usage:
```jsx
const { data, loading, error } = useStaticData()
if (loading) return <div>Loading...</div>
if (error) return <div>Error: {error.message}</div>
return <div>{data.domains.length} domains loaded</div>
```

## Question Authoring & Data

**Critical**: Follow the structure in `AGENTS.md` for question standards, enabler coverage (25 per enabler), scenario-based format, and distractor balance.

**Workflow**:
1. Edit `src/data/questions/<domain>/<taskId>/<enablerId>.json`
2. Run `npm run generate:questions` to rebuild the main questions bank
3. The app automatically loads from the merged `src/data/questions.json`

**Note**: `src/data/questions.json` is generated; do not edit it by hand for People-domain questions.

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

<Badge variant="success">Passed</Badge>
<Toast message="Action completed!" type="success" />
<LoadingSpinner size="md" label="Loading..." />
<Skeleton count={3} height="h-6" />
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
3. **State**: Use `useUserStore` or `useProgressStore` for persistent data; local state via `useState` for transient UI state
4. **Data**: For new static data, add JSON to `src/data/` and update `useStaticData.js` loaders

### Debugging

- Dev server runs on `http://localhost:5173`
- Check browser console for runtime errors
- Use React DevTools to inspect component state and zustand store snapshots
- localStorage keys: `pmp-user`, `pmp-progress`

### Dark Mode & Theme

The application supports three theme modes:
1. **Light** - White backgrounds with dark text
2. **Dark** - Zinc-950 backgrounds with light text
3. **System** - Follows OS preference (default)

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

## Files to Know

### Documentation
- `AGENTS.md` — comprehensive guide to data structures, question standards, and project phase milestones
- `ACCESSIBILITY.md` — WCAG 2.1 AA standards, testing procedures, and validation checklists
- `REDESIGN_SUMMARY.md` — complete UI redesign documentation, component list, and deployment checklist
- `CLAUDE.md` — this file; guidance for working in the codebase

### Configuration & Data
- `tailwind.config.js` — Tailwind theme configuration with dark mode, colors, and animations
- `src/site-config.js` — site name, tagline, donation links
- `src/data/questions_templates.json` — template for new questions
- `src/data/enablers.json` — canonical enabler IDs (do not modify without updating questions)

### Styling
- `src/index.css` — global styles, CSS variables, animations, and utilities
- `src/App.css` — application shell styles (minimal)
