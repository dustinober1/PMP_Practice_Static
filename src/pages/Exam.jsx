import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStaticData } from '../hooks/useStaticData'
import { useExamStore } from '../stores/useExamStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import ExamTimer from '../components/ExamTimer'
import ExamNavigator from '../components/ExamNavigator'
import ExamProgress from '../components/ExamProgress'
import QuizCard from '../components/QuizCard'
import Toast from '../components/Toast'
import {
  selectExamQuestions,
  formatTime,
  filterQuestionResults,
  paginate
} from '../utils/examHelpers'
import { generateExamPDF } from '../utils/generateExamPDF'

const EXAM_DURATION_MINUTES = 3 + 50 / 60 // 3 hours 50 minutes = 230 minutes

function Exam() {
  const { data, loading, error } = useStaticData()
  const navigate = useNavigate()
  const [view, setView] = useState('start')
  const [showNavigator, setShowNavigator] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showTimeExpiredModal, setShowTimeExpiredModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [startError, setStartError] = useState(null)
  const [filterMode, setFilterMode] = useState('all')
  const [resultsPage, setResultsPage] = useState(0)

  const activeExam = useExamStore((state) => state.activeExam)
  const startExam = useExamStore((state) => state.startExam)
  const setAnswer = useExamStore((state) => state.setAnswer)
  const toggleFlag = useExamStore((state) => state.toggleFlag)
  const goToQuestion = useExamStore((state) => state.goToQuestion)
  const pauseExam = useExamStore((state) => state.pauseExam)
  const resumeExam = useExamStore((state) => state.resumeExam)
  const submitExamAction = useExamStore((state) => state.submitExam)
  const clearActiveExam = useExamStore((state) => state.clearActiveExam)

  const questions = data?.questions ?? []

  // Handle window close warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (activeExam && !activeExam.isSubmitted) {
        e.preventDefault()
        e.returnValue = 'You have an exam in progress. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [activeExam])

  // Auto-resume if exam exists and not submitted
  useEffect(() => {
    if (activeExam && !activeExam.isSubmitted && view === 'start') {
      // Defer state update to avoid cascading renders
      const timer = setTimeout(() => setView('exam'), 0)
      return () => clearTimeout(timer)
    } else if (activeExam && activeExam.isSubmitted && view === 'start') {
      // Defer state update to avoid cascading renders
      const timer = setTimeout(() => setView('results'), 0)
      return () => clearTimeout(timer)
    }
  }, [activeExam, view])

  const handleStartExam = useCallback(() => {
    try {
      setStartError(null)
      const selectedQuestions = selectExamQuestions(questions)
      startExam(selectedQuestions)
      setView('exam')
    } catch (error) {
      setStartError(error.message)
    }
  }, [questions, startExam])

  const handleAnswer = useCallback(
    (optionId) => {
      if (!activeExam) return
      const currentQuestion = activeExam.questions[activeExam.currentIndex]
      if (currentQuestion) {
        setAnswer(currentQuestion.id, optionId)
      }
    },
    [activeExam, setAnswer]
  )

  const handlePrevious = useCallback(() => {
    if (!activeExam || activeExam.currentIndex === 0) return
    goToQuestion(activeExam.currentIndex - 1)
  }, [activeExam, goToQuestion])

  const handleNext = useCallback(() => {
    if (!activeExam || activeExam.currentIndex >= activeExam.questions.length - 1) return
    goToQuestion(activeExam.currentIndex + 1)
  }, [activeExam, goToQuestion])

  const handleTimeUp = useCallback(() => {
    if (!activeExam || activeExam.isSubmitted) return
    setShowTimeExpiredModal(true)
    // Auto-submit after 5 seconds
    setTimeout(() => {
      submitExamAction()
      setShowTimeExpiredModal(false)
      setView('results')
    }, 5000)
  }, [activeExam, submitExamAction])

  const handleSubmitExam = useCallback(() => {
    submitExamAction()
    setShowSubmitModal(false)
    setView('results')
  }, [submitExamAction])

  const handleRetakeExam = useCallback(() => {
    clearActiveExam()
    setView('start')
    setResultsPage(0)
  }, [clearActiveExam])

  const handleExportPDF = useCallback(() => {
    try {
      if (!activeExam?.results) return
      generateExamPDF(activeExam.results, activeExam.questions)
      setToast({ message: 'PDF exported successfully!', type: 'success' })
    } catch {
      setToast({ message: 'Failed to export PDF', type: 'error' })
    }
  }, [activeExam])

  // Derived state
  const currentQuestion = activeExam?.questions[activeExam.currentIndex]
  const selectedOptionId = activeExam && currentQuestion ? activeExam.answers[currentQuestion.id] : null
  const answeredCount = activeExam ? Object.keys(activeExam.answers).length : 0

  // Results filtering and pagination
  const filteredResults = useMemo(() => {
    if (!activeExam?.results) return []
    return filterQuestionResults(activeExam.results.questionResults, filterMode, activeExam.flagged)
  }, [activeExam, filterMode])

  const paginatedResults = useMemo(() => {
    return paginate(filteredResults, resultsPage, 20)
  }, [filteredResults, resultsPage])

  // ===== VIEWS =====

  // Start screen
  if (view === 'start') {
    return (
      <div className="space-y-6">
        <Card as="section">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                Exam
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">
                Practice Exam
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Full-length PMP exam simulation
              </p>
            </div>

            <div className="space-y-4 rounded-lg bg-slate-50 p-4 dark:bg-zinc-800/50">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                    Duration
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50">
                    3h 50m
                  </p>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">230 minutes</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                    Questions
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50">180</p>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
                    76 People • 90 Process • 14 Business
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-zinc-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">Exam format:</p>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-zinc-400">
                  <li>• No immediate feedback during exam</li>
                  <li>• Full results review after submission</li>
                  <li>• Domain breakdown by performance</li>
                  <li>• Passing score: 61% (110/180)</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Error state */}
        {startError && (
          <Card className="border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20">
            <div className="space-y-2">
              <p className="font-semibold text-rose-700 dark:text-rose-400">
                Cannot start exam
              </p>
              <p className="text-sm text-rose-600 dark:text-rose-300">{startError}</p>
            </div>
          </Card>
        )}

        {/* Resume or start */}
        {activeExam && !activeExam.isSubmitted ? (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              ⚠️ You have an exam in progress
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-300">
              Started at {new Date(activeExam.startTime).toLocaleTimeString()}
            </p>
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => setView('exam')}>
                Resume Exam
              </Button>
              <Button variant="secondary" onClick={handleRetakeExam}>
                Start New Exam
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartExam}
            fullWidth
            disabled={loading || error}
          >
            {loading ? 'Loading...' : 'Start Exam'}
          </Button>
        )}

        {error && (
          <Card className="border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20">
            <p className="text-sm text-rose-600 dark:text-rose-300">{error.message}</p>
          </Card>
        )}
      </div>
    )
  }

  // Exam interface
  if (view === 'exam' && activeExam && !activeExam.isSubmitted) {
    return (
      <div className="space-y-6">
        {/* Timer Header */}
        <Card as="section">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <ExamTimer
                startTime={activeExam.startTime}
                pausedAt={activeExam.pausedAt}
                totalPauseTime={activeExam.totalPauseTime}
                totalMinutes={EXAM_DURATION_MINUTES}
                onTimeUp={handleTimeUp}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (activeExam.pausedAt) {
                    resumeExam()
                  } else {
                    pauseExam()
                    setShowPauseModal(true)
                  }
                }}
              >
                {activeExam.pausedAt ? '▶️ Resume' : '⏸️ Pause'}
              </Button>

              <Button variant="secondary" onClick={() => setShowSubmitModal(true)}>
                Submit
              </Button>
            </div>
          </div>
        </Card>

        {/* Progress Bar */}
        <ExamProgress
          currentIndex={activeExam.currentIndex}
          totalQuestions={activeExam.questions.length}
          answeredCount={answeredCount}
          flaggedCount={activeExam.flagged.length}
        />

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowNavigator(true)}
            className="flex-1"
          >
            Question Navigator ({activeExam.currentIndex + 1}/{activeExam.questions.length})
          </Button>

          <Button
            variant={activeExam.flagged.includes(currentQuestion?.id) ? 'primary' : 'secondary'}
            onClick={() => toggleFlag(currentQuestion?.id)}
            disabled={!currentQuestion}
            aria-pressed={activeExam.flagged.includes(currentQuestion?.id)}
          >
            🚩 Flag
          </Button>
        </div>

        {/* Question Card */}
        {currentQuestion ? (
          <QuizCard
            question={currentQuestion}
            selectedOptionId={selectedOptionId}
            onAnswer={handleAnswer}
          />
        ) : (
          <LoadingSpinner label="Loading question" />
        )}

        {/* Navigation */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={activeExam.currentIndex === 0}
          >
            ← Previous
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={activeExam.currentIndex >= activeExam.questions.length - 1}
            className="flex-1 sm:flex-none"
          >
            Next →
          </Button>
        </div>

        {/* Modals */}

        {/* Pause Modal */}
        {showPauseModal && activeExam.pausedAt && (
          <Modal title="Exam Paused" onClose={() => setShowPauseModal(false)} showCloseButton={false}>
            <div className="space-y-4 text-center">
              <div className="text-6xl">⏸️</div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-zinc-50">
                  The exam is paused
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                  Questions are hidden to maintain exam integrity.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  resumeExam()
                  setShowPauseModal(false)
                }}
                fullWidth
              >
                Resume Exam
              </Button>
            </div>
          </Modal>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <Modal title="Submit Exam?" onClose={() => setShowSubmitModal(false)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-700 dark:text-zinc-300">
                  You have answered{' '}
                  <span className="font-semibold text-slate-900 dark:text-zinc-50">
                    {answeredCount}
                  </span>{' '}
                  out of{' '}
                  <span className="font-semibold text-slate-900 dark:text-zinc-50">
                    {activeExam.questions.length}
                  </span>{' '}
                  questions.
                </p>

                {activeExam.questions.length - answeredCount > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      ⚠️ {activeExam.questions.length - answeredCount} questions unanswered
                    </p>
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                      Unanswered questions will be marked incorrect.
                    </p>
                  </div>
                )}

                {activeExam.flagged.length > 0 && (
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
                    You have{' '}
                    <span className="font-semibold text-slate-900 dark:text-zinc-50">
                      {activeExam.flagged.length}
                    </span>{' '}
                    flagged questions.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowSubmitModal(false)}
                  fullWidth
                >
                  Go Back
                </Button>
                <Button variant="primary" onClick={handleSubmitExam} fullWidth>
                  Submit Exam
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Time Expired Modal */}
        {showTimeExpiredModal && (
          <Modal
            title="Time Expired"
            onClose={() => {}}
            showCloseButton={false}
          >
            <div className="space-y-4 text-center">
              <div className="text-6xl">⏱️</div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-zinc-50">
                  The 230-minute time limit has been reached.
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                  Your exam will be automatically submitted with your current answers.
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-500">Submitting in a few seconds...</p>
            </div>
          </Modal>
        )}

        {/* Navigator Modal */}
        {showNavigator && (
          <Modal
            title="Question Navigator"
            onClose={() => setShowNavigator(false)}
          >
            <ExamNavigator
              questions={activeExam.questions}
              answers={activeExam.answers}
              flagged={activeExam.flagged}
              currentIndex={activeExam.currentIndex}
              onNavigate={goToQuestion}
              onClose={() => setShowNavigator(false)}
            />
          </Modal>
        )}

        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    )
  }

  // Results screen
  if (view === 'results' && activeExam?.results) {
    const { results } = activeExam

    return (
      <div className="space-y-6">
        {/* Hero Summary */}
        <Card as="section">
          <div className="space-y-6 text-center">
            <div>
              <Badge variant={results.passed ? 'success' : 'error'} className="mb-4">
                {results.passed ? '✓ PASSED' : '✗ NOT PASSED'}
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-50">
                {results.percentageScore}%
              </h2>
              <p className="mt-2 text-lg text-slate-600 dark:text-zinc-400">
                {results.totalScore} / 180 correct
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                Passing score: 61% (110/180)
              </p>
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-zinc-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                Time
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-zinc-50">
                {formatTime(results.timeElapsed)}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
                Active: {formatTime(results.timeElapsed - results.timePaused)}
              </p>
            </div>
          </div>
        </Card>

        {/* Domain Breakdown */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(results.domainScores).map(([domain, score]) => (
            <Card key={domain} as="section">
              <div className="space-y-3">
                <h3 className="font-semibold capitalize text-slate-900 dark:text-zinc-50">
                  {domain === 'people' ? 'People' : domain === 'process' ? 'Process' : 'Business'}
                </h3>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                    {score.percentage}%
                  </p>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
                    {score.correct}/{score.total} correct
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                    style={{ width: `${score.percentage}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Question Review */}
        <Card as="section">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-zinc-50">Review Questions</h3>
              <div className="flex gap-2">
                <Button
                  variant={filterMode === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setFilterMode('all')
                    setResultsPage(0)
                  }}
                >
                  All ({results.questionResults.length})
                </Button>
                <Button
                  variant={filterMode === 'incorrect' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setFilterMode('incorrect')
                    setResultsPage(0)
                  }}
                >
                  Incorrect ({results.questionResults.filter((q) => !q.isCorrect).length})
                </Button>
                <Button
                  variant={filterMode === 'flagged' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setFilterMode('flagged')
                    setResultsPage(0)
                  }}
                  disabled={activeExam.flagged.length === 0}
                >
                  Flagged ({activeExam.flagged.length})
                </Button>
              </div>
            </div>

            {/* Pagination */}
            {paginatedResults.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Showing {resultsPage * 20 + 1}-{Math.min((resultsPage + 1) * 20, filteredResults.length)} of{' '}
                  {filteredResults.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setResultsPage(Math.max(0, resultsPage - 1))}
                    disabled={resultsPage === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setResultsPage(resultsPage + 1)}
                    disabled={resultsPage >= paginatedResults.totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {paginatedResults.items.map((questionResult) => {
                const globalIndex = results.questionResults.findIndex(
                  (q) => q.questionId === questionResult.questionId
                )
                const question = activeExam.questions.find(
                  (q) => q.id === questionResult.questionId
                )

                if (!question) return null

                return (
                  <div
                    key={questionResult.questionId}
                    className={`rounded-xl border-2 p-4 ${
                      questionResult.isCorrect
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                        : 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={questionResult.isCorrect ? 'success' : 'error'}>
                          Q{globalIndex + 1}
                        </Badge>
                        <Badge variant="default">{questionResult.domainId}</Badge>
                      </div>
                      {questionResult.isCorrect && <span className="text-xl">✓</span>}
                      {!questionResult.isCorrect && <span className="text-xl">✗</span>}
                    </div>

                    <h4 className="mb-4 font-semibold text-slate-900 dark:text-zinc-50">
                      {question.text}
                    </h4>

                    <div className="space-y-2">
                      {question.options.map((option) => {
                        const isCorrectAnswer = option.id === questionResult.correctAnswer
                        const isUserAnswer = option.id === questionResult.userAnswer
                        const isWrongAnswer = isUserAnswer && !questionResult.isCorrect

                        return (
                          <div
                            key={option.id}
                            className={`rounded-lg border-2 p-3 text-sm ${
                              isCorrectAnswer
                                ? 'border-emerald-500 bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-900/30'
                                : isWrongAnswer
                                  ? 'border-rose-500 bg-rose-100 dark:border-rose-600 dark:bg-rose-900/30'
                                  : 'border-slate-200 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {isCorrectAnswer && (
                                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                  ✓
                                </span>
                              )}
                              {isWrongAnswer && (
                                <span className="font-bold text-rose-700 dark:text-rose-300">✗</span>
                              )}
                              <span
                                className={`font-medium ${
                                  isCorrectAnswer || isWrongAnswer
                                    ? ''
                                    : 'text-slate-600 dark:text-zinc-400'
                                }`}
                              >
                                {option.label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                        Explanation
                      </p>
                      <p className="mt-2 text-sm text-slate-700 dark:text-zinc-300">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" onClick={handleRetakeExam} fullWidth>
              Retake Exam (New Questions)
            </Button>
            <Button variant="secondary" onClick={() => navigate('/quiz')} fullWidth>
              Return to Practice
            </Button>
          </div>
          <Button variant="secondary" onClick={handleExportPDF} fullWidth>
            📄 Export as PDF
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner fullHeight label="Loading exam..." />
  }

  // Error state
  if (error) {
    return (
      <Card>
        <div className="space-y-2">
          <p className="font-semibold text-rose-700 dark:text-rose-400">Error loading exam</p>
          <p className="text-sm text-rose-600 dark:text-rose-300">{error.message}</p>
        </div>
      </Card>
    )
  }

  return null
}

export default Exam
