import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..')
const dataDir = path.join(rootDir, 'src', 'data')
const questionsPath = path.join(dataDir, 'questions.json')
const perEnablerRoot = path.join(dataDir, 'questions')

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))

const writeJson = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: 'utf8'
  })
}

const main = () => {
  const allQuestions = readJson(questionsPath)

  const baseQuestions = []
  const grouped = {}

  allQuestions.forEach((q) => {
    const enablerIds = Array.isArray(q.enablerIds) ? q.enablerIds : []
    const peopleEnablers = enablerIds.filter((id) => id.startsWith('e-people-'))

    if (!peopleEnablers.length) {
      baseQuestions.push(q)
      return
    }

    peopleEnablers.forEach((enablerId) => {
      const key = enablerId
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(q)
    })
  })

  Object.entries(grouped).forEach(([enablerId, questions]) => {
    const [_, domain, taskNumber] = enablerId.split('-')
    const taskId = `${domain}-${taskNumber}`
    const dir = path.join(perEnablerRoot, domain, taskId)
    const file = path.join(dir, `${enablerId}.json`)
    writeJson(file, questions)
    console.log(`Wrote ${questions.length} questions to ${file}`)
  })

  writeJson(questionsPath, baseQuestions)
  console.log(
    `Split questions: ${allQuestions.length} original, ${baseQuestions.length} remaining in questions.json`
  )
}

main()
