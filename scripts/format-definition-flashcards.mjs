import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.resolve(__dirname, '..')
const inputDir = path.join(rootDir, 'data-extraction', 'definitions-raw')
const outputDir = path.join(rootDir, 'src', 'data', 'flashcards-definitions')

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

const readJson = (filePath) => {
    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))
}

const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', {
        encoding: 'utf8',
    })
}

// Generate a slug-friendly ID from document name
const generateDocSlug = (documentName) => {
    return documentName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

// Generate unique flashcard ID
const generateFlashcardId = (docSlug, index) => {
    return `def-${docSlug}-${String(index + 1).padStart(3, '0')}`
}

// Format a single definition as a flashcard
const formatDefinitionFlashcard = (definition, docSlug, docName, index) => {
    const flashcard = {
        id: generateFlashcardId(docSlug, index),
        type: 'definition',
        category: 'DEFINITION',
        source: docName,
        front: `What is ${definition.term}?`,
        back: definition.definition,
    }

    // Add page number if available
    if (definition.page) {
        flashcard.page = definition.page
    }

    return flashcard
}

// Process a single extraction file
const processExtractionFile = (filename) => {
    const inputPath = path.join(inputDir, filename)
    const extraction = readJson(inputPath)

    console.log(`\n📄 Processing: ${extraction.document}`)
    console.log(`   Definitions found: ${extraction.definitionsCount}`)

    if (extraction.definitionsCount === 0) {
        console.log(`   ⚠️  No definitions to convert, skipping...`)
        return null
    }

    const docSlug = generateDocSlug(extraction.document)
    const flashcards = extraction.definitions.map((def, index) =>
        formatDefinitionFlashcard(def, docSlug, extraction.document, index)
    )

    // Validate flashcards
    const validFlashcards = flashcards.filter((card) => {
        if (!card.front || !card.back) {
            console.warn(`   ⚠️  Skipping invalid flashcard: ${card.id}`)
            return false
        }
        return true
    })

    console.log(`   ✅ Created ${validFlashcards.length} flashcards`)

    // Create output filename
    const outputFilename = `${docSlug}.json`
    const outputPath = path.join(outputDir, outputFilename)
    writeJson(outputPath, validFlashcards)
    console.log(`   💾 Saved to: flashcards-definitions/${outputFilename}`)

    return {
        document: extraction.document,
        slug: docSlug,
        flashcardsCreated: validFlashcards.length,
        outputFile: outputFilename,
    }
}

const main = () => {
    console.log('🃏 Formatting Definition Flashcards')
    console.log('===================================\n')

    // Check if input directory exists
    if (!fs.existsSync(inputDir)) {
        console.error(`❌ Error: Input directory not found: ${inputDir}`)
        console.error('   Please run extract-definitions-ai.mjs first')
        process.exit(1)
    }

    ensureDir(outputDir)

    // Get all extraction JSON files (excluding summary)
    const extractionFiles = fs
        .readdirSync(inputDir)
        .filter((file) => file.endsWith('.json') && !file.startsWith('_'))

    if (extractionFiles.length === 0) {
        console.log('⚠️  No extraction files found')
        console.log('   Please run extract-definitions-ai.mjs first')
        process.exit(0)
    }

    console.log(`📋 Found ${extractionFiles.length} extraction file(s)\n`)

    const results = []

    for (const filename of extractionFiles) {
        const result = processExtractionFile(filename)
        if (result) {
            results.push(result)
        }
    }

    // Create summary
    const summaryPath = path.join(outputDir, '_flashcards_summary.json')
    writeJson(summaryPath, {
        createdAt: new Date().toISOString(),
        totalDocuments: results.length,
        totalFlashcards: results.reduce((sum, r) => sum + r.flashcardsCreated, 0),
        documents: results,
    })

    console.log('\n✅ Formatting Complete!')
    console.log(`   Total documents: ${results.length}`)
    console.log(
        `   Total flashcards: ${results.reduce((sum, r) => sum + r.flashcardsCreated, 0)}`
    )
    console.log(`\n📁 Output directory: ${outputDir}`)
    console.log(
        `\nNext steps:\n   1. Review flashcards in: ${outputDir}\n   2. Update app to load definition flashcards`
    )
}

main()
