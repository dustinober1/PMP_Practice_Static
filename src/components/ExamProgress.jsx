import Badge from './Badge'

/**
 * Exam progress display showing current question and counts
 * Shows answered/unanswered/flagged counts
 */
function ExamProgress({ currentIndex, totalQuestions, answeredCount, flaggedCount }) {
  const unansweredCount = totalQuestions - answeredCount

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50 sm:flex sm:items-center sm:justify-between sm:space-y-0">
      <div className="text-sm text-slate-600 dark:text-zinc-400">
        Question <span className="font-semibold text-slate-900 dark:text-zinc-50">{currentIndex + 1}</span> of{' '}
        <span className="font-semibold text-slate-900 dark:text-zinc-50">{totalQuestions}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="primary">
          ✓ <span className="font-semibold">{answeredCount}</span> answered
        </Badge>

        {unansweredCount > 0 && (
          <Badge variant="default">
            ○ <span className="font-semibold">{unansweredCount}</span> remaining
          </Badge>
        )}

        {flaggedCount > 0 && (
          <Badge variant="warning">
            🚩 <span className="font-semibold">{flaggedCount}</span> flagged
          </Badge>
        )}
      </div>
    </div>
  )
}

export default ExamProgress
