### The "Zero-Cost" Tech Stack
* **Frontend:** React + Vite + Tailwind CSS.
* **Database:** JSON files (Static Data) + Browser LocalStorage (User Progress).
* **Hosting:** Vercel, Netlify, or GitHub Pages (Free Tier).
* **Donations:** Buy Me a Coffee, Ko-fi, or Stripe Payment Links.

---

### REVISED PROJECT PLAN: PMP Prep (Static & Free Edition)

#### PHASE 1: FOUNDATION & DATA STRUCTURE (Week 1-2)
*Goal: Set up the app and define data structures without a SQL database.*

**Week 1: Project Setup**
* [x] Initialize Git repository.
* [x] Initialize React + Vite + Tailwind project.
* [x] Configure routing (React Router).
* [x] **Critical:** Create a `data/` folder structure in your source code.
* [x] Create `site-config.js` (Store global variables, site name, donation links).
* [ ] Set up automated deployment to Vercel/Netlify (Connect Git repo for auto-publishing).

**Week 2: Static Data Architecture (JSON)**
* *Instead of SQL Tables, we define JSON schemas.*
* [x] Create `domains.json` (People, Process, Business Environment).
* [x] Create `tasks.json` (Nested under domains).
* [x] Create `enablers.json`.
* [x] Create `processes.json` and `knowledge_areas.json`.
* [ ] Build a utility script (or simple React hook) to load and parse these JSON files efficiently.
* [x] **Verification:** Display the list of Domains and Tasks on a simple homepage to prove data loading works.

#### PHASE 2: STATE MANAGEMENT (The "No-Auth" Approach) (Week 3)
*Goal: Manage user progress without a login server. We use "Local-First" logic.*

**Week 3: Local Persistence**
* [ ] Install `zustand` (for state management) and `zustand/middleware` (for persistence).
* [ ] Create a `useUserStore` hook to manage:
    * User's name (optional).
    * Theme preference (Dark/Light).
    * Donation history (if they manually entered a code).
* [ ] Create a `useProgressStore` hook that automatically saves to `localStorage`:
    * `completedQuestions: []` (Array of IDs).
    * `flashcardRatings: {}` (Map of ID to rating).
    * `readMaterials: []` (Array of IDs).
* [ ] Create a "Settings" page where users can "Export Data" (download a JSON of their progress) and "Import Data" (restore progress on a new device).

#### PHASE 3: QUIZ SYSTEM (Week 4-6)
*Goal: Run quizzes entirely in the browser.*

**Week 4: Question Data & UI**
* [ ] Create `questions.json`. Structure: `{ id, text, options, correctOptionId, explanation, domainId }`.
* [ ] Populate 20 sample questions.
* [ ] Build `QuizCard` component.
* [ ] Build `QuizFeedback` component (shows explanation immediately after answering).

**Week 5: Quiz Logic (Client-Side)**
* [ ] Build logic to filter `questions.json` based on user selection (e.g., "Give me all Process Domain questions").
* [ ] Implement "Randomizer" function in JavaScript (shuffle questions).
* [ ] Implement "Scoring" logic (State: `currentScore`, `streak`).
* [ ] Update `useProgressStore` when a question is answered.

**Week 6: Results & Analytics**
* [ ] Build `QuizResults` page (displayed at end of session).
* [ ] Build a Chart component (using Recharts or Chart.js) to visualize performance from LocalStorage data.
* [ ] **Optimization:** Ensure the huge `questions.json` file is lazy-loaded (code splitting) so the initial site load isn't slow.

#### PHASE 4: FLASHCARD SYSTEM (Week 7-9)
*Goal: Spaced Repetition using client-side dates.*

**Week 7: Flashcard Data**
* [ ] Create `decks.json` and `cards.json`.
* [ ] Build `Flashcard` component with CSS 3D flip animation.
* [ ] Build `DeckList` page.

**Week 8: The Algorithm**
* [ ] Implement the SM-2 (Spaced Repetition) algorithm as a JavaScript utility function.
    * *Input:* Current date, previous rating.
    * *Output:* Next due date.
* [ ] Logic: When a user rates a card, calculate `nextReviewDate` and save it to LocalStorage.

**Week 9: Study Mode**
* [ ] Create "Due Today" filter logic.
* [ ] Build the Study Interface (Show Front -> Flip -> Rate -> Calculate Next Date -> Save).
* [ ] Add "Reset Deck" button in settings (clears progress for that deck).

#### PHASE 5: STUDY MATERIALS & SEARCH (Week 10-12)
*Goal: A fast, searchable library using Markdown.*

**Week 10: Content Rendering**
* [ ] Install `react-markdown` or setup MDX.
* [ ] Create content files (Markdown) for PMP formulas, ITTOs, and Glossary.
* [ ] Build a `MarkdownRenderer` component that styles tables and headers nicely.

**Week 11: Search Engine**
* [ ] Implement **Fuse.js** (a lightweight fuzzy-search library).
* [ ] Index your JSON data (Terms, Questions, Tasks) into Fuse.js on app load.
* [ ] Build a global "Command+K" search bar (like Spotlight/Alfred) to jump to any concept.

**Week 12: Reference Tools**
* [ ] Build "Interactive Formula Calculator" (Input fields that calculate PMP formulas like ROI/EAC dynamically).
* [ ] Build "ITTO Navigator" (Click a process -> see Inputs/Tools/Outputs).

#### PHASE 6: MONETIZATION & POLISH (Week 13-14)
*Goal: Make it professional and accept support.*

**Week 13: Donation Integration**
* [ ] Create accounts on **Buy Me a Coffee** or **Ko-fi**.
* [ ] Create a "Donate" specific page explaining the project is free/open-source.
* [ ] Add a sticky "Support this Project" button in the footer or sidebar.
* [ ] (Optional) Add a "Sponsor Wall" in the app (hardcode names of top donors into a JSON file as a thank you).

**Week 14: Performance & SEO**
* [ ] Implement SEO Meta tags (React Helmet) so people find the site on Google.
* [ ] Generate a `sitemap.xml` script.
* [ ] Audit with Lighthouse (aim for 100/100 performance since it's static).
* [ ] Verify "Offline Mode" (PWA setup with Vite PWA plugin) so users can study on the subway without internet.
