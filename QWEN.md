# PMP Practice Static - Project Context

## Project Overview
This is a zero-cost PMP (Project Management Professional) preparation site built as a static React application using the Vite build tool. The project is designed to provide practice questions, flashcards, and study materials for PMP certification candidates with no server-side dependencies required. Data is stored in static JSON files and state is managed locally using Zustand with localStorage persistence.

## Technologies & Stack
- **Frontend Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **CSS Framework**: Tailwind CSS 3.4.14 (with dark mode support)
- **Routing**: React Router DOM 7.9.6
- **State Management**: Zustand 5.0.8 (with localStorage persistence)
- **Styling**: Tailwind CSS with custom color system for WCAG AA contrast compliance
- **AI Integration**: Anthropic-ai/sdk 0.71.0 for generating questions and flashcards
- **PDF Generation**: jsPDF 3.0.4 for exporting study materials
- **Development Tools**: ESLint, PostCSS, Autoprefixer

## Project Structure
```
PMP_Practice_Static/
├── .agent/                 # Agent-specific files
├── .claude/               # Claude-specific files
├── data/                  # Reference/auxiliary data that is not bundled into the app
│   └── reference/
│       ├── exam-outline/2026_structure.json   # PMP 2026 outline extracted from the ECO
│       ├── flashcards/                        # Manual/curated flashcard banks by source
│       └── extracted/                         # Raw text extracts from reference PDFs
├── docs/                  # Documentation files
├── plans/                 # Planning documents
├── public/                # Public assets
├── references/            # Reference materials
│   ├── AgilePracticeGuide.pdf  # Source PDF for Agile terms and definitions (used to generate flashcards)
│   ├── AI Essentials for Project Professionals.pdf  # Source PDF for AI terms and definitions (manually curated for flashcards)
├── scripts/               # Build and data generation scripts
├── src/                   # Source code
│   ├── assets/            # Static assets
│   ├── components/        # Reusable UI components
│   ├── data/              # Static JSON data files (domains, tasks, enablers, processes)
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Route components (Home, Quiz, Exam, Flashcards, Settings)
│   ├── stores/            # Zustand stores for user preferences and progress
│   ├── utils/             # Utility functions
│   ├── App.jsx           # Main application component
│   ├── index.css         # Global styles
│   └── site-config.js    # Site configuration
├── .flashcard-generation-state.json  # State tracking for flashcard generation
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html
├── netlify.toml          # Netlify deployment config
├── package.json
├── postcss.config.js
├── tailwind.config.js    # Tailwind CSS configuration
├── vercel.json           # Vercel deployment config
└── vite.config.js        # Vite build configuration
```

## Key Features
- **Local-First Architecture**: User progress and settings are stored in localStorage
- **Dark/Light Mode**: System-aware theme switching with WCAG AA contrast compliance
- **PMP Domains**: Organized around the three PMP 2026 domains (People 33%, Process 41%, Business Environment 26%)
- **Quiz & Exam Modes**: Different modes for practice and simulated exam experiences
- **Flashcards**: Interactive flashcard system for studying key concepts
- **Static Data**: All content sourced from JSON files for easy maintenance
- **Accessible Design**: Proper landmarks, skip navigation links, and semantic HTML

## Data Structure
The application organizes PMP content into:
- **Domains**: Three main PMP domains (People, Process, Business Environment) with assigned percentages
- **Tasks**: Specific tasks within each domain (36 total tasks across all domains)
- **Enablers**: Detailed actions and practices that support each task
- **Processes**: Project management processes
- **Knowledge Areas**: Traditional PMBOK knowledge areas
- **Questions**: Practice questions for study
- **Flashcards**: Study cards for key concepts
  - **General PMP Flashcards**: Core PMP concepts and terminology
  - **Agile Practice Guide Flashcards**: 85 terms from the Agile Practice Guide glossary (added from references/AgilePracticeGuide.pdf)
  - **AI Essentials Flashcards**: 45 terms from the AI Essentials for Project Professionals document (added manually curated content)
  - **AI Essentials Extracted Flashcards**: 4 terms from the AI Essentials for Project Professionals document (added from manual extraction of key terms)
  - **Business Analysis Flashcards**: 62 terms from the Business Analysis for Practitioners: A Practice Guide - Second Edition (added manually curated content)
  - **Leading AI Transformation Flashcards**: 49 terms from the Leading AI Transformation document (added manually curated content)
  - **Leading and Managing AI Projects Flashcards**: 40 terms from the Leading and Managing AI Projects guide (added manually curated content)
  - **Navigating Complexity Flashcards**: 71 terms from the Navigating Complexity: A Practice Guide (added manually curated content)
  - **PMBOK Guide 8th Edition Flashcards**: 47 terms from the PMBOK Guide 8th Edition glossary (added manually curated content)
  - **PMI Guide to Business Analysis Glossary Flashcards**: 517 terms from the PMI Guide to Business Analysis glossary (added manually curated content)
  - **PMO Practice Guide Flashcards**: 94 terms from the PMO Practice Guide glossary (added manually curated content)
  - **Project Configuration Management Flashcards**: 40 terms from the Project Configuration Management Practice Standard (added manually curated content)
  - Manual flashcard banks above live in `data/reference/flashcards/` for reference/import.

## Development Commands
- `npm install` - Install project dependencies
- `npm run dev` - Start development server (default: http://localhost:5173)
- `npm run build` - Create production build (output to `dist` directory)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## AI-Powered Data Generation
The project includes several scripts for AI-assisted data generation:
- `npm run generate:questions` - Generate practice questions
- `npm run generate:flashcards:ai` - Generate flashcards using AI
- `npm run generate:flashcards:merge` - Merge flashcard sets
- `npm run generate:flashcards:validate` - Validate flashcard data
- `npm run generate:definitions` - Extract and format definition flashcards

## Additional Data Processing Scripts
The project includes custom Python scripts for processing reference materials:
- **process_glossary.py**: Extracts terms and definitions from PDF files (e.g., Agile Practice Guide)
- **process_glossary_improved.py**: Improved version with better parsing capabilities
- **process_glossary_final.py**: Final version with precise extraction logic
- **process_glossary_final_fixed.py**: Fixed version that properly separates combined entries
- **process_glossary_precise.py**: Most accurate extraction method
- **pdf_to_flashcards_agent.py**: Comprehensive agent for processing PDFs to extract terms and convert them into project flashcard format

The pdf_to_flashcards_agent.py was used to process reference documents and convert them into the project's flashcard format. Additionally, terms from the AI Essentials for Project Professionals document were manually curated and added to enhance the flashcard collection.

## Deployment
The application is designed for static hosting and can be deployed to:
- **Vercel**: Uses `npm run build` and serves from `dist` directory
- **Netlify**: Uses `npm run build` and serves from `dist` directory
- Any static hosting service that can serve the built files from the `dist` directory

## Configuration
The `src/site-config.js` file contains site-specific configuration:
- Site name and tagline
- Description and donation links
- Repository URL for open-source attribution

## Accessibility Features
- Semantic HTML structure with proper landmarks
- Skip navigation link for keyboard users
- Proper heading hierarchy
- WCAG AA contrast compliance for text and background colors
- Responsive design for various device sizes
- System-aware dark/light mode

## Data Sources
- Static JSON files in `src/data/` for core PMP content
- PMP 2026 structure defined in `data/reference/exam-outline/2026_structure.json`
- Questions and flashcards can be AI-generated using the provided scripts
- Local storage for user progress and preferences
