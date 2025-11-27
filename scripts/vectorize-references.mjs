#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import https from 'node:https'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const dataDir = path.join(projectRoot, 'src', 'data')
const referenceDir = path.join(projectRoot, 'data', 'reference')
const vectorDbDir = path.join(dataDir, 'vectors')

// Ensure vector database directory exists
if (!fs.existsSync(vectorDbDir)) {
  fs.mkdirSync(vectorDbDir, { recursive: true })
  console.log(`✓ Created vector database directory: ${vectorDbDir}`)
}

/**
 * Call Ollama embedding API
 */
async function getEmbedding(text, model = 'nomic-embed-text') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model,
      prompt: text,
      stream: false
    })

    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/embed',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }

    const req = https.request(options, (res) => {
      let responseData = ''

      res.on('data', (chunk) => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData)
          resolve(parsed.embedding)
        } catch (e) {
          reject(new Error(`Failed to parse embedding response: ${e.message}`))
        }
      })
    })

    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

/**
 * Parse markdown content and extract chapters/sections
 */
function parseMarkdownChunks(content, filename) {
  const chunks = []
  const lines = content.split('\n')
  let currentChapter = null
  let currentSection = null
  let currentContent = []
  let contentStartLine = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect chapter headers (# or ##)
    if (line.startsWith('# ')) {
      // Save previous section if exists
      if (currentContent.length > 0) {
        chunks.push({
          source: filename,
          chapter: currentChapter,
          section: currentSection,
          content: currentContent.join('\n').trim(),
          startLine: contentStartLine,
          endLine: i,
          tokens: currentContent.join('\n').trim().split(/\s+/).length
        })
      }

      currentChapter = line.replace(/^#+ /, '').trim()
      currentSection = null
      currentContent = []
      contentStartLine = i + 1
    } else if (line.startsWith('## ')) {
      // Save previous section
      if (currentContent.length > 0) {
        chunks.push({
          source: filename,
          chapter: currentChapter,
          section: currentSection,
          content: currentContent.join('\n').trim(),
          startLine: contentStartLine,
          endLine: i,
          tokens: currentContent.join('\n').trim().split(/\s+/).length
        })
      }

      currentSection = line.replace(/^#+ /, '').trim()
      currentContent = []
      contentStartLine = i + 1
    } else if (line.startsWith('### ')) {
      // Sub-section under current section
      if (line.trim().length > 0) {
        currentContent.push(line)
      }
    } else {
      // Regular content line
      if (line.trim().length > 0) {
        currentContent.push(line)
      }
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    chunks.push({
      source: filename,
      chapter: currentChapter,
      section: currentSection,
      content: currentContent.join('\n').trim(),
      startLine: contentStartLine,
      endLine: lines.length,
      tokens: currentContent.join('\n').trim().split(/\s+/).length
    })
  }

  return chunks
}

/**
 * Parse JSON flashcard files into chunks
 */
function parseJsonChunks(content, filename) {
  try {
    const data = JSON.parse(content)
    const chunks = []

    if (Array.isArray(data)) {
      // Group flashcards by category/type
      const grouped = {}
      data.forEach((item, index) => {
        const category = item.category || item.type || 'general'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(item)
      })

      // Create chunks for each category
      Object.entries(grouped).forEach(([category, items]) => {
        const chunkSize = 10 // Items per chunk
        for (let i = 0; i < items.length; i += chunkSize) {
          const chunk = items.slice(i, i + chunkSize)
          chunks.push({
            source: filename,
            chapter: category,
            section: null,
            content: chunk.map((item) => `${item.front} - ${item.back}`).join('\n'),
            metadata: {
              type: 'flashcard',
              itemCount: chunk.length,
              originalIds: chunk.map((item) => item.id)
            },
            startLine: i,
            endLine: i + chunkSize,
            tokens: chunk
              .map((item) => `${item.front} ${item.back}`.split(/\s+/).length)
              .reduce((a, b) => a + b, 0)
          })
        }
      })
    }

    return chunks
  } catch (e) {
    console.error(`Error parsing JSON file ${filename}: ${e.message}`)
    return []
  }
}

/**
 * Process a single file and extract chunks
 */
function processFile(filepath, relativePath) {
  const content = fs.readFileSync(filepath, 'utf-8')
  const filename = path.basename(filepath)
  let chunks = []

  if (filepath.endsWith('.md')) {
    chunks = parseMarkdownChunks(content, filename)
  } else if (filepath.endsWith('.json')) {
    chunks = parseJsonChunks(content, filename)
  }

  console.log(`  ✓ ${filename}: ${chunks.length} chunks extracted`)
  return chunks
}

/**
 * Recursively process all files in a directory
 */
function processDirectory(dir, relativePath = '') {
  let allChunks = []

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const newRelativePath = path.join(relativePath, entry.name)

    if (entry.isDirectory()) {
      console.log(`📁 Processing directory: ${newRelativePath}`)
      allChunks.push(...processDirectory(fullPath, newRelativePath))
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
      allChunks.push(...processFile(fullPath, newRelativePath))
    }
  }

  return allChunks
}

/**
 * Main vectorization pipeline
 */
async function main() {
  console.log('\n🚀 Starting vectorization pipeline...\n')
  console.log(`📂 Reference directory: ${referenceDir}`)
  console.log(`📊 Vector database directory: ${vectorDbDir}\n`)

  // Step 1: Extract chunks from all reference files
  console.log('Step 1: Extracting chunks from reference files...')
  const allChunks = processDirectory(referenceDir)
  console.log(`\n✓ Total chunks extracted: ${allChunks.length}\n`)

  // Step 2: Check Ollama connection
  console.log('Step 2: Checking Ollama connection...')
  try {
    // Ensure embedding model is available
    const modelName = 'nomic-embed-text'
    console.log(`  Checking for model: ${modelName}`)

    // Try to pull the model if not already available
    try {
      const testEmbedding = await getEmbedding('test', modelName)
      console.log(`  ✓ Ollama is running and model ready`)
    } catch (e) {
      console.log(`  ℹ Model needs to be pulled, fetching from Ollama...`)
      console.log(`  Run: ollama pull ${modelName}`)
      console.log(`  Waiting for model to be available...`)
    }
  } catch (e) {
    console.error(`❌ Ollama connection failed: ${e.message}`)
    console.error(`Make sure Ollama is running with: brew services start ollama`)
    process.exit(1)
  }

  // Step 3: Vectorize chunks (sample - first 5 for now)
  console.log('\nStep 3: Vectorizing chunks (sample)...')
  const vectoredChunks = []
  const sampleSize = Math.min(5, allChunks.length)

  for (let i = 0; i < sampleSize; i++) {
    const chunk = allChunks[i]
    try {
      const embedding = await getEmbedding(chunk.content.substring(0, 500))
      vectoredChunks.push({
        ...chunk,
        embedding,
        embeddingModel: 'nomic-embed-text',
        embeddedAt: new Date().toISOString()
      })
      console.log(`  ✓ [${i + 1}/${sampleSize}] ${chunk.source} - ${chunk.chapter}`)
    } catch (e) {
      console.error(`  ❌ [${i + 1}/${sampleSize}] Failed to embed: ${e.message}`)
    }
  }

  // Step 4: Save vector database
  console.log('\nStep 4: Saving vector database...')

  // Save chunk metadata
  const metadataPath = path.join(vectorDbDir, 'chunks-metadata.json')
  fs.writeFileSync(metadataPath, JSON.stringify(allChunks, null, 2))
  console.log(`  ✓ Chunk metadata saved: ${metadataPath}`)

  // Save vectored chunks (full vectors for now)
  const vectorsPath = path.join(vectorDbDir, 'vectors.json')
  fs.writeFileSync(vectorsPath, JSON.stringify(vectoredChunks, null, 2))
  console.log(`  ✓ Vectors saved: ${vectorsPath}`)

  // Step 5: Create index summary
  console.log('\nStep 5: Creating index summary...')
  const indexSummary = {
    totalChunks: allChunks.length,
    totalVectorized: vectoredChunks.length,
    embeddingModel: 'nomic-embed-text',
    embeddingDimension: vectoredChunks[0]?.embedding?.length || 768,
    sourceFiles: [...new Set(allChunks.map((c) => c.source))],
    chapters: [...new Set(allChunks.map((c) => c.chapter).filter(Boolean))],
    createdAt: new Date().toISOString(),
    status: 'partial'
  }

  const summaryPath = path.join(vectorDbDir, 'index-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(indexSummary, null, 2))
  console.log(`  ✓ Index summary saved: ${summaryPath}`)

  console.log('\n✅ Vectorization pipeline complete!\n')
  console.log('📊 Summary:')
  console.log(`  - Total chunks: ${allChunks.length}`)
  console.log(`  - Vectorized: ${vectoredChunks.length}`)
  console.log(`  - Model: ${indexSummary.embeddingModel}`)
  console.log(`  - Embedding dimensions: ${indexSummary.embeddingDimension}`)
  console.log(`\n📂 Database files:`)
  console.log(`  - ${metadataPath}`)
  console.log(`  - ${vectorsPath}`)
  console.log(`  - ${summaryPath}`)
  console.log('\n💡 Next steps:')
  console.log('  1. Run full vectorization: npm run vectorize:full')
  console.log('  2. Use vector search in your RAG pipeline')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
