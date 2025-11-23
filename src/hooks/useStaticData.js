import { useEffect, useState } from 'react'

const loaders = {
  domains: () => import('../data/domains.json'),
  tasks: () => import('../data/tasks.json'),
  enablers: () => import('../data/enablers.json'),
  processes: () => import('../data/processes.json'),
  knowledgeAreas: () => import('../data/knowledge_areas.json')
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
  return Object.fromEntries(entries)
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
