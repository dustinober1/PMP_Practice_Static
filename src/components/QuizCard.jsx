function QuizCard({ question, selectedOptionId, onAnswer }) {
  return (
    <article className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-zinc-800 dark:ring-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
            {question.domainId}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-zinc-50">{question.text}</h3>
        </div>
        <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-zinc-700 dark:text-zinc-300">
          {question.id}
        </span>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">Select the correct answer</legend>
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onAnswer(option.id)}
              role="radio"
              aria-checked={isSelected}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus-ring ${
                isSelected
                  ? 'border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-400 dark:bg-sky-900/30 dark:text-sky-300'
                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600'
              }`}
            >
              <span className="font-semibold">{option.label}</span>
            </button>
          )
        })}
      </fieldset>
    </article>
  )
}

export default QuizCard
