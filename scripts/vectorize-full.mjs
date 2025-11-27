#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const dataDir = path.join(projectRoot, 'src', 'data')
const referenceDir = path.join(projectRoot, 'data', 'reference')
const vectorDbDir = path.join(dataDir, 'vectors')

// Ensure vector database directory exists
if (!fs.existsSync(vectorDbDir)) {
  fs.mkdirSync(vectorDbDir, { recursive: true })
}

/**
 * Call Ollama embedding API with HTTP (not HTTPS)
 */
async function getEmbedding(text, model = 'nomic-embed-text', retries = 3) {
  return new Promise((resolve, reject) => {
    const attemptRequest = (attempt) => {
      if (attempt > retries) {
        reject(new Error(`Failed to get embedding after ${retries} retries`))
        return
      }

      const data = JSON.stringify({
        model,
        prompt: text
      })

      const options = {
        hostname: '127.0.0.1',
        port: 11434,
        path: '/api/embed',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 30000
      }

      const req = http.request(options, (res) => {
        let responseData = ''

        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData)
            // Ollama returns embeddings as an array in the embeddings field
            if (parsed.embeddings && Array.isArray(parsed.embeddings) && parsed.embeddings.length > 0) {
              resolve(parsed.embeddings[0])
            } else if (parsed.embedding) {
              resolve(parsed.embedding)
            } else {
              reject(new Error(`No embedding in response: ${JSON.stringify(parsed)}`))
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`))
          }
        })
      })

      req.on('error', (err) => {
        if (attempt < retries) {
          console.log(`  ⚠️  Attempt ${attempt} failed, retrying...`)
          setTimeout(() => attemptRequest(attempt + 1), 1000)
        } else {
          reject(err)
        }
      })

      req.on('timeout', () => {
        req.destroy()
        if (attempt < retries) {
          setTimeout(() => attemptRequest(attempt + 1), 1000)
        } else {
          reject(new Error('Request timeout'))
        }
      })

      req.write(data)
      req.end()
    }

    attemptRequest(1)
  })
}

/**
 * Split text into chunks with overlap for better context
 */
function chunkText(text, maxChunkSize = 512, overlap = 100) {
  const chunks = []
  const sentences = text.split(/(?<=[.!?])\s+/)

  let currentChunk = ''
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentences
        .slice(Math.max(0, sentences.indexOf(sentence) - 2), sentences.indexOf(sentence) + 1)
        .join(' ')
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks
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

    if (line.startsWith('# ')) {
      if (currentContent.length > 0) {
        chunks.push({
          source: filename,
          chapter: currentChapter,
          section: currentSection,
          content: currentContent.join('\n').trim(),
          startLine: contentStartLine,
          endLine: i,
          type: 'markdown'
        })
      }
      currentChapter = line.replace(/^#+ /, '').trim()
      currentSection = null
      currentContent = []
      contentStartLine = i + 1
    } else if (line.startsWith('## ')) {
      if (currentContent.length > 0) {
        chunks.push({
          source: filename,
          chapter: currentChapter,
          section: currentSection,
          content: currentContent.join('\n').trim(),
          startLine: contentStartLine,
          endLine: i,
          type: 'markdown'
        })
      }
      currentSection = line.replace(/^#+ /, '').trim()
      currentContent = []
      contentStartLine = i + 1
    } else if (line.trim().length > 0) {
      currentContent.push(line)
    }
  }

  if (currentContent.length > 0) {
    chunks.push({
      source: filename,
      chapter: currentChapter,
      section: currentSection,
      content: currentContent.join('\n').trim(),
      startLine: contentStartLine,
      endLine: lines.length,
      type: 'markdown'
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
      const grouped = {}
      data.forEach((item) => {
        const category = item.category || item.type || 'general'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(item)
      })

      Object.entries(grouped).forEach(([category, items]) => {
        const chunkSize = 10
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
            type: 'json'
          })
        }
      })
    }

    return chunks
  } catch (e) {
    console.error(`❌ Error parsing ${filename}: ${e.message}`)
    return []
  }
}

/**
 * Process a single file and extract chunks
 */
function processFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8')
  const filename = path.basename(filepath)
  let chunks = []

  if (filepath.endsWith('.md')) {
    chunks = parseMarkdownChunks(content, filename)
  } else if (filepath.endsWith('.json')) {
    chunks = parseJsonChunks(content, filename)
  }

  return chunks
}

/**
 * Recursively process all files in a directory
 */
function processDirectory(dir) {
  let allChunks = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      allChunks.push(...processDirectory(fullPath))
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
      allChunks.push(...processFile(fullPath))
    }
  }

  return allChunks
}

/**
 * Main full vectorization pipeline
 */
async function main() {
  console.log('\n🚀 Full Vectorization Pipeline\n')

  // Step 1: Extract chunks
  console.log('📋 Step 1: Extracting chunks from reference files...')
  const allChunks = processDirectory(referenceDir)
  console.log(`✓ Extracted ${allChunks.length} chunks from reference files\n`)

  // Step 2: Test Ollama connection
  console.log('🔗 Step 2: Testing Ollama connection...')
  try {
    const testEmbedding = await getEmbedding('test embedding')
    console.log(`✓ Ollama connected, embedding dimension: ${testEmbedding.length}\n`)
  } catch (e) {
    console.error(`❌ Cannot connect to Ollama: ${e.message}`)
    console.error('Make sure Ollama is running:')
    console.error('  1. ollama pull nomic-embed-text')
    console.error('  2. brew services start ollama')
    process.exit(1)
  }

  // Step 3: Vectorize all chunks
  console.log(`🔄 Step 3: Vectorizing ${allChunks.length} chunks...\n`)
  const vectoredChunks = []
  let successCount = 0
  let failureCount = 0

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i]
    const progress = `[${i + 1}/${allChunks.length}]`

    try {
      // Truncate content for embedding (first 512 characters to avoid token limits)
      const textToEmbed = chunk.content.substring(0, 512)
      const embedding = await getEmbedding(textToEmbed)

      vectoredChunks.push({
        id: `chunk_${i}`,
        ...chunk,
        embedding,
        embeddingModel: 'nomic-embed-text',
        embeddedAt: new Date().toISOString()
      })

      successCount++
      const chapter = chunk.chapter ? `${chunk.chapter}` : 'unknown'
      console.log(`${progress} ✓ ${chunk.source} → ${chapter}`)
    } catch (e) {
      failureCount++
      console.error(`${progress} ❌ ${chunk.source}: ${e.message}`)
    }

    // Small delay between requests to avoid overwhelming Ollama
    if ((i + 1) % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  console.log(`\n✅ Vectorization complete: ${successCount} successful, ${failureCount} failed\n`)

  // Step 4: Save vector database
  console.log('💾 Step 4: Saving vector database...')

  // Save metadata (without embeddings for faster loading)
  const metadataPath = path.join(vectorDbDir, 'chunks-metadata.json')
  const metadataOnly = allChunks.map((chunk, i) => ({
    id: `chunk_${i}`,
    ...chunk,
    embeddingId: `chunk_${i}`
  }))
  fs.writeFileSync(metadataPath, JSON.stringify(metadataOnly, null, 2))
  console.log(`✓ Chunk metadata: ${metadataPath} (${metadataOnly.length} chunks)`)

  // Save vector embeddings (separate file for efficient searching)
  const embeddingsPath = path.join(vectorDbDir, 'embeddings.json')
  const embeddingsOnly = vectoredChunks.map((chunk) => ({
    id: chunk.id,
    embedding: chunk.embedding
  }))
  fs.writeFileSync(embeddingsPath, JSON.stringify(embeddingsOnly, null, 2))
  console.log(`✓ Embeddings: ${embeddingsPath} (${embeddingsOnly.length} vectors)`)

  // Save index summary
  const summaryPath = path.join(vectorDbDir, 'index-summary.json')
  const indexSummary = {
    totalChunks: allChunks.length,
    totalVectorized: successCount,
    totalFailed: failureCount,
    embeddingModel: 'nomic-embed-text',
    embeddingDimension: vectoredChunks[0]?.embedding?.length || 768,
    sourceFiles: [...new Set(allChunks.map((c) => c.source))],
    chapters: [...new Set(allChunks.map((c) => c.chapter).filter(Boolean))],
    createdAt: new Date().toISOString(),
    status: 'complete'
  }
  fs.writeFileSync(summaryPath, JSON.stringify(indexSummary, null, 2))
  console.log(`✓ Index summary: ${summaryPath}\n`)

  // Step 5: Summary
  console.log('📊 Vector Database Summary:')
  console.log(`  Total chunks: ${allChunks.length}`)
  console.log(`  Vectorized: ${successCount}`)
  console.log(`  Model: ${indexSummary.embeddingModel}`)
  console.log(`  Dimensions: ${indexSummary.embeddingDimension}`)
  console.log(`  Source files: ${indexSummary.sourceFiles.length}`)
  console.log(`  Chapters: ${indexSummary.chapters.join(', ').substring(0, 100)}...`)
  console.log('\n✅ Vector database ready for RAG pipeline!\n')
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message)
  process.exit(1)
})
