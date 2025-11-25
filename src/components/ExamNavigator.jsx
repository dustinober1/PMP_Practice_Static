import { useEffect, useRef } from 'react'
import Badge from './Badge'

/**
 * Question navigator modal showing grid of all 180 questions
 * Click to jump to any question
 * Keyboard navigable with visual indicators for status
 */
function ExamNavigator({ questions, answers, flagged, currentIndex, onNavigate, onClose }) {
  const buttonRefs = useRef({})

  // Focus current question button
  useEffect(() => {
    const currentButton = buttonRefs.current[currentIndex]
    if (currentButton) {
      currentButton.focus()
    }
  }, [currentIndex])

  const answeredCount = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount

  const handleNavigate = (index) => {
    onNavigate(index)
    onClose()
  }

  return (
    <div className="space-y-6">
      {/* Question Grid */}
      <div className="grid gap-2 sm:grid-cols-6 lg:grid-cols-10">
        {questions.map((question, index) => {
          const isAnswered = !!answers[question.id]
          const isFlagged = flagged.includes(question.id)
          const isCurrent = index === currentIndex

          return (
            <button
              key={question.id}
              ref={(el) => {
                if (el) buttonRefs.current[index] = el
              }}
              onClick={() => handleNavigate(index)}
              className={`group relative flex h-10 items-center justify-center rounded-lg font-semibold text-sm transition focus-ring ${
                isCurrent
                  ? 'ring-2 ring-sky-500 ring-offset-1 dark:ring-offset-0'
                  : ''
              } ${
                isAnswered
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
              }`}
              aria-label={`Question ${index + 1}${isAnswered ? ', answered' : ', unanswered'}${
                isFlagged ? ', flagged' : ''
              }${isCurrent ? ', current' : ''}`}
            >
              {index + 1}
              {isFlagged && (
                <span
                  className="absolute -right-1 -top-1 text-lg"
                  aria-hidden="true"
                >
                  🚩
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-zinc-800/50">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-50">Legend</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40" />
            <span className="text-sm text-slate-600 dark:text-zinc-400">
              Answered ({answeredCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-zinc-700" />
            <span className="text-sm text-slate-600 dark:text-zinc-400">
              Unanswered ({unansweredCount})
            </span>
          </div>
          {flagged.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center text-lg">🚩</div>
              <span className="text-sm text-slate-600 dark:text-zinc-400">
                Flagged ({flagged.length})
              </span>
            </div>
          )}
        </div>

        {/* Progress Summary */}
        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-zinc-700">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-zinc-400">Overall Progress</span>
            <span className="font-semibold text-slate-900 dark:text-zinc-50">
              {answeredCount} / {questions.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-slate-500 dark:text-zinc-400">
        Click any question number to navigate. Press Escape to close.
      </p>
    </div>
  )
}

export default ExamNavigator
