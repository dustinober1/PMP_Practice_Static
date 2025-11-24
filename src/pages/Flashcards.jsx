import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStaticData } from '../hooks/useStaticData'
import { useProgressStore } from '../stores/useProgressStore'
import FlashcardCard from '../components/FlashcardCard'
import FlashcardFilters from '../components/FlashcardFilters'
import FlashcardProgress from '../components/FlashcardProgress'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast from '../components/Toast'

const shuffle = (list) => {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function Flashcards() {
  const { data, loading, error } = useStaticData()
  const { flashcardBoxes, reviewFlashcard } = useProgressStore()

  const [filters, setFilters] = useState({
    domain: 'all',
    task: 'all',
    type: 'all',
    mode: 'all'
  })

  const [deck, setDeck] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [toast, setToast] = useState(null)

  const domains = data?.domains ?? []
  const tasks = data?.tasks ?? []
  const flashcards = data?.flashcards ?? []

  // Filter flashcards based on selected filters
  const filtered = useMemo(() => {
    let result = flashcards

    // Domain filter
    if (filters.domain !== 'all') {
      result = result.filter((f) => f.domainId === filters.domain)
    }

    // Task filter
    if (filters.task !== 'all') {
      result = result.filter((f) => f.taskId === filters.task)
    }

    // Type filter
    if (filters.type !== 'all') {
      result = result.filter((f) => f.type === filters.type)
    }

    // Study mode filter
    if (filters.mode === 'due') {
      // Only show cards due for review today
      const now = Date.now()
      result = result.filter((f) => {
        const box = flashcardBoxes[f.id]
        if (!box) return true // New cards are always due
        return box.nextReview <= now
      })
    } else if (filters.mode !== 'all' && filters.mode.startsWith('box')) {
      // Filter by specific box (box1, box2, etc.)
      const targetBox = parseInt(filters.mode.replace('box', ''), 10)
      result = result.filter((f) => {
        const box = flashcardBoxes[f.id]
        if (!box && targetBox === 1) return true // New cards in box 1
        return box?.box === targetBox
      })
    }

    return result
  }, [flashcards, filters, flashcardBoxes])

  // Initialize deck when filtered cards change
  useEffect(() => {
    if (sessionStarted) {
      setDeck(shuffle(filtered))
      setCurrentIndex(0)
    }
  }, [filtered, sessionStarted])

  const currentCard = deck[currentIndex]
  const currentCardBox = currentCard ? flashcardBoxes[currentCard.id]?.box : 1

  const handleStartSession = () => {
    if (filtered.length === 0) {
      setToast({ type: 'warning', message: 'No cards match your filters. Try adjusting them.' })
      return
    }
    setDeck(shuffle(filtered))
    setCurrentIndex(0)
    setSessionStarted(true)
  }

  const handleRate = (rating) => {
    if (!currentCard) return

    reviewFlashcard(currentCard.id, rating)

    const ratingLabels = { hard: 'Hard', good: 'Good', easy: 'Easy' }
    setToast({
      type: 'success',
      message: `Marked as ${ratingLabels[rating]} ✓`
    })

    // Move to next card
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((idx) => idx + 1)
    } else {
      // Session complete
      setToast({
        type: 'success',
        message: '🎉 Session complete! All cards reviewed.'
      })
      setTimeout(() => {
        setSessionStarted(false)
      }, 2000)
    }
  }

  const handleEndSession = () => {
    setSessionStarted(false)
    setCurrentIndex(0)
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((idx) => idx + 1)
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  if (loading) {
    return <LoadingSpinner fullHeight label="Loading flashcards..." />
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
              Error loading flashcards
            </p>
            <p className="text-sm text-rose-600 dark:text-rose-300">{error.message}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card as="section">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                Flashcards
              </p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-50">
                Recall Study
              </h1>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Master PMP concepts with spaced repetition. Cards move through boxes based on your confidence.
              </p>
            </div>
          </div>
        </Card>

        {/* Filters and Progress */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <FlashcardFilters
              domains={domains}
              tasks={tasks}
              filters={filters}
              onFilterChange={handleFilterChange}
            />

            {filtered.length === 0 ? (
              <Card>
                <div className="py-8 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">
                    No flashcards match your filters
                  </p>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
                    Try adjusting your filters or start fresh.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      handleFilterChange({
                        domain: 'all',
                        task: 'all',
                        type: 'all',
                        mode: 'all'
                      })
                    }
                  >
                    Reset Filters
                  </Button>
                </div>
              </Card>
            ) : (
              <Button variant="primary" onClick={handleStartSession} fullWidth size="lg">
                Start Session ({filtered.length} cards)
              </Button>
            )}
          </div>

          {/* Progress Sidebar */}
          <div>
            <FlashcardProgress
              currentIndex={0}
              totalCards={0}
              boxData={flashcardBoxes}
              totalFlashcards={flashcards.length}
            />
          </div>
        </div>
      </div>
    )
  }

  // Session Active
  if (!currentCard) {
    return (
      <div className="space-y-4">
        <Card>
          <div className="py-8 text-center space-y-4">
            <p className="text-lg font-semibold text-slate-900 dark:text-zinc-50">
              Session Complete!
            </p>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              You've reviewed all cards in this session.
            </p>
            <Button variant="primary" onClick={handleEndSession}>
              Back to Filters
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Session Header */}
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600 dark:text-zinc-400">
              Card <span className="font-semibold">{currentIndex + 1}</span> of{' '}
              <span className="font-semibold">{deck.length}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleEndSession}>
              Exit Session
            </Button>
          </div>

          {/* Flashcard */}
          <FlashcardCard card={currentCard} box={currentCardBox} onRate={handleRate} />

          {/* Navigation Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              ← Previous
            </Button>
            <Button
              variant="secondary"
              onClick={handleNext}
              disabled={currentIndex === deck.length - 1}
            >
              Next →
            </Button>
          </div>
        </div>

        {/* Progress Sidebar */}
        <div>
          <FlashcardProgress
            currentIndex={currentIndex + 1}
            totalCards={deck.length}
            boxData={flashcardBoxes}
            totalFlashcards={flashcards.length}
          />
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Flashcards
