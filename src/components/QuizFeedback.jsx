function QuizFeedback({ question, selectedOptionId }) {
  if (!selectedOptionId) return null
  const isCorrect = selectedOptionId === question.correctOptionId
  const selected = question.options.find((o) => o.id === selectedOptionId)
  const correct = question.options.find((o) => o.id === question.correctOptionId)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={isCorrect ? 'Correct answer' : 'Incorrect answer'}
      className={`animate-fade-in rounded-xl px-4 py-3 text-sm ring-1 ${
        isCorrect
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
          : 'bg-rose-50 text-rose-800 ring-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800'
      }`}
    >
      <p className="font-semibold">{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
      {!isCorrect && selected ? (
        <p className="mt-2 text-sm">
          You chose: <span className="font-semibold">{selected.label}</span>
        </p>
      ) : null}
      {correct ? (
        <p className="mt-2 text-sm">
          Correct answer: <span className="font-semibold">{correct.label}</span>
        </p>
      ) : null}
      <p className="mt-3 text-sm">{question.explanation}</p>
    </div>
  )
}

export default QuizFeedback
