import { useState } from 'react'
import Badge from './Badge'

function FlashcardCard({ card, box, onRate, isDisabled = false }) {
  const [isRevealed, setIsRevealed] = useState(false)

  const typeColors = {
    definition: 'primary',
    process: 'warning',
    formula: 'warning',
    concept: 'primary'
  }

  const handleReveal = () => {
    if (!isDisabled) {
      setIsRevealed(!isRevealed)
    }
  }

  const handleRate = (rating) => {
    if (!isDisabled && isRevealed) {
      onRate(rating)
      // Reset for next card
      setIsRevealed(false)
    }
  }

  return (
    <article className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-zinc-800 dark:ring-zinc-700">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" size="xs">
              {card.domainId}
            </Badge>
            <Badge variant="default" size="xs">
              {card.type}
            </Badge>
            {box && (
              <Badge variant="default" size="xs">
                Box {box}
              </Badge>
            )}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400">
            {card.id}
          </p>
        </div>
      </div>

      {/* Card Content - Flip Animation */}
      <div
        className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
          isRevealed ? 'min-h-[200px]' : 'min-h-[150px]'
        }`}
      >
        <div
          className={`rounded-xl bg-slate-50 p-6 dark:bg-zinc-900 ${
            isRevealed
              ? 'border-l-4 border-emerald-500 dark:border-emerald-400'
              : 'border-l-4 border-sky-500 dark:border-sky-400'
          }`}
        >
          {!isRevealed ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400">
                Front
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-zinc-50">
                {card.front}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Click "Reveal Answer" to see the answer
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Answer
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    {card.front}
                  </p>
                </div>
                <div className="whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-slate-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {card.back}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {!isRevealed ? (
          <button
            onClick={handleReveal}
            disabled={isDisabled}
            className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 focus-ring disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            Reveal Answer
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              How was that?
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleRate('hard')}
                disabled={isDisabled}
                className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 font-semibold text-rose-700 transition hover:bg-rose-100 focus-ring disabled:opacity-50 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50"
                aria-label="Mark as hard"
              >
                <span className="sm:hidden">🔴</span>
                <span className="hidden sm:inline">Hard</span>
              </button>
              <button
                onClick={() => handleRate('good')}
                disabled={isDisabled}
                className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 font-semibold text-amber-700 transition hover:bg-amber-100 focus-ring disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
                aria-label="Mark as good"
              >
                <span className="sm:hidden">🟡</span>
                <span className="hidden sm:inline">Good</span>
              </button>
              <button
                onClick={() => handleRate('easy')}
                disabled={isDisabled}
                className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100 focus-ring disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                aria-label="Mark as easy"
              >
                <span className="sm:hidden">🟢</span>
                <span className="hidden sm:inline">Easy</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export default FlashcardCard
