import { useCallback, useEffect, useMemo, useState } from 'react'
import QuizCard from '../components/QuizCard'
import QuizFeedback from '../components/QuizFeedback'
import { useStaticData } from '../hooks/useStaticData'
import { useProgressStore } from '../stores/useProgressStore'

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
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <p className="text-sm font-semibold text-slate-600">Loading questions…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-rose-100 sm:p-8">
        <p className="text-sm font-semibold text-rose-700">Error loading questions</p>
        <p className="text-sm text-rose-600">{error.message}</p>
      </div>
    )
  }

  if (!deck.length) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <p className="text-sm font-semibold text-slate-900">No questions available.</p>
        <p className="text-sm text-slate-600">Try removing filters or add questions.json entries.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quiz</p>
            <h2 className="text-2xl font-bold text-slate-900">Practice questions</h2>
            <p className="text-sm text-slate-600">
              Filter by domain and shuffle. Answers auto-save to localStorage progress.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="all">All domains ({questions.length})</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setDeck(shuffle(filtered))
                setCurrentIndex(0)
                setAnswers({})
              }}
              className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-300"
            >
              Shuffle
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <p>
            Question {currentIndex + 1} of {deck.length}
          </p>
          <p>
            Score: <span className="font-semibold text-slate-900">{score}</span> /{' '}
            {Object.keys(answers).length}
          </p>
          <p>
            Streak:{' '}
            <span className="font-semibold text-slate-900">
              {streak} correct {streak === 1 ? 'answer' : 'answers'} in a row
            </span>
          </p>
        </div>

        <QuizCard
          question={currentQuestion}
          selectedOptionId={selectedOptionId}
          onAnswer={handleAnswer}
        />
        <QuizFeedback question={currentQuestion} selectedOptionId={selectedOptionId} />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            {currentIndex < deck.length - 1 ? 'Next question' : 'Restart & reshuffle'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDeck(shuffle(filtered))
              setCurrentIndex(0)
              setAnswers({})
            }}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:ring-slate-300"
          >
            Reset session
          </button>
        </div>
      </section>
    </div>
  )
}

export default Quiz
