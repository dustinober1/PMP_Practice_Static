# QWEN.md - PMP Practice (Static) Project

## Project Overview
PMP Practice (Static) is a zero-cost PMP (Project Management Professional) preparation site built with React + Vite + Tailwind. The project uses static JSON files for data storage and implements local-first state management using Zustand with localStorage persistence. This approach allows users to study and track progress without requiring server-side authentication or databases.

### Key Technologies
- **Frontend Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 3.4.14
- **Routing**: React Router 7.9.6
- **State Management**: Zustand 5.0.8 (with localStorage persistence)
- **Linting**: ESLint 9.39.1
- **Server-side**: None (fully static site)

## Project Structure
```
PMP_Practice_Static/
├── src/
│   ├── data/                 # Static JSON files for questions, tasks, enablers
│   │   ├── questions/        # Question data organized by domains (people, process, business)
│   │   ├── domains.json      # PMP domain definitions
│   │   ├── tasks.json        # PMP task definitions
│   │   ├── enablers.json     # PMP enabler definitions
│   │   ├── processes.json    # PMP process definitions
│   │   └── knowledge_areas.json # PMP knowledge area definitions
│   ├── pages/                # React route components (Home, Settings, Quiz, NotFound)
│   ├── stores/               # Zustand stores for user preferences and progress
│   └── site-config.js        # Site configuration (name, donation links, repo URL)
├── public/                   # Static assets
├── scripts/                  # Utility scripts for data generation and validation
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite build configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── netlify.toml             # Netlify deployment configuration
└── vercel.json              # Vercel deployment configuration
```

## Building and Running

### Development
1. **Install dependencies**: `npm install`
2. **Start development server**: `npm run dev` (runs on http://localhost:5173 by default)
3. **Preview production build**: `npm run preview`

### Production
- **Build for production**: `npm run build` (outputs to `dist/` directory)
- **Deployment**: Connect to Vercel or Netlify and use `npm run build` with `dist` as the publish directory

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build locally
- `npm run generate:questions`: Generate questions using a script

## Data Structure
The application uses a comprehensive system of static JSON data files organized as follows:

1. **Hierarchical Organization**:
   - Domains (People, Process, Business Environment)
   - Tasks (nested under domains)
   - Enablers (specific skills/knowledge areas under tasks)
   - Questions (organized by domain, task, and enabler)

2. **Question Format**: Each question JSON object contains:
   - `id`: Unique identifier
   - `domainId`: Parent domain
   - `taskId`: Parent task
   - `enablerIds`: Associated enablers
   - `text`: Question text
   - `options`: Array of option objects (a-d)
   - `correctOptionId`: Correct answer identifier
   - `explanation`: Detailed explanation of the correct answer
   - `difficulty`: easy, medium, or hard
   - `topics`: Tagged topics
   - `process`: Associated process
   - `knowledgeAreaId`: Associated knowledge area

3. **Validation**: The project includes validation scripts to ensure data integrity (e.g., `scripts/validate-people-1-questions.js`)

## State Management
The application uses a local-first approach with Zustand for state management:
- User progress (completed questions, flashcard ratings, study materials read)
- User preferences (theme, name)
- Data is persisted in localStorage and can be exported/imported by users

## Development Conventions
- **Component Structure**: Organized by feature (pages, components, stores)
- **Data Validation**: Comprehensive validation scripts ensure data integrity
- **Modular Data**: Questions are organized by PMP domains and tasks
- **Static JSON**: All content stored in JSON files for easy maintenance
- **Accessibility**: Built with React and Tailwind for responsive, accessible UI

## Project Phases (According to High_Level_Plan.md)
The project follows a structured development plan:
1. Foundation & Data Structure (completed)
2. State Management (completed)
3. Quiz System (completed)
4. Flashcard System (in progress)
5. Study Materials & Search (planned)
6. Monetization & Polish (planned)

## Testing and Validation
The project includes validation scripts for ensuring data quality:
- Validation of required fields in question JSON files
- Verification of references to enablers, processes, and knowledge areas
- Checks for proper option structure and content
- Coverage validation to ensure balanced question distribution

## Deployment
The application is designed for static hosting on platforms like Vercil or Netlify:
- Build command: `npm run build`
- Output directory: `dist`
- No server-side requirements
- Optimized for performance with modern web standards