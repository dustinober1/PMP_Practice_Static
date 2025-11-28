import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..')
const dataDir = path.join(rootDir, 'src', 'data')
const baseQuestionsPath = path.join(dataDir, 'questions.json')
const stateFile = path.join(rootDir, '.question-generation-state.json')
const ollamaModel = process.env.QUESTIONS_MODEL || 'gpt-oss:20b'

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

// Generate a unique question ID
const generateQuestionId = (domainId, taskId, enablerId, questionNum) => {
  return `q-${domainId}-${taskId.replace(/.*-/, '')}-${enablerId.replace(/.*-/, '')}-${questionNum}`
}

// Build context-enriched AI prompt for question generation
const buildQuestionPrompt = (enabler, domain, task, questionType, difficulty, index) => {
  const prompts = {
    'knowledge': `Create a knowledge-based definition question about this PMP concept.`,
    'scenario': `Create a scenario-based application question about this PMP concept.`,
    'process': `Create a process sequencing or "what comes next" question about this PMP concept.`,
    'best-practice': `Create a best practice identification question about this PMP concept.`
  }

  const basePrompt = prompts[questionType] || prompts['knowledge']

  return `You are a PMP exam prep expert creating high-quality multiple-choice questions.

DOMAIN: ${domain.name} (${domain.percentage}% of exam)
TASK: ${task.title}
ENABLER: ${enabler.text}
QUESTION TYPE: ${questionType}
DIFFICULTY: ${difficulty}

${basePrompt}

Create a PMP-style multiple-choice question with:

1. QUESTION: Clear, unambiguous scenario or definition
2. OPTIONS: Four plausible options (A, B, C, D)
   - Only one correct answer
   - Distractors should be plausible but clearly incorrect
   - Options should be parallel in structure
3. CORRECT ANSWER: Letter (A, B, C, or D)
4. EXPLANATION: Why the correct answer is right (2-3 sentences)
5. REFERENCE: PMBOK 7th Edition section or relevant standard

DIFFICULTY GUIDELINES:
- easy: Basic definition or straightforward application
- medium: Requires analysis or selection between similar options
- hard: Complex scenario, nuance, or comparison between concepts

Return ONLY valid JSON object:
{
  "id": "auto-generated",
  "domainId": "${domain.id}",
  "taskId": "${task.id}",
  "enablerIds": ["${enabler.id}"],
  "questionType": "${questionType}",
  "difficulty": "${difficulty}",
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "B",
  "explanation": "...",
  "reference": "PMBOK 7th ed., Section X.X"
}

DO NOT include any markdown code blocks or explanatory text. Return ONLY the raw JSON object.`
}

// Validate question structure
const validateQuestion = (question, indexLabel) => {
  const errors = []

  if (!question.question || typeof question.question !== 'string') {
    errors.push(`${indexLabel}: missing or invalid 'question'`)
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    errors.push(`${indexLabel}: must have exactly 4 options`)
  }

  if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
    errors.push(`${indexLabel}: correctAnswer must be A, B, C, or D`)
  }

  if (!question.explanation || typeof question.explanation !== 'string') {
    errors.push(`${indexLabel}: missing or invalid 'explanation'`)
  }

  if (!['easy', 'medium', 'hard'].includes(question.difficulty)) {
    errors.push(`${indexLabel}: invalid difficulty "${question.difficulty}"`)
  }

  const validTypes = ['knowledge', 'scenario', 'process', 'best-practice']
  if (!validTypes.includes(question.questionType)) {
    errors.push(`${indexLabel}: invalid questionType "${question.questionType}"`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Call Ollama to generate questions
const callOllama = (prompt) => {
  console.log(`Calling Ollama with model: ${ollamaModel}`)

  const result = spawnSync('ollama', ['run', ollamaModel], {
    input: prompt,
    encoding: 'utf8',
    timeout: 180000, // 3 minutes
    maxBuffer: 10 * 1024 * 1024 // 10MB buffer
  })

  if (result.error) {
    console.error('Ollama invocation failed:', result.error.message)
    throw result.error
  }

  if (result.status !== 0) {
    const errorOutput = (result.stderr || '').trim() || `Ollama exited with status ${result.status}`
    console.error('Ollama error:', errorOutput)
    throw new Error(`Ollama failed: ${errorOutput}`)
  }

  const output = (result.stdout || '').trim()

  if (!output) {
    throw new Error('Ollama returned empty response')
  }

  // Try to extract JSON from the response
  const jsonMatch = output.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('Raw Ollama output:', output)
    throw new Error('No JSON found in Ollama response')
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch (parseError) {
    console.error('Failed to parse JSON:', jsonMatch[0])
    throw new Error(`Invalid JSON from Ollama: ${parseError.message}`)
  }
}

// Generate questions for an enabler
const generateQuestionsForEnabler = async (enabler, domain, task) => {
  console.log(`\nGenerating questions for enabler: ${enabler.id}`)

  // Question generation strategy per enabler
  const questionConfig = [
    { type: 'knowledge', difficulty: 'easy' },
    { type: 'scenario', difficulty: 'medium' },
    { type: 'best-practice', difficulty: 'medium' }
  ]

  const questions = []

  for (let i = 0; i < questionConfig.length; i++) {
    const config = questionConfig[i]
    const prompt = buildQuestionPrompt(
      enabler,
      domain,
      task,
      config.type,
      config.difficulty,
      i + 1
    )

    try {
      console.log(`  Generating ${config.type} question (${config.difficulty})...`)
      const generatedQuestion = callOllama(prompt)

      // Override the auto-generated ID with our own format
      generatedQuestion.id = generateQuestionId(
        domain.id,
        task.id,
        enabler.id,
        i + 1
      )

      // Validate the generated question
      const validation = validateQuestion(generatedQuestion, `${enabler.id}-Q${i + 1}`)

      if (!validation.valid) {
        console.error(`  ❌ Validation failed:`, validation.errors)
        continue
      }

      questions.push(generatedQuestion)
      console.log(`  ✅ Generated question: ${generatedQuestion.id}`)

    } catch (error) {
      console.error(`  ❌ Failed to generate question:`, error.message)
    }
  }

  return questions
}

// Main generation function
const main = async () => {
  console.log('Starting AI-powered question generation...')

  // Load existing data
  let baseQuestions = []
  if (fs.existsSync(baseQuestionsPath)) {
    baseQuestions = readJson(baseQuestionsPath)
    console.log(`Loaded ${baseQuestions.length} existing questions`)
  }

  const domains = readJson(path.join(dataDir, 'domains.json'))
  const tasks = readJson(path.join(dataDir, 'tasks.json'))
  const enablers = readJson(path.join(dataDir, 'enablers.json'))

  // Create lookup maps
  const domainMap = new Map(domains.map(d => [d.id, d]))
  const taskMap = new Map(tasks.map(t => [t.id, t]))

  // Load state to track progress
  const state = loadState()
  const allQuestions = [...baseQuestions]
  const existingIds = new Set(allQuestions.map(q => q.id))

  console.log(`\nStarting generation. Total enablers to process: ${enablers.length}`)
  console.log(`Already completed: ${state.completed.length}`)
  console.log(`Failed so far: ${state.failed.length}`)

  let generatedCount = 0

  // Process each enabler
  for (const enabler of enablers) {
    if (state.completed.includes(enabler.id)) {
      console.log(`⏭️  Skipping ${enabler.id} (already completed)`)
      continue
    }

    try {
      const domain = domainMap.get(enabler.domainId) ||
                    domainMap.get(enabler.taskId?.split('-')[0])
      const task = taskMap.get(enabler.taskId)

      if (!domain || !task) {
        console.error(`❌ Missing domain or task for enabler ${enabler.id}`)
        state.failed.push(enabler.id)
        continue
      }

      const questions = await generateQuestionsForEnabler(enabler, domain, task)

      // Add new questions (avoid duplicates)
      for (const question of questions) {
        if (!existingIds.has(question.id)) {
          allQuestions.push(question)
          existingIds.add(question.id)
          generatedCount++
        }
      }

      state.completed.push(enabler.id)
      saveState(state) // Save progress after each enabler

      console.log(`✅ Completed ${enabler.id}: ${questions.length} questions generated`)

    } catch (error) {
      console.error(`❌ Failed to process enabler ${enabler.id}:`, error.message)
      state.failed.push(enabler.id)
      saveState(state)
    }
  }

  // Save final questions file
  writeJson(baseQuestionsPath, allQuestions)

  console.log(`\n🎉 Question generation completed!`)
  console.log(`📊 Summary:`)
  console.log(`   - Total questions: ${allQuestions.length}`)
  console.log(`   - Newly generated: ${generatedCount}`)
  console.log(`   - Enablers processed: ${state.completed.length}`)
  console.log(`   - Enablers failed: ${state.failed.length}`)

  if (state.failed.length > 0) {
    console.log(`❌ Failed enablers: ${state.failed.join(', ')}`)
  }
}

main().catch(console.error)
