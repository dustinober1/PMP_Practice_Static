import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..')
const dataDir = path.join(rootDir, 'src', 'data')
const baseQuestionsPath = path.join(dataDir, 'questions.json')

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: 'utf8'
  })
}

const main = () => {
  let baseQuestions = []
  if (fs.existsSync(baseQuestionsPath)) {
    baseQuestions = readJson(baseQuestionsPath)
  } else {
    console.log(`Warning: ${baseQuestionsPath} not found. Starting with empty questions array.`)
  }
  const allQuestions = [...baseQuestions]
  const existingIds = new Set(allQuestions.map((q) => q.id))

  const perEnablerRoot = path.join(dataDir, 'questions')
  if (fs.existsSync(perEnablerRoot)) {
    const walk = (dir) => {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(full)
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          console.log('Processing file:', full);
          const items = readJson(full)
          items.forEach((q) => {
            if (!q.id || existingIds.has(q.id)) return
            allQuestions.push(q)
            existingIds.add(q.id)
          })
        }
      })
    }
    walk(perEnablerRoot)
  }

  writeJson(baseQuestionsPath, allQuestions)
  console.log(
    `Generated questions from templates. Total questions now: ${allQuestions.length}.`
  )
}

main()
