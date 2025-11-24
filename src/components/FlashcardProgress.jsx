import Card from './Card'

function FlashcardProgress({ currentIndex, totalCards, boxData, totalFlashcards }) {
  const boxDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  }

  // Count cards in each box from boxData
  Object.values(boxData).forEach((data) => {
    if (data.box >= 1 && data.box <= 5) {
      boxDistribution[data.box]++
    }
  })

  // Cards never reviewed are in "box 0" (unreviewed)
  const unreviewedCount = totalFlashcards - Object.keys(boxData).length
  const masteredCount = boxDistribution[5]
  const masteryPercentage = totalFlashcards > 0 ? Math.round((masteredCount / totalFlashcards) * 100) : 0

  const boxLabels = ['Box 1\n(Daily)', 'Box 2\n(3 days)', 'Box 3\n(Weekly)', 'Box 4\n(Bi-weekly)', 'Box 5\n(Mastered)']
  const boxColors = [
    'bg-rose-500 dark:bg-rose-600',
    'bg-amber-500 dark:bg-amber-600',
    'bg-blue-500 dark:bg-blue-600',
    'bg-indigo-500 dark:bg-indigo-600',
    'bg-emerald-500 dark:bg-emerald-600'
  ]

  const maxInBox = Math.max(...Object.values(boxDistribution), unreviewedCount || 1)

  return (
    <div className="space-y-4">
      {/* Session Progress */}
      <Card as="section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-zinc-50">Session Progress</h3>
          <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
            {currentIndex} of {totalCards}
          </span>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
            <div
              className="h-full bg-sky-500 transition-all dark:bg-sky-400"
              style={{
                width: totalCards > 0 ? `${(currentIndex / totalCards) * 100}%` : '0%'
              }}
            />
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            {totalCards > 0
              ? `${Math.round((currentIndex / totalCards) * 100)}% complete`
              : 'No cards in current session'}
          </p>
        </div>
      </Card>

      {/* Mastery Overview */}
      <Card as="section" className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-50">Mastery Overview</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400">
              Mastered
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {masteryPercentage}%
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              {masteredCount} cards
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400">
              In Review
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {boxDistribution[1] + boxDistribution[2] + boxDistribution[3]}
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              cards
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400">
              Ready
            </p>
            <p className="mt-1 text-2xl font-bold text-sky-600 dark:text-sky-400">
              {boxDistribution[4]}
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              advanced
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400">
              New
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-600 dark:text-zinc-400">
              {unreviewedCount}
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              cards
            </p>
          </div>
        </div>
      </Card>

      {/* Box Distribution Chart */}
      <Card as="section" className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-50">Box Distribution</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((box) => (
            <div key={box} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {boxLabels[box - 1]}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  {boxDistribution[box]}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
                <div
                  className={`h-full transition-all ${boxColors[box - 1]}`}
                  style={{
                    width: maxInBox > 0 ? `${(boxDistribution[box] / maxInBox) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default FlashcardProgress
