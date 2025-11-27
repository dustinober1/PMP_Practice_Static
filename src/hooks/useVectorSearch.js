import { useEffect, useState } from 'react'

/**
 * Vector similarity search hook for RAG pipeline
 * Loads vector database and provides semantic search capabilities
 */
export const useVectorSearch = () => {
  const [state, setState] = useState({
    metadata: null,
    embeddings: null,
    summary: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const loadVectorDB = async () => {
      try {
        // Load metadata and embeddings
        const [metadataRes, embeddingsRes, summaryRes] = await Promise.all([
          import('../data/vectors/chunks-metadata.json'),
          import('../data/vectors/embeddings.json'),
          import('../data/vectors/index-summary.json')
        ])

        const metadata = metadataRes.default || metadataRes
        const embeddings = embeddingsRes.default || embeddingsRes
        const summary = summaryRes.default || summaryRes

        // Create embedding map for quick lookup
        const embeddingMap = {}
        if (Array.isArray(embeddings)) {
          embeddings.forEach((item) => {
            embeddingMap[item.id] = item.embedding
          })
        }

        setState({
          metadata,
          embeddings: embeddingMap,
          summary,
          loading: false,
          error: null
        })
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message
        }))
      }
    }

    loadVectorDB()
  }, [])

  /**
   * Compute cosine similarity between two vectors
   */
  const cosineSimilarity = (vec1, vec2) => {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2)
    return denominator === 0 ? 0 : dotProduct / denominator
  }

  /**
   * Search for similar chunks using vector similarity
   * @param {number[]} queryEmbedding - The embedding vector of the query
   * @param {number} topK - Number of results to return
   * @returns {Array} - Array of matching chunks with similarity scores
   */
  const search = (queryEmbedding, topK = 5) => {
    if (!state.metadata || !state.embeddings) {
      return []
    }

    const scores = state.metadata.map((chunk) => {
      const embedding = state.embeddings[chunk.embeddingId] || state.embeddings[chunk.id]
      const score = embedding ? cosineSimilarity(queryEmbedding, embedding) : 0

      return {
        ...chunk,
        similarity: score
      }
    })

    // Sort by similarity and return top K
    return scores.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
  }

  /**
   * Search by chapter/topic (keyword search as fallback)
   */
  const searchByChapter = (chapterQuery, topK = 5) => {
    if (!state.metadata) return []

    const query = chapterQuery.toLowerCase()
    const matches = state.metadata
      .filter((chunk) => {
        const chapter = (chunk.chapter || '').toLowerCase()
        const section = (chunk.section || '').toLowerCase()
        const content = chunk.content.toLowerCase()

        return chapter.includes(query) || section.includes(query) || content.includes(query)
      })
      .slice(0, topK)

    return matches
  }

  /**
   * Get chunks by source file
   */
  const getBySource = (source) => {
    if (!state.metadata) return []
    return state.metadata.filter((chunk) => chunk.source === source)
  }

  /**
   * Get all chapters from the vector database
   */
  const getChapters = () => {
    return state.summary?.chapters || []
  }

  /**
   * Get all source files from the vector database
   */
  const getSources = () => {
    return state.summary?.sourceFiles || []
  }

  return {
    ...state,
    search,
    searchByChapter,
    getBySource,
    getChapters,
    getSources,
    ready: !state.loading && !state.error
  }
}

/**
 * Async function to get embeddings from Ollama
 * Can be used outside React components
 */
export async function getQueryEmbedding(text, model = 'nomic-embed-text') {
  try {
    const response = await fetch('http://localhost:11434/api/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: text
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.embedding
  } catch (err) {
    console.error('Failed to get query embedding:', err)
    return null
  }
}
