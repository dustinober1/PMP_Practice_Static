import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..')
const dataDir = path.join(rootDir, 'src', 'data')
const sourceDir = path.join(dataDir, 'flashcards-source')
const stateFile = path.join(rootDir, '.flashcards-generation-state.json')

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: 'utf8'
  })
}

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

const loadState = () => {
  if (fs.existsSync(stateFile)) {
    return readJson(stateFile)
  }
  return { completed: [], failed: [], current: null }
}

const saveState = (state) => {
  writeJson(stateFile, state)
}

const parseEnablerId = (enablerId) => {
  const parts = enablerId.split('-')
  const domain = parts[1] // people, process, business
  const task = `${domain}-${parts[2]}` // people-1, process-1, etc.
  const enablerNum = parts[3] // 1, 2, 3...
  return { domain, task, enablerNum }
}

const buildPrompt = (enabler, domain, task) => {
  return `You are a PMP exam prep expert creating simple concept flashcards.

DOMAIN: ${domain.name}
TASK: ${task.text}
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

Return ONLY valid JSON array: [{"front": "...", "back": "...", "tags": [...], "difficulty": "easy"}, ...]`
}

const callOllama = (prompt) => {
  try {
    const output = execSync('ollama run llama3.1:8b "' + prompt.replace(/"/g, '\\"') + '"', {
      encoding: 'utf8',
      timeout: 300000 // 5 minutes
    })
    return output.trim()
  } catch (error) {
    console.error('Ollama API call failed:', error.message)
    throw error
  }
}

const parseAndValidateCards = (jsonStr, enablerId) => {
  try {
    const cards = JSON.parse(jsonStr)

    if (!Array.isArray(cards)) {
      throw new Error('Response is not an array')
    }

    if (cards.length !== 100) {
      throw new Error(`Expected 100 cards, got ${cards.length}`)
    }

    const difficultyCount = { easy: 0, medium: 0, hard: 0 }
    const fronts = new Set()

    for (const [index, card] of cards.entries()) {
      if (!card.front || typeof card.front !== 'string') {
        throw new Error(`Card ${index + 1}: missing or invalid front`)
      }
      if (!card.back || typeof card.back !== 'string') {
        throw new Error(`Card ${index + 1}: missing or invalid back`)
      }
      if (!card.tags || !Array.isArray(card.tags)) {
        throw new Error(`Card ${index + 1}: missing or invalid tags`)
      }
      if (!card.difficulty || !['easy', 'medium', 'hard'].includes(card.difficulty)) {
        throw new Error(`Card ${index + 1}: invalid difficulty`)
      }

      if (card.front.length < 10 || card.front.length > 200) {
        throw new Error(`Card ${index + 1}: front must be 10-200 characters`)
      }
      if (card.back.length < 10 || card.back.length > 500) {
        throw new Error(`Card ${index + 1}: back must be 10-500 characters`)
      }

      if (fronts.has(card.front)) {
        throw new Error(`Card ${index + 1}: duplicate front: "${card.front}"`)
      }
      fronts.add(card.front)

      difficultyCount[card.difficulty]++

      for (const tag of card.tags) {
        if (typeof tag !== 'string' || !/^[a-z0-9-]+$/.test(tag)) {
          throw new Error(`Card ${index + 1}: invalid tag format: "${tag}"`)
        }
      }
    }

    // Check difficulty distribution (±5 tolerance)
    const easyDiff = Math.abs(difficultyCount.easy - 50)
    const mediumDiff = Math.abs(difficultyCount.medium - 30)
    const hardDiff = Math.abs(difficultyCount.hard - 20)

    if (easyDiff > 5 || mediumDiff > 5 || hardDiff > 5) {
      throw new Error(`Invalid difficulty distribution: easy=${difficultyCount.easy}, medium=${difficultyCount.medium}, hard=${difficultyCount.hard}`)
    }

    return cards
  } catch (error) {
    console.error(`Failed to parse/validate cards for ${enablerId}:`, error.message)
    throw error
  }
}

const generateForEnabler = async (enabler, domains, tasks) => {
  const { domain, task, enablerNum } = parseEnablerId(enabler.id)
  const domainInfo = domains.find(d => d.id === domain)
  const taskInfo = tasks.find(t => t.id === task)

  console.log(`\nGenerating cards for ${enabler.id}: ${enabler.text}`)

  const prompt = buildPrompt(enabler, domainInfo, taskInfo)

  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    try {
      attempts++
      console.log(`Attempt ${attempts}/${maxAttempts}...`)

      const response = callOllama(prompt)
      const cards = parseAndValidateCards(response, enabler.id)

      // Create output directory
      const outputDir = path.join(sourceDir, domain, task)
      ensureDir(outputDir)

      // Write cards file
      const outputFile = path.join(outputDir, `${enabler.id}.json`)
      writeJson(outputFile, cards)

      console.log(`✅ Generated ${cards.length} cards for ${enabler.id}`)
      return { success: true, count: cards.length }

    } catch (error) {
      console.log(`❌ Attempt ${attempts} failed: ${error.message}`)
      if (attempts === maxAttempts) {
        throw error
      }
    }
  }
}

const main = async () => {
  const args = process.argv.slice(2)
  const resume = args.includes('--resume')
  const singleEnabler = args.find(arg => arg.startsWith('--enabler='))
  const enablerId = singleEnabler ? singleEnabler.split('=')[1] : null

  try {
    // Load data
    const enablers = readJson(path.join(dataDir, 'enablers.json'))
    const domains = readJson(path.join(dataDir, 'domains.json'))
    const tasks = readJson(path.join(dataDir, 'tasks.json'))

    let state = loadState()

    if (resume) {
      console.log('🔄 Resuming from previous state...')
      console.log(`Completed: ${state.completed.length}`)
      console.log(`Failed: ${state.failed.length}`)
    }

    let enablersToProcess = enablers

    if (enablerId) {
      // Test single enabler
      const enabler = enablers.find(e => e.id === enablerId)
      if (!enabler) {
        console.error(`Enabler not found: ${enablerId}`)
        process.exit(1)
      }
      enablersToProcess = [enabler]
      console.log(`🧪 Testing single enabler: ${enablerId}`)
    } else {
      // Filter out completed enablers
      if (resume) {
        enablersToProcess = enablers.filter(e => !state.completed.includes(e.id))
      }
    }

    console.log(`\n📚 Processing ${enablersToProcess.length} enablers...`)

    let startTime = Date.now()
    let processed = 0

    for (const enabler of enablersToProcess) {
      try {
        state.current = enabler.id
        saveState(state)

        const result = await generateForEnabler(enabler, domains, tasks)

        state.completed.push(enabler.id)
        processed++

        // Calculate ETA
        const elapsed = Date.now() - startTime
        const avgTimePerEnabler = elapsed / processed
        const remaining = enablersToProcess.length - processed
        const eta = Math.round((remaining * avgTimePerEnabler) / 1000 / 60)

        console.log(`\nProgress: ${processed}/${enablersToProcess.length} (${Math.round(processed/enablersToProcess.length*100)}%)`)
        console.log(`ETA: ~${eta} minutes`)

      } catch (error) {
        console.error(`\n❌ Failed to generate cards for ${enabler.id}:`, error.message)
        state.failed.push({ id: enabler.id, error: error.message })
      }

      saveState(state)
    }

    state.current = null
    saveState(state)

    console.log('\n🎉 Generation complete!')
    console.log(`✅ Successfully generated: ${state.completed.length} enablers`)
    console.log(`❌ Failed: ${state.failed.length} enablers`)

    if (state.failed.length > 0) {
      console.log('\nFailed enablers:')
      state.failed.forEach(f => console.log(`  - ${f.id}: ${f.error}`))
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message)
    process.exit(1)
  }
}

main()