# AI-Assisted Flashcard Generation Plan

## Overview

Expand the PMP Practice app's flashcard system to **100 simple concept flashcards per enabler** (13,000 total) using AI-assisted generation. This plan details the file structure, data schema, AI prompt design, script creation, quality standards, implementation phases, risk management, and success metrics.

**Current State:**
- 130 total enablers (People: 50, Process: 60, Business: 20)
- ~16 existing flashcards in people.json (minimal coverage)
- Flashcard system fully functional with Leitner box spaced repetition at `/flashcards`

**Target State:**
- 13,000 flashcards (100 per enabler)
- Simple concept format (term/definition, Q&A)
- Organized in per-enabler source files, merged into 3 domain files

---

## Implementation Strategy

### 1. File Structure

**New Directory:**
```
src/data/flashcards-source/
├── people/
│   ├── people-1/  
│   │   ├── e-people-1-1.json (100 cards)
│   │   ├── e-people-1-2.json (100 cards)
│   │   └── e-people-1-3.json (100 cards)
│   └── ... (50 enablers)
├── process/
│   └── ... (60 enablers)
└── business/
    └── ... (20 enablers)
```

**Existing Output** (unchanged structure):
```
src/data/flashcards/
├── people.json (5,000 cards)
├── process.json (6,000 cards)
└── business.json (2,000 cards)
```

### 2. Data Schema

**Per-Enabler Source File Format** (`flashcards-source/<domain>/<task>/<enabler>.json`):
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

**Merged Output Format** (existing structure, `flashcards/<domain>.json`):
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

**ID Generation:** `fc-{domain}-{task}-{enablerNum}-{cardNum}`
- Example: `fc-people-1-1-001` through `fc-people-1-1-100`
- 4 segments (vs existing 3-segment manual cards) = no collision

### 3. AI Generation Approach

**Generation Prompt Template:**
```
You are a PMP exam prep expert creating simple concept flashcards.

DOMAIN: [domain name]
TASK: [task text]
ENABLER: [enabler text]

Create exactly 100 simple concept flashcards with:

1. FORMAT: Term/definition or concept/explanation
   - Front: Clear question (e.g., "What is X?", "Define Y", "Explain Z")
   - Back: Concise answer (1-3 sentences max)

2. DIFFICULTY DISTRIBUTION:
   - 50 cards: easy (basic definitions)
   - 30 cards: medium (application, relationships)
   - 20 cards: hard (nuances, edge cases, comparisons)

3. CONTENT COVERAGE:
   - Key terminology specific to this enabler
   - Core techniques and tools
   - Best practices and principles
   - Common pitfalls
   - Real-world applications

4. QUALITY:
   - Each card self-contained (no ambiguous references)
   - PMBOK 7th Edition aligned
   - No duplicates within the set
   - 1-3 relevant tags per card (lowercase, hyphen-separated)

Return ONLY valid JSON array: [{"front": "...", "back": "...", "tags": [...], "difficulty": "easy"}, ...]
```

**Context Enrichment:**
- Load related domain, task, process, knowledge area data
- Include in prompt for better context-aware generation

### 4. Scripts to Create

#### Script 1: `scripts/generate-flashcards-ai.mjs` (Core generator)

**Responsibilities:**
- Load enablers from `src/data/enablers.json`
- For each enabler:
  - Build context-enriched AI prompt
  - Parse JSON response
  - Validate structure (100 cards, 50/30/20 difficulty, required fields)
  - Write to `src/data/flashcards-source/<domain>/<task>/<enabler>.json`
- Progress tracking with state file
- Resume capability for interrupted runs
- Error logging and retry logic

**Key Features:**
- State persistence (track completed/failed enablers)
- Parallel generation (configurable concurrency, default 1 for quality)
- Validation before writing
- Estimated time: 3-5 min per enabler = 6.5-10.8 hours total

**Usage:**
```bash
npm run generate:flashcards:ai
npm run generate:flashcards:ai -- --resume  # Resume from last state
npm run generate:flashcards:ai -- --enabler e-people-1-1  # Test single enabler
```

#### Script 2: `scripts/generate-flashcards-merge.mjs` (Merger)

**Responsibilities:**
- Walk `src/data/flashcards-source/` directory tree
- Read all per-enabler JSON files
- Add metadata: `id`, `domainId`, `taskId`, `type: "concept"`
- Merge into 3 domain-level files: `people.json`, `process.json`, `business.json`
- Sort by ID for consistency

**Pattern:**
- Based on existing `scripts/generate-questions.mjs` (recursive walk, merge logic)
- ~150-200 lines

**ID Generation Logic:**
```javascript
// Extract from: src/data/flashcards-source/people/people-1/e-people-1-1.json
const domain = 'people'
const task = 'people-1'
const enablerNum = '1'  // from e-people-1-1

cards.forEach((card, index) => {
  const cardNum = String(index + 1).padStart(3, '0')
  card.id = `fc-${domain}-${task}-${enablerNum}-${cardNum}`
  card.domainId = domain
  card.taskId = task
  card.type = 'concept'
})
```

**Usage:**
```bash
npm run generate:flashcards:merge
```

#### Script 3: `scripts/validate-flashcards.mjs` (Validator)

**Responsibilities:**
- Check all source files for:
  - Exactly 100 cards per enabler
  - Difficulty distribution: 50/30/20 (±5 tolerance)
  - Required fields present: front, back, tags, difficulty
  - No duplicate fronts within enabler
  - Length limits: front (10-200 chars), back (10-500 chars)
  - Valid difficulty values: easy|medium|hard
  - Valid tags format: lowercase, hyphen-separated
- Generate validation report with pass/fail summary
- Exit code 1 if any failures

**Usage:**
```bash
npm run generate:flashcards:validate
```

### 5. NPM Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "generate:flashcards:ai": "node scripts/generate-flashcards-ai.mjs",
    "generate:flashcards:merge": "node scripts/generate-flashcards-merge.mjs",
    "generate:flashcards:validate": "node scripts/validate-flashcards.mjs",
    "generate:flashcards": "npm run generate:flashcards:validate && npm run generate:flashcards:merge"
  }
}
```

**Workflow:**
1. `npm run generate:flashcards:ai` - Generate all source files (run once, 6-11 hours)
2. `npm run generate:flashcards` - Validate and merge (run after edits)

---

## Content Quality Standards

### Flashcard Requirements

**Front (Question):**
- 10-200 characters
- Clear, specific, direct
- Formats: "What is X?", "Define X", "Explain X", "List X"
- No ambiguous pronouns

**Back (Answer):**
- 1-3 sentences maximum
- 10-500 characters
- Factual, PMBOK 7th Edition aligned
- Include context/example when helpful

**Difficulty Calibration:**
- **Easy (50%):** Basic definitions, simple recall
  - "What is a project?" → "A temporary endeavor..."
- **Medium (30%):** Application, relationships, techniques
  - "When should you use the Delphi technique?" → "Use Delphi when seeking expert consensus..."
- **Hard (20%):** Advanced nuances, edge cases, comparisons
  - "Compare bottom-up vs top-down estimating" → "Bottom-up: More accurate but time-intensive..."

**Tags:**
- 1-3 tags per card
- Lowercase, hyphen-separated (e.g., "risk-management", "agile")
- Consistent taxonomy

### Coverage Per Enabler (100 cards)

- **Core Terminology (30-40 cards):** Definitions, acronyms
- **Techniques & Tools (20-30 cards):** Methods, frameworks
- **Best Practices (15-20 cards):** Principles, guidelines
- **Common Pitfalls (10-15 cards):** Anti-patterns, mistakes
- **Applications (10-15 cards):** When to use, scenarios
- **Relationships (5-10 cards):** Connections to other concepts

---

## Implementation Phases

### Phase 1: Setup & Tooling (2-4 hours)

**Tasks:**
1. Create `scripts/generate-flashcards-ai.mjs` (~500-800 lines)
2. Create `scripts/generate-flashcards-merge.mjs` (~150-200 lines)
3. Create `scripts/validate-flashcards.mjs` (~200-300 lines)
4. Add NPM scripts to `package.json`
5. Create directory: `src/data/flashcards-source/`

**Validation:**
- Test on 1 enabler: `npm run generate:flashcards:ai -- --enabler e-people-1-1`
- Verify 100 cards generated
- Run merge and validation scripts
- Check output in `src/data/flashcards/people.json`

### Phase 2: Pilot Generation (1-2 days)

**Objective:** Test on 10 enablers to validate quality and refine prompts

**Pilot Enablers:**
- People: e-people-1-1, e-people-2-1, e-people-5-1, e-people-10-1
- Process: e-process-1-1, e-process-5-1, e-process-10-1, e-process-15-1
- Business: e-business-1-1, e-business-5-1

**Success Criteria:**
- 1,000 total cards (10 enablers × 100)
- <5% validation failures
- Manual review: >90% cards are clear, accurate, useful
- Difficulty distribution: 50/30/20 (±5)
- Average generation time: <5 min/enabler

**If criteria not met:** Refine prompt, adjust model settings, add examples

### Phase 3: Full-Scale Generation (3-7 days)

**Execution:**
1. Run: `npm run generate:flashcards:ai`
2. Monitor progress (130 enablers × 3-5 min = 6.5-10.8 hours)
3. Can run overnight/weekend
4. State file enables resume on interruption
5. Review logs for errors
6. Regenerate failed enablers: `npm run generate:flashcards:ai -- --enabler e-xxx`

**Progress Tracking:**
```
[====================>          ] 65/130 (50%)
Current: e-process-8-3
Time remaining: ~3.2 hours
Failures: 2
```

### Phase 4: Merge & Integration (2-4 hours)

**Tasks:**
1. Run validation: `npm run generate:flashcards:validate`
2. Fix validation errors (regenerate or manual edit)
3. Run merge: `npm run generate:flashcards:merge`
4. Verify merged files:
   - `people.json`: ~5,000 cards (50 enablers × 100)
   - `process.json`: ~6,000 cards (60 enablers × 100)
   - `business.json`: ~2,000 cards (20 enablers × 100)
5. Test locally: `npm run dev`
6. Verify flashcard page loads, filters work, no performance issues

### Phase 5: Testing & QA (1-2 days)

**Functional Testing:**
- Navigate to `/flashcards`
- Filter by domain, task, difficulty, study mode
- Start study session
- Review cards, flip to back, rate (hard/good/easy)
- Verify Leitner box progression
- Check progress tracking

**Performance Testing:**
- Page load time: <2s target
- Filter response: <100ms target
- localStorage size check (should be <200KB after reviewing all)
- Mobile testing (responsive design)

**Content Quality Sampling:**
- Review 50 random cards across domains
- Verify factual accuracy vs PMBOK 7th Edition
- Check clarity and exam relevance
- Ensure no repetitive patterns

### Phase 6: Deployment & Documentation (2-3 hours)

**Deployment:**
1. Git commit all files
2. Push to main branch
3. Verify auto-deploy (Netlify/Vercel)
4. Test production site

**Documentation Updates:**
- Update `CLAUDE.md` with flashcard generation workflow
- Update `AGENTS.md` with source file structure
- Create `FLASHCARDS.md` guide (generation process, quality standards)

---

## Integration & No-Code-Change Approach

### Why No UI Changes Needed

The existing flashcard system already supports this expansion:

**Existing Components (no changes):**
- `src/pages/Flashcards.jsx` - Handles arbitrary card count
- `src/components/FlashcardCard.jsx` - Renders cards with flip animation
- `src/components/FlashcardFilters.jsx` - Multi-level filtering
- `src/components/FlashcardProgress.jsx` - Session progress and mastery stats
- `src/stores/useProgressStore.js` - Leitner box tracking scales automatically

**Data Loading (no changes):**
- `src/hooks/useStaticData.js` already loads 3 flashcard files and merges them
- Vite bundles JSON as ES modules (optimized)

**Performance Considerations:**
- Current: ~16 cards (~2KB JSON)
- Future: 13,000 cards (~1-2MB JSON)
- Modern browsers handle 2MB easily
- Filtering 13K items: ~1-5ms (useMemo prevents re-renders)
- localStorage: ~200KB after all cards reviewed (<2% of 5-10MB limit)

---

## Risk Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low-quality cards | High | Pilot testing, prompt refinement, manual sampling |
| Long generation time | Medium | Faster model option, overnight runs, resume capability |
| Validation failures | Medium | Comprehensive validation, automated fixes where possible |
| File size impacts performance | Low | Test on low-end devices, monitor load times |
| localStorage quota exceeded | Low | Monitor usage (~200KB max), add compression if needed |
| Factual inaccuracies | High | PMBOK-aligned prompts, manual sampling, user feedback |

---

## Success Metrics

### Quantitative
- **Coverage:** 13,000 cards (100 per enabler × 130)
- **Quality:** <5% validation failures, >90% manual review approval
- **Performance:** Page load <2s, filter <100ms
- **Difficulty:** 50/30/20 distribution (±5%)
- **Generation time:** <10 hours total
- **Build size:** <5MB total JSON

### Qualitative
- Clear, understandable questions
- Memorable, exam-relevant answers
- No repetitive patterns
- Factually correct (PMBOK-aligned)
- Appropriate difficulty calibration

---

## Timeline Estimate

| Phase | Duration |
|-------|----------|
| Phase 1: Setup & Tooling | 2-4 hours |
| Phase 2: Pilot Generation | 1-2 days |
| Phase 3: Full Generation | 3-7 days (mostly automated) |
| Phase 4: Merge & Integration | 2-4 hours |
| Phase 5: Testing & QA | 1-2 days |
| Phase 6: Deployment & Docs | 2-3 hours |
| **Total** | **6-14 days** |

**Realistic Schedule:** 8-10 days
- Week 1: Setup, pilot, prompt refinement
- Week 2: Full generation (automated overnight), merge, testing, deploy

---

## Critical Files

### Files to Create

1. **`scripts/generate-flashcards-ai.mjs`** - AI generation script (~500-800 lines)
2. **`scripts/generate-flashcards-merge.mjs`** - Merge script (~150-200 lines)
3. **`scripts/validate-flashcards.mjs`** - Validation script (~200-300 lines)
4. **`src/data/flashcards-source/`** - Directory for 130 per-enabler JSON files

### Files to Reference

5. **`scripts/generate-questions.mjs`** - Pattern for merge logic
6. **`src/data/enablers.json`** - Source data (130 enablers)
7. **`src/hooks/useStaticData.js`** - Data loading (no changes needed)
8. **`src/data/flashcards/people.json`** - Existing flashcard structure

---

## Next Steps

After plan approval:
1. Create AI generation script with prompt template
2. Create merge and validation scripts
3. Test on 1 enabler end-to-end
4. Run pilot on 10 enablers
5. Refine prompts based on pilot results
6. Execute full-scale generation
7. Merge, test, and deploy
