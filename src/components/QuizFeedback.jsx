function QuizFeedback({ question, selectedOptionId }) {
  if (!selectedOptionId) return null
  const isCorrect = selectedOptionId === question.correctOptionId
  const selected = question.options.find((o) => o.id === selectedOptionId)
  const correct = question.options.find((o) => o.id === question.correctOptionId)

  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm ring-1 ${
        isCorrect
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
          : 'bg-rose-50 text-rose-800 ring-rose-100'
      }`}
    >
      <p className="font-semibold">{isCorrect ? 'Correct' : 'Incorrect'}</p>
      {!isCorrect && selected ? (
        <p className="mt-1 text-slate-700">
          You chose: <span className="font-semibold">{selected.label}</span>
        </p>
      ) : null}
      {correct ? (
        <p className="mt-1 text-slate-700">
          Correct answer: <span className="font-semibold">{correct.label}</span>
        </p>
      ) : null}
      <p className="mt-2 text-slate-700">{question.explanation}</p>
    </div>
  )
}

export default QuizFeedback
