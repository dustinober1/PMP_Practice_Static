function QuizCard({ question, selectedOptionId, onAnswer }) {
  return (
    <article className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
            {question.domainId}
          </p>
          <h3 className="text-lg font-semibold text-slate-900">{question.text}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {question.id}
        </span>
      </div>

      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onAnswer(option.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                isSelected
                  ? 'border-sky-500 bg-sky-50 text-sky-900'
                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="font-semibold">{option.label}</span>
            </button>
          )
        })}
      </div>
    </article>
  )
}

export default QuizCard
