/**
 * Exam helper utilities for question selection, shuffling, and formatting
 */

/**
 * Fisher-Yates shuffle algorithm
 * Shuffles array in-place and returns new array
 */
export const shuffle = (list) => {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Select 180 questions maintaining PMP domain distribution
 * Distribution: 42% People (76), 50% Process (90), 8% Business (14)
 * @param {Array} allQuestions - All available questions
 * @returns {Array} 180 selected questions with proper distribution
 * @throws {Error} If insufficient questions in any domain
 */
export const selectExamQuestions = (allQuestions) => {
  const EXAM_SIZE = 180
  const DOMAIN_TARGETS = {
    people: 76,
    process: 90,
    business: 14
  }

  // Group questions by domain
  const byDomain = {
    people: allQuestions.filter((q) => q.domainId === 'people'),
    process: allQuestions.filter((q) => q.domainId === 'process'),
    business: allQuestions.filter((q) => q.domainId === 'business')
  }

  // Validate sufficient questions exist in each domain
  Object.entries(DOMAIN_TARGETS).forEach(([domain, target]) => {
    if (byDomain[domain].length < target) {
      throw new Error(
        `Insufficient ${domain} questions: need ${target}, have ${byDomain[domain].length}`
      )
    }
  })

  // Shuffle and select from each domain
  const selected = []
  Object.entries(DOMAIN_TARGETS).forEach(([domain, count]) => {
    const shuffled = shuffle(byDomain[domain])
    selected.push(...shuffled.slice(0, count))
  })

  // Final shuffle to mix domains
  return shuffle(selected)
}

/**
 * Format milliseconds to H:MM:SS format
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time string
 */
export const formatTime = (milliseconds) => {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return '0:00:00'
  }

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const paddedMinutes = String(minutes).padStart(2, '0')
  const paddedSeconds = String(seconds).padStart(2, '0')

  return `${hours}:${paddedMinutes}:${paddedSeconds}`
}

/**
 * Calculate time remaining in milliseconds
 * @param {number} startTime - Unix timestamp when exam started
 * @param {number} pausedAt - Unix timestamp when paused (or null if running)
 * @param {number} totalPauseTime - Accumulated pause duration in ms
 * @param {number} totalMinutes - Total exam duration in minutes
 * @returns {number} Remaining milliseconds (0 if time expired)
 */
export const calculateTimeRemaining = (startTime, pausedAt, totalPauseTime, totalMinutes) => {
  const totalMs = totalMinutes * 60 * 1000

  // If paused, use the pause time to calculate elapsed
  let elapsed
  if (pausedAt) {
    elapsed = pausedAt - startTime
  } else {
    elapsed = Date.now() - startTime
  }

  const totalElapsed = elapsed + totalPauseTime
  const remaining = totalMs - totalElapsed

  return Math.max(0, remaining)
}

/**
 * Get warning level based on time remaining
 * @param {number} millisecondsRemaining - Time remaining in milliseconds
 * @returns {string} 'normal' | 'warning' | 'critical' | 'expired'
 */
export const getTimeWarningLevel = (millisecondsRemaining) => {
  const minutesRemaining = millisecondsRemaining / (60 * 1000)

  if (millisecondsRemaining <= 0) return 'expired'
  if (minutesRemaining <= 1) return 'critical'
  if (minutesRemaining <= 10) return 'warning'
  return 'normal'
}

/**
 * Filter exam questions by status
 * @param {Array} questionResults - Question results from exam
 * @param {string} filterMode - 'all' | 'incorrect' | 'flagged'
 * @param {Array} flagged - List of flagged question IDs
 * @returns {Array} Filtered question results
 */
export const filterQuestionResults = (questionResults, filterMode, flagged = []) => {
  switch (filterMode) {
    case 'incorrect':
      return questionResults.filter((q) => !q.isCorrect)
    case 'flagged':
      return questionResults.filter((q) => flagged.includes(q.questionId))
    case 'all':
    default:
      return questionResults
  }
}

/**
 * Calculate pagination bounds
 * @param {Array} items - Items to paginate
 * @param {number} currentPage - Current page (0-indexed)
 * @param {number} itemsPerPage - Items per page
 * @returns {Object} { items: paginated items, totalPages: number }
 */
export const paginate = (items, currentPage = 0, itemsPerPage = 20) => {
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const start = currentPage * itemsPerPage
  const end = start + itemsPerPage
  const paginatedItems = items.slice(start, end)

  return {
    items: paginatedItems,
    totalPages,
    currentPage: Math.min(currentPage, totalPages - 1)
  }
}
