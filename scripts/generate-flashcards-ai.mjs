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

// Build context-enriched AI prompt for a SINGLE flashcard
const buildSingleCardPrompt = (enabler, domain, task, difficulty, index) => {
  return `You are a PMP exam prep expert creating one high-quality concept flashcard at a time.

DOMAIN: ${domain.name}
TASK: ${task.title}
ENABLER: ${enabler.text}

You are generating card #${index} for this enabler.

Create EXACTLY ONE simple concept flashcard with:

1. FORMAT: Term/definition or concept/explanation
   - Front: Clear question (e.g., "What is X?", "Define Y", "Explain Z")
   - Back: Concise answer (1-3 sentences max)

2. DIFFICULTY:
   - Difficulty for this card must be: "${difficulty}".
   - easy: basic definition or simple concept
   - medium: application, relationships, or "why" questions
   - hard: nuances, edge cases, comparisons, or scenario-style questions

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

Return ONLY valid JSON object:
{"front": "...", "back": "...", "tags": ["tag-1", "tag-2"], "difficulty": "${difficulty}"}

DO NOT include any markdown code blocks or explanatory text. Return ONLY the raw JSON object.`
}

// Validate a single flashcard structure
const validateSingleCard = (card, indexLabel) => {
  const errors = []

  if (!card.front || typeof card.front !== 'string') {
    errors.push(`${indexLabel}: missing or invalid 'front'`)
  } else if (card.front.length < 10 || card.front.length > 200) {
    errors.push(`${indexLabel}: front length must be 10-200 chars`)
  }

  if (!card.back || typeof card.back !== 'string') {
    errors.push(`${indexLabel}: missing or invalid 'back'`)
  } else if (card.back.length < 10 || card.back.length > 500) {
    errors.push(`${indexLabel}: back length must be 10-500 chars`)
  }

  if (!Array.isArray(card.tags) || card.tags.length < 1 || card.tags.length > 3) {
    errors.push(`${indexLabel}: must have 1-3 tags`)
  }

  if (!['easy', 'medium', 'hard'].includes(card.difficulty)) {
    errors.push(`${indexLabel}: invalid difficulty "${card.difficulty}"`)
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

// Generate flashcards for a single enabler (100 separate calls)
const generateFlashcardsForEnabler = async (enabler, domain, task) => {
  try {
    console.log(`Generating flashcards for ${enabler.id} (100 separate cards)...`)

    const desiredCounts = { easy: 50, medium: 30, hard: 20 }
    const currentCounts = { easy: 0, medium: 0, hard: 0 }
    const cards = []
    const fronts = new Set()

    let cardIndex = 0

    // We loop until we have 100 valid, non-duplicate cards
    while (cards.length < 100) {
      cardIndex += 1

      // Decide difficulty based on remaining quota
      let difficulty = 'easy'
      if (currentCounts.easy < desiredCounts.easy) {
        difficulty = 'easy'
      } else if (currentCounts.medium < desiredCounts.medium) {
        difficulty = 'medium'
      } else {
        difficulty = 'hard'
      }

      console.log(
        `  -> Generating card ${cards.length + 1}/100 for ${enabler.id} (attempt #${cardIndex}, target difficulty: ${difficulty})`
      )

      const prompt = buildSingleCardPrompt(enabler, domain, task, difficulty, cards.length + 1)
      const text = callOllama(prompt)

      // Try to extract JSON from the response
      let card
      try {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        const jsonText = jsonMatch ? jsonMatch[1] : text

        const objectMatch = jsonText.match(/\{[\s\S]*\}/)
        const finalText = objectMatch ? objectMatch[0] : jsonText

        card = JSON.parse(finalText)
      } catch (parseError) {
        console.error(`    Failed to parse JSON for card ${cards.length + 1} of ${enabler.id}`)
        console.error('    Response preview:', text.substring(0, 200))
        continue
      }

      const validation = validateSingleCard(card, `Card ${cards.length + 1}`)
      if (!validation.valid) {
        console.error(`    Validation failed for card ${cards.length + 1} of ${enabler.id}:`)
        validation.errors.forEach((err) => console.error(`      - ${err}`))
        continue
      }

      if (fronts.has(card.front)) {
        console.error(
          `    Skipping duplicate front for card ${cards.length + 1} of ${enabler.id}: "${card.front}"`
        )
        continue
      }

      // Accept card
      fronts.add(card.front)
      cards.push(card)
      currentCounts[card.difficulty]++
      console.log(
        `    Accepted card ${cards.length}/100 (difficulty: ${card.difficulty}; counts: easy=${currentCounts.easy}, medium=${currentCounts.medium}, hard=${currentCounts.hard})`
      )
    }

    // Extract domain and task from enabler ID
    // e-people-1-1 -> domain: people, taskNum: 1, enablerNum: 1
    const parts = enabler.id.split('-')
    const domainId = parts[1]
    const taskNum = parts[2]

    // Build output path
    const taskFolder = `${domainId}-${taskNum}`
    const outputPath = path.join(outputDir, domainId, taskFolder, `${enabler.id}.json`)

    // Write to file
    writeJson(outputPath, cards)
    console.log(
      `✓ Generated 100 flashcards for ${enabler.id} (easy=${currentCounts.easy}, medium=${currentCounts.medium}, hard=${currentCounts.hard})`
    )

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
  const enablerIndexMap = Object.fromEntries(
    enablers.map((enabler, index) => [enabler.id, index + 1])
  )

  // Check if Ollama is available
  console.log('='.repeat(60))
  console.log('PMP FLASHCARD GENERATION')
  console.log('='.repeat(60))
  console.log(`Using Ollama model: ${ollamaModel}`)
  console.log(`Total enablers in data: ${enablers.length}`)
  console.log(`State file: ${stateFile}`)
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
    console.log('Initialized new generation state.')
  } else {
    console.log(
      `Loaded existing state: ${state.completed.length} completed, ${state.failed.length} failed (since ${state.startTime})`
    )
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

  console.log(`\nProcessing ${enablersToProcess.length} enablers in this run...`)
  if (resume) {
    console.log(`Resuming from previous run (${state.completed.length} completed, ${state.failed.length} failed)`)
  }

  // Process enablers one at a time (sequential to ensure quality)
  const startTime = Date.now()
  for (let i = 0; i < enablersToProcess.length; i++) {
    const enabler = enablersToProcess[i]
    const domain = domainMap[enabler.taskId.split('-')[0]]
    const task = taskMap[enabler.taskId]

    const startedAt = new Date()
    const globalIndex = enablerIndexMap[enabler.id]
    console.log(
      `\n[${i + 1}/${enablersToProcess.length}] (global ${globalIndex}/${enablers.length}) ` +
        `Processing ${enabler.id} at ${startedAt.toISOString()}`
    )

    const result = await generateFlashcardsForEnabler(enabler, domain, task)

    if (result.success) {
      state.completed.push(enabler.id)
      console.log(
        `Status: SUCCESS for ${enabler.id} (completed: ${state.completed.length}, failed: ${state.failed.length})`
      )
    } else {
      state.failed.push(enabler.id)
      console.log(
        `Status: FAILED for ${enabler.id} (completed: ${state.completed.length}, failed: ${state.failed.length})`
      )
    }

    saveState(state)
    console.log(`State saved to ${stateFile}`)

    const finishedAt = new Date()
    const durationMs = finishedAt - startedAt
    const durationSec = Math.round(durationMs / 1000)
    console.log(
      `Duration for ${enabler.id}: ${durationSec}s (started ${startedAt.toISOString()}, finished ${finishedAt.toISOString()})`
    )

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
