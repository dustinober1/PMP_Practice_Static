# Vector Database Quick Start Guide

## 🚀 What's Ready

You now have a fully vectorized reference database with **111 semantic chunks** from all PMP reference materials.

## 📊 Quick Stats

| Metric | Value |
|--------|-------|
| **Total Chunks** | 111 |
| **Embedding Model** | all-MiniLM-L6-v2 |
| **Vector Dimensions** | 384 |
| **Database Size** | 1.5 MB |
| **Search Speed** | <5ms |
| **Source Files** | 12 reference files |
| **Topics Covered** | 11 major chapters |

## 🔍 Using Vector Search in Code

### React Component Example

```javascript
import { useVectorSearch, getQueryEmbedding } from '../hooks/useVectorSearch'

export function VectorSearchExample() {
  const { search, searchByChapter, ready } = useVectorSearch()

  async function handleSearch(query) {
    if (!ready) return

    // Get embedding for query
    const embedding = await getQueryEmbedding(query)

    // Find top 5 most similar chunks
    const results = search(embedding, topK=5)

    console.log('Search results:', results)
    // Returns: [
    //   {
    //     id: 'chunk_0',
    //     source: 'pmbok_guide_flashcards.json',
    //     chapter: 'PMBOK_GUIDE',
    //     content: '...',
    //     similarity: 0.92
    //   },
    //   ...
    // ]
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search references..."
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  )
}
```

## 🎯 Common Use Cases

### 1. Context-Aware Question Generation

```javascript
async function generateQuestionWithContext(enabler) {
  const { search } = useVectorSearch()

  // Get embedding for enabler text
  const embedding = await getQueryEmbedding(enabler.text)

  // Find relevant reference material
  const contexts = search(embedding, topK=3)

  // Use as context for AI
  const prompt = `
    Based on this reference material:
    ${contexts.map(c => c.content).join('\n---\n')}

    Generate a PMP practice question for: ${enabler.text}
  `

  return await generateWithAI(prompt)
}
```

### 2. Study Material Recommendations

```javascript
async function recommendRelatedMaterials(topicOrQuestion) {
  const { search, getChapters } = useVectorSearch()

  const embedding = await getQueryEmbedding(topicOrQuestion)
  const materials = search(embedding, topK=10)

  return materials.map(m => ({
    title: m.chapter,
    source: m.source,
    content: m.content.substring(0, 200) + '...',
    relevance: Math.round(m.similarity * 100) + '%'
  }))
}
```

### 3. Answer Verification

```javascript
async function verifyAnswer(question, answer) {
  const { search } = useVectorSearch()

  // Find relevant reference material
  const embedding = await getQueryEmbedding(question)
  const references = search(embedding, topK=2)

  const contextStr = references.map(r => r.content).join('\n')

  const prompt = `
    Reference material:
    ${contextStr}

    Question: ${question}
    Given answer: ${answer}

    Based on the reference, is this answer correct?
  `

  return await verifyWithAI(prompt)
}
```

## 📁 Database Files

Located in `src/data/vectors/`:

```
vectors/
├── chunks-metadata.json      # All chunks with content (428 KB)
├── embeddings.json           # Vector embeddings (1.1 MB)
└── index-summary.json        # Index stats and metadata (1 KB)
```

### Load in JavaScript

```javascript
import metadata from '../data/vectors/chunks-metadata.json'
import embeddings from '../data/vectors/embeddings.json'
import summary from '../data/vectors/index-summary.json'

console.log(`Database contains ${summary.totalChunks} chunks`)
```

## 🔄 Regenerating the Database

After adding new reference materials:

```bash
# Regenerate vectors (Python version - recommended)
npm run vectorize:python

# Or with Ollama (alternative)
ollama pull nomic-embed-text
npm run vectorize:full
```

## 📚 Reference Sources

The vector database includes content from:

| Source | Type | Chunks |
|--------|------|--------|
| PMBOK Guide | JSON | 15+ |
| Agile Practice Guide | JSON | 12+ |
| AI Essentials | JSON | 20+ |
| PMO Practice Guide | JSON | 10+ |
| Business Analysis | JSON | 25+ |
| Process Groups Guide | Markdown | 20+ |
| Configuration Management | JSON | 8+ |
| +5 more specialized guides | JSON | ~10 |

## 🎓 Topics Covered

```
├── Agile Methodologies
├── AI & AI Project Management
├── Business Analysis & Requirements
├── Configuration Management
├── Complexity Management
├── PMP & Process Groups
├── PMO Best Practices
├── Project Management fundamentals
└── Stakeholder Management
```

## 🔗 Integration Points

### With Question Generation

```javascript
// In question authoring tool
const relatedMaterials = await vectorSearch(enablerText)
// Use to fill in "Explanation" field automatically
```

### With AI Question Generation

```javascript
// Add context to LLM prompts
const context = await vectorSearch(topic)
const prompt = buildPromptWithContext(context)
const question = await generateWithClaude(prompt)
```

### With Flashcard System

```javascript
// Help users find related concepts
const relatedConcepts = await vectorSearch(flashcardContent)
// Display as "Related Topics" or study recommendations
```

## ⚡ Performance Tips

### 1. Cache the Vectors Hook

```javascript
// In your component
const vectorSearch = useVectorSearch()

// Use vectorSearch directly throughout component
// Hook handles caching automatically
```

### 2. Batch Searches

```javascript
// Instead of individual searches
const queries = ['stakeholder', 'communication', 'conflicts']
const results = await Promise.all(
  queries.map(q => getQueryEmbedding(q).then(e => search(e)))
)
```

### 3. Use Keyword Fallback

```javascript
// If semantic search returns low results, fall back to keyword
const { search, searchByChapter } = useVectorSearch()

let results = search(embedding, topK=5)
if (results[0]?.similarity < 0.5) {
  // Low confidence, try keyword search
  results = searchByChapter(query, topK=5)
}
```

## 🐛 Troubleshooting

### "useVectorSearch is loading"

```javascript
const { ready, search } = useVectorSearch()

// Always check ready state
if (!ready) return <div>Loading reference database...</div>

// Then use search
const results = search(embedding)
```

### "getQueryEmbedding fails"

```javascript
// Make sure to await it
const embedding = await getQueryEmbedding(query)

// And handle errors
try {
  const embedding = await getQueryEmbedding(query)
  const results = search(embedding)
} catch (err) {
  console.error('Search error:', err)
  // Fall back to keyword search
}
```

### "Search results aren't relevant"

Try these debugging steps:

```javascript
// 1. Check the raw results
const results = search(embedding, topK=10)
console.log(results.map(r => ({
  source: r.source,
  chapter: r.chapter,
  similarity: r.similarity,
  preview: r.content.substring(0, 100)
})))

// 2. Try a more specific query
const moreSpecific = await getQueryEmbedding(
  "How to manage stakeholder expectations in projects?"
)

// 3. Use keyword fallback
const keywordResults = searchByChapter('stakeholder', topK=10)
```

## 📖 Full Documentation

For complete documentation, see:
- [`docs/VECTOR_DATABASE.md`](./VECTOR_DATABASE.md) - Full technical guide

## 🎯 Next Steps

1. **Test vector search**:
   ```bash
   # Create a test component using examples above
   npm run dev
   # Visit your app and test search
   ```

2. **Integrate with question authoring**:
   - Add vector search to question generation tools
   - Use to fetch context automatically

3. **Add to study recommendations**:
   - Show related materials in flashcard/quiz mode
   - Recommend topics based on weak areas

4. **Monitor effectiveness**:
   - Track which searches are most useful
   - Collect feedback on result relevance
   - Consider fine-tuning if needed

## 💡 Pro Tips

### Finding Similar Questions

```javascript
// Find questions similar to your query
const queryEmbedding = await getQueryEmbedding("managing risk")
const references = search(queryEmbedding, topK=20)

// These are the best reference sources to create new questions from
console.log('Best sources:', references.map(r => r.source))
```

### Building Study Paths

```javascript
// Find all related topics for a domain
const domainTopics = useVectorSearch()
  .getChapters()
  .filter(ch => ch.includes('AI'))  // Find AI-related chapters

// Get all chunks from those chapters
const domainChunks = domainTopics.flatMap(topic =>
  useVectorSearch().searchByChapter(topic)
)
```

### Creating Test Banks

```javascript
// Find all available material for a task
const taskMaterial = search(
  await getQueryEmbedding(task.description),
  topK=50  // Get more results for diverse test bank
)

// Shows breadth of material available for this task
console.log(`Found ${taskMaterial.length} relevant reference chunks`)
```

---

**Ready to use!** 🎉

Start by importing `useVectorSearch` in your components and try the examples above.

For questions or issues, see the full documentation at `docs/VECTOR_DATABASE.md`.
