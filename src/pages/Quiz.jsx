import { useCallback, useEffect, useMemo, useState } from 'react'
import QuizCard from '../components/QuizCard'
import QuizFeedback from '../components/QuizFeedback'
import { useStaticData } from '../hooks/useStaticData'
import { useProgressStore } from '../stores/useProgressStore'
import Card from '../components/Card'
import Select from '../components/Select'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import Badge from '../components/Badge'

const shuffle = (list) => {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function Quiz() {
  const { data, loading, error } = useStaticData()
  const [domainFilter, setDomainFilter] = useState('all')
  const [deck, setDeck] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [answerOrder, setAnswerOrder] = useState([])

  const markQuestionCompleted = useProgressStore((state) => state.markQuestionCompleted)

  const domains = data?.domains ?? []
  const questions = data?.questions ?? []

  const filtered = useMemo(
    () => questions.filter((q) => domainFilter === 'all' || q.domainId === domainFilter),
    [questions, domainFilter]
  )

  useEffect(() => {
    setDeck(shuffle(filtered))
    setCurrentIndex(0)
    setAnswers({})
    setAnswerOrder([])
  }, [filtered])

  const currentQuestion = deck[currentIndex]
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] : null

  const isCorrect = useCallback(
    (id) => {
      const q = questions.find((item) => item.id === id)
      if (!q) return false
      return answers[id] === q.correctOptionId
    },
    [answers, questions]
  )

  const score = useMemo(
    () => Object.keys(answers).filter((id) => isCorrect(id)).length,
    [answers, isCorrect]
  )

  const streak = useMemo(() => {
    let count = 0
    for (let i = answerOrder.length - 1; i >= 0; i -= 1) {
      if (isCorrect(answerOrder[i])) {
        count += 1
      } else {
        break
      }
    }
    return count
  }, [answerOrder, isCorrect])

  const handleAnswer = (optionId) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }))
    setAnswerOrder((prev) =>
      prev.includes(currentQuestion.id) ? prev : [...prev, currentQuestion.id]
    )
    markQuestionCompleted(currentQuestion.id)
  }

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((idx) => idx + 1)
    } else {
      setDeck(shuffle(filtered))
      setCurrentIndex(0)
      setAnswers({})
      setAnswerOrder([])
    }
  }

  if (loading) {
    return <LoadingSpinner fullHeight={true} label="Loading questions" />
  }

  if (error) {
    return (
      <Card>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Error loading questions</p>
          <p className="text-sm text-rose-600 dark:text-rose-300">{error.message}</p>
        </div>
      </Card>
    )
  }

  if (!deck.length) {
    return (
      <Card>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">No questions available.</p>
          <p className="text-sm text-slate-600 dark:text-zinc-400">Try removing filters or add questions.json entries.</p>
        </div>
      </Card>
    )
  }

  const domainOptions = [
    { value: 'all', label: `All domains (${questions.length})` },
    ...domains.map((domain) => ({
      value: domain.id,
      label: domain.name
    }))
  ]

  return (
    <div className="space-y-6">
      <Card as="section">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">Quiz</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Practice questions</h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Filter by domain and shuffle. Answers auto-save to localStorage progress.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 sm:max-w-xs">
              <Select
                id="domain-filter"
                label="Filter by domain"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                options={domainOptions}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setDeck(shuffle(filtered))
                setCurrentIndex(0)
                setAnswers({})
              }}
            >
              Shuffle deck
            </Button>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600 dark:text-zinc-400">
            Question <span className="font-semibold">{currentIndex + 1}</span> of <span className="font-semibold">{deck.length}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="primary">
              Score: <span className="font-semibold">{score}</span>/{Object.keys(answers).length}
            </Badge>
            <Badge variant={streak > 0 ? 'success' : 'default'}>
              🔥 {streak} streak
            </Badge>
          </div>
        </div>

        <QuizCard
          question={currentQuestion}
          selectedOptionId={selectedOptionId}
          onAnswer={handleAnswer}
        />
        <QuizFeedback question={currentQuestion} selectedOptionId={selectedOptionId} />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="primary"
            onClick={handleNext}
          >
            {currentIndex < deck.length - 1 ? 'Next question' : 'Restart & reshuffle'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDeck(shuffle(filtered))
              setCurrentIndex(0)
              setAnswers({})
              setAnswerOrder([])
            }}
          >
            Reset session
          </Button>
        </div>
      </section>
    </div>
  )
}

export default Quiz
