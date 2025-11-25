import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const defaultState = {
  activeExam: null,
  examHistory: []
}

const sanitizeExam = (exam) => {
  if (!exam || typeof exam !== 'object') return null

  const questions = Array.isArray(exam.questions) ? exam.questions : []
  const answers = exam.answers && typeof exam.answers === 'object' ? exam.answers : {}
  const flagged = Array.isArray(exam.flagged) ? exam.flagged : []

  return {
    id: typeof exam.id === 'string' ? exam.id : `exam-${Date.now()}`,
    questions,
    answers: Object.fromEntries(
      Object.entries(answers).filter(([k, v]) => typeof k === 'string' && typeof v === 'string')
    ),
    flagged: flagged.filter((id) => typeof id === 'string'),
    currentIndex: Math.max(0, Math.min(Math.round(exam.currentIndex) || 0, questions.length - 1)),
    startTime: typeof exam.startTime === 'number' ? exam.startTime : Date.now(),
    pausedAt: typeof exam.pausedAt === 'number' ? exam.pausedAt : null,
    totalPauseTime: Math.max(0, Math.round(exam.totalPauseTime) || 0),
    isSubmitted: exam.isSubmitted === true,
    results: exam.results && typeof exam.results === 'object' ? exam.results : null
  }
}

const sanitizeExamHistory = (history, limit = 10) => {
  if (!Array.isArray(history)) return []
  return history
    .filter((item) => item && typeof item === 'object')
    .map(sanitizeExam)
    .filter((item) => item !== null)
    .slice(-limit)
}

const sanitizeState = (payload) => ({
  activeExam: sanitizeExam(payload?.activeExam),
  examHistory: sanitizeExamHistory(payload?.examHistory)
})

export const useExamStore = create(
  persist(
    (set) => ({
      ...defaultState,

      /**
       * Start a new exam with selected questions
       */
      startExam: (questions) => {
        if (!Array.isArray(questions) || questions.length === 0) {
          console.error('Cannot start exam without questions')
          return
        }

        set({
          activeExam: {
            id: `exam-${Date.now()}`,
            questions,
            answers: {},
            flagged: [],
            currentIndex: 0,
            startTime: Date.now(),
            pausedAt: null,
            totalPauseTime: 0,
            isSubmitted: false,
            results: null
          }
        })
      },

      /**
       * Record answer for a question
       */
      setAnswer: (questionId, optionId) => {
        if (typeof questionId !== 'string' || typeof optionId !== 'string') return

        set((state) => {
          if (!state.activeExam || state.activeExam.isSubmitted) return state

          return {
            activeExam: {
              ...state.activeExam,
              answers: {
                ...state.activeExam.answers,
                [questionId]: optionId
              }
            }
          }
        })
      },

      /**
       * Toggle flag status for a question
       */
      toggleFlag: (questionId) => {
        if (typeof questionId !== 'string') return

        set((state) => {
          if (!state.activeExam || state.activeExam.isSubmitted) return state

          const flagged = state.activeExam.flagged.includes(questionId)
            ? state.activeExam.flagged.filter((id) => id !== questionId)
            : [...state.activeExam.flagged, questionId]

          return {
            activeExam: {
              ...state.activeExam,
              flagged
            }
          }
        })
      },

      /**
       * Navigate to a specific question
       */
      goToQuestion: (index) => {
        const numIndex = Math.round(index)
        if (!Number.isFinite(numIndex) || numIndex < 0) return

        set((state) => {
          if (!state.activeExam || state.activeExam.isSubmitted) return state
          if (numIndex >= state.activeExam.questions.length) return state

          return {
            activeExam: {
              ...state.activeExam,
              currentIndex: numIndex
            }
          }
        })
      },

      /**
       * Pause the exam timer
       */
      pauseExam: () => {
        set((state) => {
          if (!state.activeExam || state.activeExam.isSubmitted || state.activeExam.pausedAt) {
            return state
          }

          return {
            activeExam: {
              ...state.activeExam,
              pausedAt: Date.now()
            }
          }
        })
      },

      /**
       * Resume the exam from pause
       */
      resumeExam: () => {
        set((state) => {
          if (!state.activeExam || !state.activeExam.pausedAt) return state

          const pauseDuration = Date.now() - state.activeExam.pausedAt

          return {
            activeExam: {
              ...state.activeExam,
              pausedAt: null,
              totalPauseTime: state.activeExam.totalPauseTime + pauseDuration
            }
          }
        })
      },

      /**
       * Submit the exam and calculate results
       * Called by Plan subagent to calculate results
       */
      submitExam: () => {
        set((state) => {
          if (!state.activeExam || state.activeExam.isSubmitted) return state

          const { activeExam } = state
          const results = calculateResults(activeExam)

          return {
            activeExam: {
              ...activeExam,
              isSubmitted: true,
              results
            },
            examHistory: [
              ...state.examHistory,
              {
                id: activeExam.id,
                startTime: activeExam.startTime,
                submittedAt: Date.now(),
                results
              }
            ].slice(-10)
          }
        })
      },

      /**
       * Clear active exam (after viewing results)
       */
      clearActiveExam: () => {
        set({ activeExam: null })
      },

      /**
       * Reset all exams (for testing)
       */
      resetExams: () => set(defaultState)
    }),
    {
      name: 'pmp-exam',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState) => {
        // Add migration logic here if needed in the future
        return sanitizeState(persistedState)
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to load exam state from localStorage:', error)
        }
      }
    }
  )
)

/**
 * Calculate exam results from exam state
 * Helper function used in submitExam action
 */
function calculateResults(exam) {
  const { questions, answers } = exam

  let totalCorrect = 0
  const domainScores = {
    people: { correct: 0, total: 0, percentage: 0 },
    process: { correct: 0, total: 0, percentage: 0 },
    business: { correct: 0, total: 0, percentage: 0 }
  }

  const questionResults = questions.map((q) => {
    const userAnswer = answers[q.id] || null
    const isCorrect = userAnswer === q.correctOptionId

    if (isCorrect) {
      totalCorrect++
    }

    const domain = q.domainId || 'people'
    if (domainScores[domain]) {
      domainScores[domain].total++
      if (isCorrect) {
        domainScores[domain].correct++
      }
    }

    return {
      questionId: q.id,
      userAnswer,
      correctAnswer: q.correctOptionId,
      isCorrect,
      domainId: domain
    }
  })

  // Calculate percentages
  const percentageScore = Math.round((totalCorrect / 180) * 1000) / 10 // One decimal place
  const passed = totalCorrect >= 110 // 61% threshold

  Object.keys(domainScores).forEach((domain) => {
    const { correct, total } = domainScores[domain]
    domainScores[domain].percentage = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0
  })

  return {
    totalScore: totalCorrect,
    percentageScore,
    passed,
    timeElapsed: exam.startTime ? Date.now() - exam.startTime : 0,
    timePaused: exam.totalPauseTime || 0,
    domainScores,
    questionResults
  }
}
