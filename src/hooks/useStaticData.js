import { useEffect, useState } from 'react'

const loaders = {
  domains: () => import('../data/domains.json'),
  tasks: () => import('../data/tasks.json'),
  enablers: () => import('../data/enablers.json'),
  processes: () => import('../data/processes.json'),
  knowledgeAreas: () => import('../data/knowledge_areas.json'),
  questions: () => import('../data/questions.json'),
  flashcardsPeople: () => import('../data/flashcards/people.json'),
  flashcardsProcess: () => import('../data/flashcards/process.json'),
  flashcardsBusiness: () => import('../data/flashcards/business.json')
}

const cache = {}

const loadEntry = async (key) => {
  if (cache[key]) return cache[key]
  const mod = await loaders[key]()
  const data = mod?.default ?? mod
  cache[key] = data
  return data
}

export const loadStaticData = async () => {
  const entries = await Promise.all(
    Object.keys(loaders).map(async (key) => [key, await loadEntry(key)])
  )
  const data = Object.fromEntries(entries)

  // Merge flashcard data from three files into single array
  const flashcards = [
    ...(data.flashcardsPeople || []),
    ...(data.flashcardsProcess || []),
    ...(data.flashcardsBusiness || [])
  ]

  // Add merged flashcards to data, remove individual files
  data.flashcards = flashcards
  delete data.flashcardsPeople
  delete data.flashcardsProcess
  delete data.flashcardsBusiness

  return data
}

export const useStaticData = () => {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    loadStaticData()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
