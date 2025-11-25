# Timed Exam Mode - Implementation Plan

## Overview

Add a realistic PMP Exam Simulator to the PMP Practice app: 180 questions in 230 minutes with proper domain distribution (42% People, 50% Process, 8% Business), countdown timer with pause capability, no immediate feedback during the exam, and comprehensive results review with PDF export.

## Architecture Decisions

### 1. Route Structure
**Single `/exam` route with state-based view switching**
- Initial view: Exam interface (questions, timer, navigation)
- After submission: Results view (scores, review, export)
- Simpler than separate routes, keeps exam context in one place
- URL stays `/exam` throughout (no separate `/exam/results` route)

### 2. State Management
**New zustand store: `useExamStore.js`**
- Persists to localStorage (key: `pmp-exam`, version: 1)
- Handles exam lifecycle: start, answer collection, pause/resume, submit
- Stores active exam + history of past 10 exams
- Pattern matches existing `useProgressStore.js`

### 3. Component Strategy
**Reuse existing components where possible**
- `QuizCard` - Reuse as-is (don't show `QuizFeedback` component during exam)
- `Button`, `Card`, `Badge`, `Select` - All existing components
- `LoadingSpinner` - For question generation
- Create new: `ExamTimer`, `ExamNavigator`, `Modal` (if doesn't exist)

## Implementation Steps

### Phase 1: Foundation (2 hours)

#### 1.1 Create Modal Component
**File:** `src/components/Modal.jsx`
```jsx
- Reusable modal overlay with backdrop
- Keyboard accessible (Escape to close)
- Focus trap (Tab cycles within modal)
- Props: title, children, onClose, showCloseButton
- Dark mode support
```

#### 1.2 Create Exam Store
**File:** `src/stores/useExamStore.js`
```javascript
- State: activeExam (current exam or null), examHistory (array, max 10)
- Active exam fields:
  - id: `exam-${timestamp}`
  - questions: [180 selected questions]
  - answers: { questionId: optionId }
  - flagged: [questionId array]
  - currentIndex: number
  - startTime: timestamp
  - pausedAt: timestamp | null
  - totalPauseTime: milliseconds
  - isSubmitted: boolean
  - results: object | null
- Actions:
  - startExam(questions)
  - setAnswer(questionId, optionId)
  - toggleFlag(questionId)
  - goToQuestion(index)
  - pauseExam() / resumeExam()
  - submitExam() - calculates results
  - clearActiveExam()
  - resetExams()
- Use zustand persist middleware (localStorage)
- Include sanitization (similar to useProgressStore)
```

#### 1.3 Create Exam Helpers
**File:** `src/utils/examHelpers.js`
```javascript
- shuffle(array) - Fisher-Yates algorithm (can extract from Quiz.jsx)
- selectExamQuestions(allQuestions) - Returns 180 questions:
  - 76 People (42%)
  - 90 Process (50%)
  - 14 Business (8%)
  - Validates sufficient questions per domain
  - Throws error if insufficient
- calculateResults(exam) - Returns:
  - totalScore, percentageScore, passed (>= 110/180 = 61%)
  - domainScores: { people: {correct, total, percentage}, ... }
  - questionResults: [{ questionId, userAnswer, correctAnswer, isCorrect, domainId }]
  - timeElapsed, timePaused
- formatTime(milliseconds) - Returns "H:MM:SS" format
```

### Phase 2: Timer & Navigation Components (3 hours)

#### 2.1 ExamTimer Component
**File:** `src/components/ExamTimer.jsx`
```jsx
- Props: totalMinutes, startTime, pausedAt, totalPauseTime, onTimeUp
- Features:
  - Countdown display: "H:MM:SS" format
  - Updates every second via setInterval
  - Color-coded warnings:
    - Default: slate/zinc colors
    - Yellow badge at 30 min remaining
    - Red badge at 10 min remaining
    - Flashing animation at 1 min remaining
  - Calls onTimeUp() when timer reaches 0:00:00
  - Pauses when pausedAt is not null
  - ARIA: role="timer" aria-live="polite"
- Displays as Badge component with variant based on time
```

#### 2.2 ExamNavigator Component
**File:** `src/components/ExamNavigator.jsx`
```jsx
- Props: questions, answers, flagged, currentIndex, onNavigate, onClose
- Modal overlay with grid of question numbers (1-180)
- Grid: 10 columns on desktop, 6 on tablet, 5 on mobile
- Visual indicators:
  - Current question: ring-2 ring-sky-500
  - Answered: bg-emerald-100 (green)
  - Unanswered: bg-slate-100 (grey)
  - Flagged: orange flag icon overlay
- Legend at bottom showing counts
- Click number to navigate to that question
- Keyboard navigable (Tab through numbers, Enter to select)
```

#### 2.3 ExamProgress Component
**File:** `src/components/ExamProgress.jsx`
```jsx
- Props: currentIndex, totalQuestions, answeredCount, flaggedCount
- Displays:
  - "Question X / 180"
  - "Answered: X / 180"
  - "Flagged: X"
- Uses Badge components for counts
- Responsive: stacks on mobile, inline on desktop
```

### Phase 3: Main Exam Page (5 hours)

#### 3.1 Create Exam Page
**File:** `src/pages/Exam.jsx`

**State:**
```javascript
- view: 'start' | 'exam' | 'results'
- showNavigator: boolean (modal)
- showPauseModal: boolean
- showSubmitModal: boolean
- showTimeExpiredModal: boolean
- error: object | null
```

**View: Start Screen**
```jsx
- Card with exam info:
  - 180 questions (76 People, 90 Process, 14 Business)
  - 230 minutes (3 hours 50 minutes)
  - No immediate feedback during exam
  - Results shown at end
- "Start Exam" button
  - OnClick: Call selectExamQuestions(), startExam(), set view to 'exam'
  - Show LoadingSpinner during question selection
  - Catch errors (insufficient questions) and show error message
- If activeExam exists && !isSubmitted:
  - Show "Resume Exam" button instead
  - Show warning: "You have an exam in progress from [time]"
```

**View: Exam Interface**
```jsx
Layout:
1. Header section (Card):
   - Left: ExamTimer component
   - Right: Pause and Submit buttons

2. Progress section:
   - ExamProgress component
   - "Flag for Review" toggle button (yellow when flagged)
   - "Question Navigator" button (opens modal)

3. Question section:
   - QuizCard component (reused from Quiz.jsx)
   - Pass showFeedback={false} or just don't render QuizFeedback

4. Navigation section:
   - Previous button (disabled on question 1)
   - Next button (always enabled, can skip questions)
   - Current position: "Question X / 180"

Features:
- Answer selection updates state immediately
- No feedback shown (no QuizFeedback component)
- Can navigate freely (Previous/Next/Grid)
- Can flag questions for review
- Timer counts down continuously (unless paused)
- beforeunload event handler warns before leaving page
```

**Modals:**
1. **Pause Modal:**
   - Shows when pauseExam() called
   - Hides questions (exam integrity)
   - "Resume Exam" button
   - Shows elapsed time

2. **Submit Modal:**
   - "Submit Exam?" confirmation
   - Shows answered count (X / 180)
   - Warning if unanswered > 0
   - Shows flagged count
   - "Go Back" and "Submit Exam" buttons

3. **Time Expired Modal:**
   - Triggered when timer hits 0:00:00
   - "Time's up! Auto-submitting..."
   - 5-second countdown, then auto-submit
   - No user action required

4. **Navigator Modal:**
   - Shows ExamNavigator component
   - Escape to close

**View: Results Screen**
```jsx
Layout:
1. Hero Summary (Card):
   - Large PASSED/NOT PASSED badge (success/error variant)
   - Score: "XX%" in huge text
   - "XXX / 180 correct"
   - "Passing: 61% (110/180)"

2. Statistics Grid (3 columns on desktop):
   - Total Time card
   - Domain breakdown cards (People, Process, Business)
   - Each shows: percentage, X/Y correct, progress bar

3. Question Review (Card):
   - Filter buttons: All | Incorrect | Flagged
   - Paginated list (20 questions per page)
   - Each question shows:
     - Question number + domain badge
     - Question text
     - All 4 options with indicators:
       - Correct answer: green border + checkmark
       - User's wrong answer: red border + X
       - Other options: neutral
     - Explanation section (always visible)
   - Collapsible by default, expand on click (optional)

4. Actions (buttons):
   - "Retake Exam" - clearActiveExam(), restart flow
   - "Export as PDF" - generate PDF report
   - "Return to Practice" - navigate('/quiz')
   - "View Exam History" - show past exam results (future)
```

#### 3.2 Add Route to App.jsx
**File:** `src/App.jsx`
```javascript
- Import Exam component
- Add route: <Route path="/exam" element={<Exam />} />
```

#### 3.3 Add Navigation Link
**File:** `src/components/Navigation.jsx`
```jsx
- Add NavLink between Quiz and Flashcards:
  <NavLink to="/exam" className={navLinkClass} onClick={handleNavClick}>
    Exam
  </NavLink>
```

### Phase 4: PDF Export (2 hours)

#### 4.1 Install jsPDF Library
```bash
npm install jspdf
```

#### 4.2 Create PDF Generator
**File:** `src/utils/generateExamPDF.js`
```javascript
- Export function: generateExamPDF(results, questions)
- Uses jsPDF library
- PDF structure:
  - Page 1: Summary
    - Score, pass/fail, time taken
    - Domain breakdown table
  - Pages 2+: Question review
    - All incorrect answers
    - Question text, selected answer, correct answer, explanation
- Format: Letter size (8.5" x 11")
- Font: Helvetica
- Colors: Match app theme (dark mode detection)
- Save as: "PMP-Exam-Results-YYYY-MM-DD.pdf"
```

#### 4.3 Integrate into Results View
- "Export as PDF" button calls generateExamPDF()
- Shows toast notification on success
- Handles errors gracefully

### Phase 5: Polish & Testing (4 hours)

#### 5.1 Edge Cases
- [ ] Browser refresh during exam → Resume modal
- [ ] Browser refresh after submit → Show results
- [ ] Navigation warnings (beforeunload event)
- [ ] Insufficient questions → Error message
- [ ] Time expiry → Auto-submit sequence
- [ ] Pause during last minute → Works correctly
- [ ] Multiple exams in history → Limit to 10

#### 5.2 Accessibility Audit
- [ ] All interactive elements keyboard accessible
- [ ] Timer has aria-live region
- [ ] Modals trap focus correctly
- [ ] Question navigator keyboard navigable
- [ ] Results use semantic HTML
- [ ] Color contrast WCAG AA (both themes)
- [ ] Screen reader testing

#### 5.3 Responsive Design
- [ ] Timer visible on mobile
- [ ] Navigator grid works on small screens
- [ ] Question text scrolls properly
- [ ] Buttons have 44x44px touch targets
- [ ] Results page responsive

#### 5.4 Dark Mode
- [ ] All new components support dark mode
- [ ] Timer warnings visible in both themes
- [ ] Results cards properly styled
- [ ] PDF export respects theme (optional)

#### 5.5 Optional: Home Page CTA
**File:** `src/pages/Home.jsx`
```jsx
- Add prominent "Take Practice Exam" button/card
- Links to /exam
- Shows exam specs (180 questions, 230 minutes)
```

## File Summary

### New Files (8 files)
1. `src/pages/Exam.jsx` (~350 lines) - Main exam page
2. `src/stores/useExamStore.js` (~180 lines) - Exam state management
3. `src/components/ExamTimer.jsx` (~90 lines) - Countdown timer
4. `src/components/ExamNavigator.jsx` (~120 lines) - Question grid modal
5. `src/components/ExamProgress.jsx` (~50 lines) - Progress display
6. `src/components/Modal.jsx` (~80 lines) - Reusable modal
7. `src/utils/examHelpers.js` (~100 lines) - Question selection & results calculation
8. `src/utils/generateExamPDF.js` (~150 lines) - PDF export

**Total new code: ~1,120 lines**

### Modified Files (2 files)
1. `src/App.jsx` - Add /exam route (2 lines)
2. `src/components/Navigation.jsx` - Add Exam link (4 lines)

### Dependencies to Install
```bash
npm install jspdf
```

## Testing Checklist

### Functional Tests
- [ ] Start exam generates exactly 180 questions (76/90/14 distribution)
- [ ] Timer counts down accurately (every second)
- [ ] Timer persists through browser refresh
- [ ] Pause/resume works correctly
- [ ] Answer selection saves to state
- [ ] Flag toggle works
- [ ] Question navigator shows correct status
- [ ] Previous/Next buttons work
- [ ] Submit modal shows accurate counts
- [ ] Time expiry auto-submits
- [ ] Results calculate correctly
- [ ] Domain breakdown accurate
- [ ] Filter buttons work (All/Incorrect/Flagged)
- [ ] PDF export downloads correctly
- [ ] Retake exam generates new questions

### Edge Cases
- [ ] Browser refresh mid-exam resumes correctly
- [ ] Browser refresh after submit shows results
- [ ] Navigation warnings prevent accidental exit
- [ ] Insufficient questions shows error
- [ ] localStorage quota exceeded handled gracefully

### Performance
- [ ] Question selection <100ms (shuffle 3,275 questions)
- [ ] Results calculation <50ms
- [ ] PDF generation <2 seconds
- [ ] No layout shift during countdown
- [ ] Smooth transitions between questions

## Implementation Timeline

| Phase | Hours | Tasks |
|-------|-------|-------|
| 1. Foundation | 2 | Modal, store, helpers |
| 2. Components | 3 | Timer, navigator, progress |
| 3. Main Page | 5 | Exam interface, views, modals |
| 4. PDF Export | 2 | jsPDF integration |
| 5. Polish | 4 | Testing, accessibility, responsive |
| **Total** | **16 hours** | |

## Key Design Patterns (From Existing Codebase)

### State Management Pattern (from useProgressStore.js)
```javascript
- Use zustand with persist middleware
- Sanitization functions for data integrity
- localStorage with version field
- Default state object separate from store
```

### Component Pattern (from Quiz.jsx)
```javascript
- useStaticData() hook for data loading
- useMemo for derived state (filtered questions, scores)
- useCallback for handlers
- LoadingSpinner during data load
- Error state handling
```

### Styling Pattern (from all components)
```javascript
- Tailwind classes with dark: variants
- Transition classes (300ms duration)
- Focus ring utility: focus-ring class
- Responsive: Mobile-first (sm:, md:, lg:)
- ARIA attributes for accessibility
```

### Modal Pattern (from Navigation.jsx)
```javascript
- useRef for menu/button refs
- useEffect for Escape key handler
- useEffect for click-outside handler
- Backdrop with fixed positioning
- Focus management (return focus on close)
```

## Success Criteria

1. **Functional**: User can take a full 180-question, 230-minute timed exam
2. **Accurate**: Domain distribution matches real PMP exam (42/50/8)
3. **Persistent**: Exam state survives browser refresh
4. **Accessible**: WCAG 2.1 Level AA compliant
5. **Responsive**: Works on mobile, tablet, desktop
6. **Exportable**: Results can be downloaded as PDF
7. **User-Friendly**: Clear UI, helpful warnings, good error handling

## Post-Launch Enhancements (Future)

- Exam history dashboard (view past results)
- Performance analytics (track improvement over time)
- Adaptive difficulty (focus on weak areas)
- Mini-exams (60 questions, 76 minutes)
- Domain-specific practice exams
- Share results (anonymized link)

---

**Ready to implement!** This plan provides step-by-step guidance for building a production-ready Timed Exam Mode feature.
