import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const defaultState = {
  completedQuestions: [],
  flashcardRatings: {},
  readMaterials: []
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

const sanitizeProgress = (payload = {}) => ({
  completedQuestions: uniqueList(payload.completedQuestions),
  flashcardRatings: sanitizeRatings(payload.flashcardRatings),
  readMaterials: uniqueList(payload.readMaterials)
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
