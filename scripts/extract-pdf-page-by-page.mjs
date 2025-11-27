import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.resolve(__dirname, '..')
const referencesDir = path.join(rootDir, 'references')
const outputDir = path.join(rootDir, 'data-extraction', 'definitions-raw')
const tempDir = path.join(outputDir, 'temp-images')

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:2b'

// Get PDF filename from command line or use default
const pdfFilename = process.argv[2] || 'Practice_Standard_Project_Configuration_Management.pdf'
const pdfPath = path.join(referencesDir, pdfFilename)

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

const cleanupDir = (dirPath) => {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true })
    }
}

// Get total page count from PDF
const getPDFPageCount = (pdfPath) => {
    const result = spawnSync('pdfinfo', [pdfPath], { encoding: 'utf8' })
    if (result.status !== 0) {
        throw new Error(`Failed to get PDF info: ${result.stderr}`)
    }
    const match = result.stdout.match(/Pages:\s+(\d+)/)
    return match ? parseInt(match[1]) : 0
}

// Convert single PDF page to image
const convertPageToImage = (pdfPath, pageNum) => {
    ensureDir(tempDir)

    const outputPrefix = path.join(tempDir, `page-${pageNum}`)

    const result = spawnSync('pdftoppm', [
        '-png',
        '-f', String(pageNum),
        '-l', String(pageNum),
        '-r', '150',
        pdfPath,
        outputPrefix
    ], { encoding: 'utf8' })

    if (result.error || result.status !== 0) {
        throw new Error(`PDF conversion failed: ${result.stderr}`)
    }

    const images = fs.readdirSync(tempDir)
        .filter(f => f.endsWith('.png'))
        .map(f => path.join(tempDir, f))

    return images[0]
}

const imageToBase64 = (imagePath) => {
    return fs.readFileSync(imagePath).toString('base64')
}

const extractPrompt = `Read this page and extract any terms that are explicitly defined.

For each term you find that has a definition, provide:
- term: the exact term
- definition: the definition given

Return as JSON array: [{"term": "...", "definition": "..."}]

Only return the JSON array, nothing else.`

const extractFromPage = (imagePath, pageNum) => {
    const imageBase64 = imageToBase64(imagePath)
    const imageSize = (imageBase64.length / 1024).toFixed(0)

    console.log(`      Image size: ${imageSize} KB`)

    const payload = {
        model: OLLAMA_MODEL,
        prompt: extractPrompt,
        images: [imageBase64],
        stream: false,
        options: {
            temperature: 0.1,
            num_predict: 2048,
        },
    }

    const tempFile = path.join(outputDir, 'temp-payload.json')
    fs.writeFileSync(tempFile, JSON.stringify(payload))

    const startTime = Date.now()
    const result = spawnSync('curl', [
        '-s',
        '-X', 'POST',
        'http://localhost:11434/api/generate',
        '-H', 'Content-Type: application/json',
        '-d', `@${tempFile}`,
    ], {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
    })

    fs.unlinkSync(tempFile)

    if (result.error || result.status !== 0) {
        throw new Error(`Ollama request failed: ${result.stderr}`)
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`      Response time: ${elapsed}s`)

    const response = JSON.parse(result.stdout)

    if (response.error) {
        console.log(`      ⚠️  Ollama error: ${response.error}`)
        return []
    }

    const responseText = response.response || ''
    console.log(`      Response length: ${responseText.length} chars`)

    // Try to parse JSON
    let definitions = []
    try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            definitions = JSON.parse(jsonMatch[0])
            console.log(`      ✅ Found ${definitions.length} definition(s)`)
        } else {
            console.log(`      ⚠️  No JSON array in response`)
        }
    } catch (parseError) {
        console.log(`      ⚠️  JSON parse error: ${parseError.message}`)
    }

    return definitions
}

const main = async () => {
    console.log('📚 PMP Definition Extraction - Page by Page')
    console.log('============================================\n')
    console.log(`Model: ${OLLAMA_MODEL}`)
    console.log(`PDF: ${pdfFilename}\n`)

    if (!fs.existsSync(pdfPath)) {
        console.error(`❌ PDF not found: ${pdfPath}`)
        process.exit(1)
    }

    ensureDir(outputDir)

    // Get total pages
    console.log('📊 Getting PDF info...')
    const totalPages = getPDFPageCount(pdfPath)
    console.log(`   Total pages: ${totalPages}\n`)

    const allDefinitions = []
    let processedPages = 0
    let totalDefinitions = 0

    console.log('🔄 Processing pages...\n')

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        console.log(`   Page ${pageNum}/${totalPages}:`)

        try {
            // Convert page to image
            console.log(`      Converting to image...`)
            const imagePath = convertPageToImage(pdfPath, pageNum)

            // Extract definitions
            console.log(`      Extracting definitions...`)
            const definitions = extractFromPage(imagePath, pageNum)

            // Add page number to each definition
            definitions.forEach(def => {
                def.page = pageNum
                allDefinitions.push(def)
            })

            totalDefinitions += definitions.length
            processedPages++

            // Clean up temp images after each page
            cleanupDir(tempDir)

            console.log(`      ✓ Page complete\n`)

            // Save progress every 10 pages
            if (pageNum % 10 === 0) {
                const progressFile = path.join(outputDir, `${pdfFilename.replace('.pdf', '')}_progress.json`)
                fs.writeFileSync(progressFile, JSON.stringify({
                    pdfFilename,
                    processedPages: pageNum,
                    totalPages,
                    definitionsCount: totalDefinitions,
                    definitions: allDefinitions,
                }, null, 2))
                console.log(`   💾 Progress saved (${pageNum}/${totalPages} pages)\n`)
            }

        } catch (error) {
            console.error(`      ❌ Error on page ${pageNum}: ${error.message}`)
            console.log(`      Continuing to next page...\n`)
        }
    }

    // Save final results
    const outputFilename = pdfFilename.replace('.pdf', '.json')
    const outputPath = path.join(outputDir, outputFilename)

    fs.writeFileSync(outputPath, JSON.stringify({
        document: pdfFilename,
        extractedAt: new Date().toISOString(),
        model: OLLAMA_MODEL,
        totalPages: totalPages,
        processedPages: processedPages,
        definitionsCount: totalDefinitions,
        definitions: allDefinitions,
    }, null, 2))

    console.log('\n✅ Extraction Complete!')
    console.log(`   Pages processed: ${processedPages}/${totalPages}`)
    console.log(`   Definitions extracted: ${totalDefinitions}`)
    console.log(`   Output: ${outputPath}`)

    // Clean up
    cleanupDir(tempDir)
}

main().catch((error) => {
    console.error('\n❌ Fatal error:', error.message)
    cleanupDir(tempDir)
    process.exit(1)
})
