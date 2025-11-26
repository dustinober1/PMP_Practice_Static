import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..')
const dataDir = path.join(rootDir, 'src', 'data')
const outputDir = path.join(dataDir, 'flashcards-source')
const stateFile = path.join(rootDir, '.flashcard-generation-state.json')
const ollamaModel = process.env.FLASHCARDS_MODEL || 'gpt-oss:20b'

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))

const writeJson = (filePath, data) => {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: 'utf8'
  })
}

// Load state from file or return empty state
const loadState = () => {
  if (fs.existsSync(stateFile)) {
    return readJson(stateFile)
  }
  return {
    completed: [],
    failed: [],
    startTime: new Date().toISOString()
  }
}

// Save state to file
const saveState = (state) => {
  writeJson(stateFile, state)
}

// Build context-enriched AI prompt
const buildPrompt = (enabler, domain, task) => {
  return `You are a PMP exam prep expert creating simple concept flashcards.

DOMAIN: ${domain.name}
TASK: ${task.title}
ENABLER: ${enabler.text}

Create exactly 100 simple concept flashcards with:

1. FORMAT: Term/definition or concept/explanation
   - Front: Clear question (e.g., "What is X?", "Define Y", "Explain Z")
   - Back: Concise answer (1-3 sentences max)

2. DIFFICULTY DISTRIBUTION:
   - 50 cards: easy (basic definitions)
   - 30 cards: medium (application, relationships)
   - 20 cards: hard (nuances, edge cases, comparisons)

3. CONTENT COVERAGE:
   - Key terminology specific to this enabler
   - Core techniques and tools
   - Best practices and principles
   - Common pitfalls
   - Real-world applications

4. QUALITY:
   - Each card self-contained (no ambiguous references)
   - PMBOK 7th Edition aligned
   - No duplicates within the set
   - 1-3 relevant tags per card (lowercase, hyphen-separated)

Return ONLY valid JSON array: [{"front": "...", "back": "...", "tags": [...], "difficulty": "easy"}, ...]

DO NOT include any markdown code blocks or explanatory text. Return ONLY the raw JSON array.`
}

// Validate flashcard structure
const validateFlashcards = (cards, enablerId) => {
  const errors = []

  if (!Array.isArray(cards)) {
    errors.push('Response is not an array')
    return { valid: false, errors }
  }

  if (cards.length !== 100) {
    errors.push(`Expected 100 cards, got ${cards.length}`)
  }

  const difficulties = { easy: 0, medium: 0, hard: 0 }
  const fronts = new Set()

  cards.forEach((card, index) => {
    if (!card.front || typeof card.front !== 'string') {
      errors.push(`Card ${index}: missing or invalid 'front'`)
    } else {
      if (card.front.length < 10 || card.front.length > 200) {
        errors.push(`Card ${index}: front length must be 10-200 chars`)
      }
      if (fronts.has(card.front)) {
        errors.push(`Card ${index}: duplicate front "${card.front}"`)
      }
      fronts.add(card.front)
    }

    if (!card.back || typeof card.back !== 'string') {
      errors.push(`Card ${index}: missing or invalid 'back'`)
    } else if (card.back.length < 10 || card.back.length > 500) {
      errors.push(`Card ${index}: back length must be 10-500 chars`)
    }

    if (!Array.isArray(card.tags) || card.tags.length < 1 || card.tags.length > 3) {
      errors.push(`Card ${index}: must have 1-3 tags`)
    }

    if (!['easy', 'medium', 'hard'].includes(card.difficulty)) {
      errors.push(`Card ${index}: invalid difficulty "${card.difficulty}"`)
    } else {
      difficulties[card.difficulty]++
    }
  })

  // Check difficulty distribution (±5 tolerance)
  if (Math.abs(difficulties.easy - 50) > 5) {
    errors.push(`Expected ~50 easy cards, got ${difficulties.easy}`)
  }
  if (Math.abs(difficulties.medium - 30) > 5) {
    errors.push(`Expected ~30 medium cards, got ${difficulties.medium}`)
  }
  if (Math.abs(difficulties.hard - 20) > 5) {
    errors.push(`Expected ~20 hard cards, got ${difficulties.hard}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Call Ollama to generate flashcards
const callOllama = (prompt) => {
  console.log(`Calling Ollama with model: ${ollamaModel}`)

  const result = spawnSync('ollama', ['run', ollamaModel], {
    input: prompt,
    encoding: 'utf8',
    timeout: 1800000, // 30 minutes for larger models
    maxBuffer: 20 * 1024 * 1024 // 20MB buffer
  })

  if (result.error) {
    console.error('Ollama invocation failed:', result.error.message)
    throw result.error
  }

  if (result.status !== 0) {
    const errorOutput = (result.stderr || '').trim() || `Ollama exited with status ${result.status}`
    throw new Error(errorOutput)
  }

  return (result.stdout || '').trim()
}

// Generate flashcards for a single enabler
const generateFlashcardsForEnabler = async (enabler, domain, task) => {
  const prompt = buildPrompt(enabler, domain, task)

  try {
    console.log(`Generating flashcards for ${enabler.id}...`)

    const text = callOllama(prompt)

    // Try to extract JSON from the response
    let cards
    try {
      // Remove markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonText = jsonMatch ? jsonMatch[1] : text

      // Also try to extract just the array if there's extra text
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/)
      const finalText = arrayMatch ? arrayMatch[0] : jsonText

      cards = JSON.parse(finalText)
    } catch (parseError) {
      console.error(`Failed to parse JSON for ${enabler.id}`)
      console.error('Response preview:', text.substring(0, 500))
      throw new Error('Invalid JSON response')
    }

    // Validate cards
    const validation = validateFlashcards(cards, enabler.id)
    if (!validation.valid) {
      console.error(`Validation failed for ${enabler.id}:`)
      validation.errors.forEach((err) => console.error(`  - ${err}`))
      throw new Error('Validation failed')
    }

    // Extract domain and task from enabler ID
    // e-people-1-1 -> domain: people, taskNum: 1, enablerNum: 1
    const parts = enabler.id.split('-')
    const domainId = parts[1]
    const taskNum = parts[2]
    const enablerNum = parts[3]

    // Build output path
    const taskFolder = `${domainId}-${taskNum}`
    const outputPath = path.join(outputDir, domainId, taskFolder, `${enabler.id}.json`)

    // Write to file
    writeJson(outputPath, cards)
    console.log(`✓ Generated 100 flashcards for ${enabler.id}`)

    return { success: true }
  } catch (error) {
    console.error(`✗ Failed to generate flashcards for ${enabler.id}:`, error.message)
    return { success: false, error: error.message }
  }
}

// Main function
const main = async () => {
  const args = process.argv.slice(2)
  const resume = args.includes('--resume')
  const singleEnabler = args.find((arg) => arg.startsWith('--enabler='))?.split('=')[1]

  // Load data
  const enablers = readJson(path.join(dataDir, 'enablers.json'))
  const domains = readJson(path.join(dataDir, 'domains.json'))
  const tasks = readJson(path.join(dataDir, 'tasks.json'))

  // Create lookup maps
  const domainMap = Object.fromEntries(domains.map((d) => [d.id, d]))
  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]))

  // Check if Ollama is available
  console.log(`Using Ollama model: ${ollamaModel}`)
  const ollamaCheck = spawnSync('ollama', ['list'], { encoding: 'utf8' })
  if (ollamaCheck.error) {
    console.error('Error: Ollama is not installed or not in PATH')
    console.error('Install Ollama from: https://ollama.ai')
    process.exit(1)
  }

  // Check if the model is available
  const modelList = ollamaCheck.stdout
  if (!modelList.includes('gpt-oss') && !modelList.includes(ollamaModel)) {
    console.error(`Error: Model "${ollamaModel}" not found in Ollama`)
    console.error('Available models:')
    console.error(modelList)
    console.error(`\nTo pull the model, run: ollama pull ${ollamaModel}`)
    process.exit(1)
  }

  // Load or initialize state
  let state = loadState()
  if (!resume) {
    state = {
      completed: [],
      failed: [],
      startTime: new Date().toISOString()
    }
    saveState(state)
  }

  // Filter enablers based on arguments
  let enablersToProcess = enablers
  if (singleEnabler) {
    enablersToProcess = enablers.filter((e) => e.id === singleEnabler)
    if (enablersToProcess.length === 0) {
      console.error(`Error: Enabler ${singleEnabler} not found`)
      process.exit(1)
    }
  } else if (resume) {
    enablersToProcess = enablers.filter(
      (e) => !state.completed.includes(e.id) && !state.failed.includes(e.id)
    )
  }

  console.log(`Processing ${enablersToProcess.length} enablers...`)
  if (resume) {
    console.log(`Resuming from previous run (${state.completed.length} completed, ${state.failed.length} failed)`)
  }

  // Process enablers one at a time (sequential to ensure quality)
  const startTime = Date.now()
  for (let i = 0; i < enablersToProcess.length; i++) {
    const enabler = enablersToProcess[i]
    const domain = domainMap[enabler.taskId.split('-')[0]]
    const task = taskMap[enabler.taskId]

    console.log(`\n[${i + 1}/${enablersToProcess.length}] Processing ${enabler.id}`)

    const result = await generateFlashcardsForEnabler(enabler, domain, task)

    if (result.success) {
      state.completed.push(enabler.id)
    } else {
      state.failed.push(enabler.id)
    }

    saveState(state)

    // Calculate and display ETA
    if (i > 0) {
      const elapsed = Date.now() - startTime
      const avgTimePerEnabler = elapsed / (i + 1)
      const remaining = enablersToProcess.length - (i + 1)
      const etaMinutes = Math.round((remaining * avgTimePerEnabler) / 1000 / 60)
      const etaHours = Math.floor(etaMinutes / 60)
      const etaMins = etaMinutes % 60

      if (etaHours > 0) {
        console.log(`ETA: ~${etaHours}h ${etaMins}m remaining`)
      } else {
        console.log(`ETA: ~${etaMins}m remaining`)
      }
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('GENERATION COMPLETE')
  console.log('='.repeat(60))
  console.log(`Total enablers: ${enablers.length}`)
  console.log(`Completed: ${state.completed.length}`)
  console.log(`Failed: ${state.failed.length}`)

  if (state.failed.length > 0) {
    console.log('\nFailed enablers:')
    state.failed.forEach((id) => console.log(`  - ${id}`))
    console.log('\nRe-run with --resume to retry failed enablers')
  }

  // Calculate total cards
  const totalCards = state.completed.length * 100
  console.log(`\nTotal flashcards generated: ${totalCards}`)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
