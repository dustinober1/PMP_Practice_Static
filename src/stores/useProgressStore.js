import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const defaultState = {
  completedQuestions: [],
  flashcardRatings: {},
  readMaterials: [],
  flashcardBoxes: {}
}

const uniqueList = (items = [], limit = 2000) => {
  if (!Array.isArray(items)) return []
  const seen = new Set()
  const result = []
  for (const item of items) {
    if (typeof item !== 'string') continue
    if (seen.has(item)) continue
    seen.add(item)
    result.push(item)
    if (result.length >= limit) break
  }
  return result
}

const sanitizeRating = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return Math.min(5, Math.max(1, Math.round(num)))
}

const sanitizeRatings = (map = {}, limit = 5000) => {
  if (!map || typeof map !== 'object') return {}
  const entries = Object.entries(map)
  const result = {}
  for (const [key, value] of entries) {
    if (typeof key !== 'string') continue
    const rating = sanitizeRating(value)
    if (!rating) continue
    if (Object.keys(result).length >= limit) break
    result[key] = rating
  }
  return result
}

const sanitizeBoxData = (data = {}) => {
  if (!data || typeof data !== 'object') return {}
  const result = {}
  for (const [key, value] of Object.entries(data)) {
    if (typeof key !== 'string') continue
    if (!value || typeof value !== 'object') continue
    const box = Math.min(5, Math.max(1, Math.round(value.box) || 1))
    const lastReviewed = typeof value.lastReviewed === 'number' ? value.lastReviewed : null
    const nextReview = typeof value.nextReview === 'number' ? value.nextReview : Date.now()
    const reviewCount = Math.max(0, Math.round(value.reviewCount) || 0)
    result[key] = { box, lastReviewed, nextReview, reviewCount }
  }
  return result
}

const sanitizeProgress = (payload = {}) => ({
  completedQuestions: uniqueList(payload.completedQuestions),
  flashcardRatings: sanitizeRatings(payload.flashcardRatings),
  readMaterials: uniqueList(payload.readMaterials),
  flashcardBoxes: sanitizeBoxData(payload.flashcardBoxes)
})

export const useProgressStore = create(
  persist(
    (set, get) => ({
      ...defaultState,
      markQuestionCompleted: (id) => {
        if (typeof id !== 'string') return
        const existing = get().completedQuestions
        if (existing.includes(id)) return
        set({ completedQuestions: [...existing, id] })
      },
      setFlashcardRating: (id, rating) => {
        if (typeof id !== 'string') return
        const next = sanitizeRating(rating)
        if (!next) return
        set((state) => ({
          flashcardRatings: { ...state.flashcardRatings, [id]: next }
        }))
      },
      markMaterialRead: (id) => {
        if (typeof id !== 'string') return
        const existing = get().readMaterials
        if (existing.includes(id)) return
        set({ readMaterials: [...existing, id] })
      },
      reviewFlashcard: (id, rating) => {
        if (typeof id !== 'string' || !['hard', 'good', 'easy'].includes(rating)) return
        const boxes = get().flashcardBoxes
        const current = boxes[id] || { box: 1, lastReviewed: null, nextReview: Date.now(), reviewCount: 0 }

        // Leitner box intervals (in milliseconds)
        const intervals = [24 * 60 * 60 * 1000, 3 * 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000, 14 * 24 * 60 * 60 * 1000, 30 * 24 * 60 * 60 * 1000]
        let nextBox = current.box

        if (rating === 'hard') {
          nextBox = 1 // Reset to box 1
        } else if (rating === 'easy') {
          nextBox = Math.min(5, current.box + 1) // Move up one box
        }
        // 'good' keeps the same box

        const nextReviewTime = Date.now() + intervals[nextBox - 1]

        set((state) => ({
          flashcardBoxes: {
            ...state.flashcardBoxes,
            [id]: {
              box: nextBox,
              lastReviewed: Date.now(),
              nextReview: nextReviewTime,
              reviewCount: current.reviewCount + 1
            }
          }
        }))
      },
      resetProgress: () => set(defaultState),
      importProgress: (payload) => {
        const next = sanitizeProgress(payload)
        set({ ...defaultState, ...next })
      }
    }),
    {
      name: 'pmp-progress',
      storage: createJSONStorage(() => localStorage),
      version: 1
    }
  )
)
