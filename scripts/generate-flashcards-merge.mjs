import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..')
const dataDir = path.join(rootDir, 'src', 'data')
const sourceDir = path.join(dataDir, 'flashcards-source')
const outputDir = path.join(dataDir, 'flashcards')

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

const parseEnablerId = (filePath) => {
  // Extract from: src/data/flashcards-source/people/people-1/e-people-1-1.json
  const parts = filePath.split(path.sep)
  const enablerFile = parts[parts.length - 1] // e-people-1-1.json
  const enablerId = path.basename(enablerFile, '.json') // e-people-1-1
  const domain = parts[parts.length - 3] // people
  const task = parts[parts.length - 2] // people-1

  // Extract enabler number from e-people-1-1 -> 1
  const enablerParts = enablerId.split('-')
  const enablerNum = enablerParts[enablerParts.length - 1]

  return { domain, task, enablerNum, enablerId }
}

const generateCardId = (domain, task, enablerNum, cardIndex) => {
  // ID format: fc-{domain}-{task}-{enablerNum}-{cardNum}
  const cardNum = String(cardIndex + 1).padStart(3, '0')
  return `fc-${domain}-${task}-${enablerNum}-${cardNum}`
}

const processCardsFile = (filePath, domain) => {
  const { domain: fileDomain, task, enablerNum } = parseEnablerId(filePath)
  const sourceCards = readJson(filePath)

  if (!Array.isArray(sourceCards)) {
    console.warn(`Skipping invalid file (not an array): ${filePath}`)
    return []
  }

  const processedCards = sourceCards.map((card, index) => {
    const enhancedCard = {
      id: generateCardId(fileDomain, task, enablerNum, index),
      domainId: fileDomain,
      taskId: task,
      type: "concept", // All AI-generated cards are concept type
      front: card.front,
      back: card.back,
      tags: Array.isArray(card.tags) ? card.tags : [],
      difficulty: card.difficulty || "medium"
    }

    return enhancedCard
  })

  console.log(`📝 Processed ${processedCards.length} cards from ${path.basename(filePath)}`)
  return processedCards
}

const main = () => {
  console.log('🔄 Merging flashcard files from source directory...')

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`)
    console.log('Run the AI generation script first to create source files.')
    process.exit(1)
  }

  ensureDir(outputDir)

  const domainCards = {
    people: [],
    process: [],
    business: []
  }

  let totalFiles = 0
  let totalCards = 0

  // Walk the source directory tree
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        totalFiles++

        // Determine domain from file path
        const relativePath = path.relative(sourceDir, fullPath)
        const domain = relativePath.split(path.sep)[0]

        if (!domainCards[domain]) {
          console.warn(`⚠️  Unknown domain "${domain}" in file: ${fullPath}`)
          return
        }

        try {
          const cards = processCardsFile(fullPath, domain)
          domainCards[domain].push(...cards)
          totalCards += cards.length
        } catch (error) {
          console.error(`❌ Error processing file ${fullPath}:`, error.message)
        }
      }
    })
  }

  walk(sourceDir)

  // Sort all cards by ID for consistency
  Object.keys(domainCards).forEach(domain => {
    domainCards[domain].sort((a, b) => a.id.localeCompare(b.id))
  })

  // Write merged files
  Object.entries(domainCards).forEach(([domain, cards]) => {
    const outputPath = path.join(outputDir, `${domain}.json`)

    // Read existing cards to preserve any manually created ones
    let existingCards = []
    if (fs.existsSync(outputPath)) {
      existingCards = readJson(outputPath)
      console.log(`📖 Found ${existingCards.length} existing cards in ${domain}.json`)
    }

    // Filter out any existing AI-generated cards to avoid duplicates
    const existingManualCards = existingCards.filter(card => {
      // Keep cards that don't follow the new 4-segment ID pattern
      return !card.id.match(/^fc-\w+-\w+-\d+-\d{3}$/)
    })

    const allCards = [...existingManualCards, ...cards]
    writeJson(outputPath, allCards)

    console.log(`✅ ${domain}: ${existingManualCards.length} manual + ${cards.length} AI = ${allCards.length} total cards`)
  })

  console.log('\n📊 Merge Summary:')
  console.log(`📁 Files processed: ${totalFiles}`)
  console.log(`🃏 Total cards generated: ${totalCards}`)
  console.log(`🏗️  Domain breakdown:`)
  Object.entries(domainCards).forEach(([domain, cards]) => {
    console.log(`   ${domain}: ${cards.length} cards`)
  })

  console.log('\n🎉 Flashcard merge completed successfully!')
  console.log('\nNext steps:')
  console.log('1. Run: npm run dev')
  console.log('2. Navigate to /flashcards to test the application')
  console.log('3. Verify cards load correctly and filters work')
}

main()