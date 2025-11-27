import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.resolve(__dirname, '..')
const referencesDir = path.join(rootDir, 'references')
const outputDir = path.join(rootDir, 'data-extraction', 'test')
const tempDir = path.join(outputDir, 'temp-images')

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:latest'
const MAX_PAGES = 5 // Test with first 5 pages

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

// Convert PDF pages to PNG images
const pdfToImages = (pdfPath, maxPages = MAX_PAGES) => {
    console.log(`   Converting PDF to images (first ${maxPages} pages)...`)

    ensureDir(tempDir)

    const outputPrefix = path.join(tempDir, 'page')

    // Use pdftoppm to convert PDF to PNG images
    const result = spawnSync('pdftoppm', [
        '-png',
        '-f', '1',           // First page
        '-l', String(maxPages), // Last page
        '-r', '150',         // DPI (resolution)
        pdfPath,
        outputPrefix
    ], {
        encoding: 'utf8',
    })

    if (result.error) {
        throw new Error(`PDF conversion error: ${result.error.message}`)
    }

    if (result.status !== 0) {
        throw new Error(`pdftoppm failed: ${result.stderr}`)
    }

    // Get list of generated images
    const images = fs.readdirSync(tempDir)
        .filter(f => f.endsWith('.png'))
        .sort()
        .map(f => path.join(tempDir, f))

    console.log(`   ✅ Converted ${images.length} pages to images`)
    return images
}

const imageToBase64 = (imagePath) => {
    const imageBuffer = fs.readFileSync(imagePath)
    return imageBuffer.toString('base64')
}

const extractPrompt = `Read this page and extract any terms that are explicitly defined.

For each term you find that has a definition, provide:
- term: the exact term
- definition: the definition given

Return as JSON array: [{"term": "...", "definition": "..."}]

Only return the JSON array, nothing else.`

const extractWithOllama = (imagePaths) => {
    console.log(`\n📡 Ollama API Request`)
    console.log(`   Model: ${OLLAMA_MODEL}`)
    console.log(`   Images: ${imagePaths.length}`)

    // Convert all images to base64
    console.log(`   Converting images to base64...`)
    const imageBase64s = imagePaths.map((img, i) => {
        const b64 = imageToBase64(img)
        console.log(`      Image ${i + 1}: ${(b64.length / 1024).toFixed(0)} KB`)
        return b64
    })

    const promptPayload = JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: extractPrompt,
        images: imageBase64s,
        stream: false,
        options: {
            temperature: 0.1,
            num_predict: 4096,
        },
    })

    // Write payload to temp file to avoid E2BIG error
    const tempFile = path.join(outputDir, 'temp-payload.json')
    console.log(`   Payload size: ${(promptPayload.length / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Writing to temp file: ${tempFile}`)
    fs.writeFileSync(tempFile, promptPayload)

    console.log(`   Sending request to Ollama...`)
    const startTime = Date.now()

    const result = spawnSync('curl', [
        '-X', 'POST',
        'http://localhost:11434/api/generate',
        '-H', 'Content-Type: application/json',
        '-d', `@${tempFile}`,
    ], {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
    })

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`   ✅ Response received in ${elapsed}s`)

    // Clean up temp file
    if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile)
    }

    if (result.error) {
        throw new Error(`Ollama API error: ${result.error.message}`)
    }

    if (result.status !== 0) {
        console.error(`   ❌ Curl failed with status ${result.status}`)
        console.error(`   stderr: ${result.stderr}`)
        throw new Error(`Ollama returned status ${result.status}: ${result.stderr}`)
    }

    console.log(`   Response size: ${(result.stdout.length / 1024).toFixed(1)} KB`)

    const response = JSON.parse(result.stdout)

    if (response.error) {
        throw new Error(`Ollama error: ${response.error}`)
    }

    console.log(`   Model response length: ${response.response?.length || 0} characters`)

    return response.response
}

const testExtraction = async () => {
    console.log('🧪 Testing PDF Definition Extraction with Ollama')
    console.log('=================================================\n')
    console.log(`Model: ${OLLAMA_MODEL}`)
    console.log(`Testing with first ${MAX_PAGES} pages\n`)

    ensureDir(outputDir)

    // Test with the 2026 exam outline (smaller PDF)
    const testPdf = 'New-PMP-Examination-Content-Outline-2026.pdf'
    const pdfPath = path.join(referencesDir, testPdf)

    if (!fs.existsSync(pdfPath)) {
        console.error(`❌ Test PDF not found: ${testPdf}`)
        process.exit(1)
    }

    console.log(`📄 Testing with: ${testPdf}\n`)

    try {
        // Convert PDF to images
        const imagePaths = pdfToImages(pdfPath, MAX_PAGES)

        // Extract definitions
        const responseText = extractWithOllama(imagePaths)

        // Clean up temp images
        cleanupDir(tempDir)

        console.log(`\n✅ Received response from Ollama`)
        console.log(`   Response length: ${responseText.length} characters\n`)

        // Try to parse JSON
        let definitions = []
        try {
            const jsonMatch = responseText.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                definitions = JSON.parse(jsonMatch[0])
                console.log(`✅ Successfully parsed ${definitions.length} definitions\n`)

                // Show first 5 definitions
                console.log('📋 Sample definitions:')
                definitions.slice(0, 5).forEach((def, i) => {
                    console.log(`\n${i + 1}. Term: "${def.term}"`)
                    console.log(`   Definition: ${def.definition.substring(0, 150)}${def.definition.length > 150 ? '...' : ''}`)
                    if (def.page) console.log(`   Page: ${def.page}`)
                })
            } else {
                console.log(`⚠️  No JSON array found in response`)
                console.log(`\nRaw response preview:`)
                console.log(responseText.substring(0, 500))
            }
        } catch (parseError) {
            console.error(`❌ Failed to parse JSON:`, parseError.message)
            console.log(`\nRaw response preview:`)
            console.log(responseText.substring(0, 500))
        }

        // Save test result
        const outputPath = path.join(outputDir, 'test-result.json')
        fs.writeFileSync(outputPath, JSON.stringify({
            model: OLLAMA_MODEL,
            testedAt: new Date().toISOString(),
            testPdf: testPdf,
            pagesProcessed: MAX_PAGES,
            definitionsCount: definitions.length,
            definitions: definitions,
            rawResponse: responseText,
        }, null, 2))

        console.log(`\n💾 Test result saved to: ${outputPath}`)

        if (definitions.length > 0) {
            console.log(`\n✅ Test successful! The model extracted ${definitions.length} definitions from ${MAX_PAGES} pages.`)
            console.log(`\nNext steps:`)
            console.log(`   1. Review the test results in: ${outputPath}`)
            console.log(`   2. If satisfied, update extract-definitions-ai.mjs to use image conversion`)
            console.log(`   3. Run: npm run extract:definitions`)
        } else {
            console.log(`\n⚠️  No definitions extracted. Check the raw response above.`)
        }

    } catch (error) {
        console.error(`\n❌ Test failed:`, error.message)
        cleanupDir(tempDir)
        process.exit(1)
    }
}

testExtraction()
