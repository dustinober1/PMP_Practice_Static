import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..')
const dataDir = path.join(rootDir, 'src', 'data')
const outputDir = path.join(dataDir, 'flashcards-source')

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

const main = () => {
  const enablers = readJson(path.join(dataDir, 'enablers.json'))
  const tasks = readJson(path.join(dataDir, 'tasks.json'))
  const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t]))

  let created = 0
  let skipped = 0

  enablers.forEach((enabler) => {
    const task = taskMap[enabler.taskId]
    if (!task) {
      console.warn(`Skipping ${enabler.id}: task ${enabler.taskId} not found`)
      return
    }

    const domainId = task.domainId
    const dirPath = path.join(outputDir, domainId, enabler.taskId)
    const filePath = path.join(dirPath, `${enabler.id}.json`)

    ensureDir(dirPath)

    if (fs.existsSync(filePath)) {
      skipped++
      return
    }

    fs.writeFileSync(filePath, '[]\n', { encoding: 'utf8' })
    created++
  })

  console.log('Bootstrap flashcards-source complete.')
  console.log(`Created: ${created} files`)
  console.log(`Skipped (already existed): ${skipped} files`)
}

main()

