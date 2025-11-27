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

const pdfToImages = (pdfPath, maxPages = 1) => {
    console.log(`   Converting first page of PDF to image...`)

    ensureDir(tempDir)
    const outputPrefix = path.join(tempDir, 'page')

    const result = spawnSync('pdftoppm', [
        '-png',
        '-f', '1',
        '-l', String(maxPages),
        '-r', '150',
        pdfPath,
        outputPrefix
    ], { encoding: 'utf8' })

    if (result.error || result.status !== 0) {
        throw new Error(`PDF conversion failed: ${result.stderr}`)
    }

    const images = fs.readdirSync(tempDir)
        .filter(f => f.endsWith('.png'))
        .sort()
        .map(f => path.join(tempDir, f))

    console.log(`   ✅ Converted to image: ${images[0]}`)
    return images
}

const imageToBase64 = (imagePath) => {
    return fs.readFileSync(imagePath).toString('base64')
}

const testSimpleVision = async () => {
    console.log('🧪 Simple Vision Test with Ollama')
    console.log('==================================\n')
    console.log(`Model: ${OLLAMA_MODEL}\n`)

    ensureDir(outputDir)

    const testPdf = 'New-PMP-Examination-Content-Outline-2026.pdf'
    const pdfPath = path.join(referencesDir, testPdf)

    if (!fs.existsSync(pdfPath)) {
        console.error(`❌ Test PDF not found`)
        process.exit(1)
    }

    try {
        const imagePaths = pdfToImages(pdfPath, 1)
        const imageBase64 = imageToBase64(imagePaths[0])

        console.log(`   Image size: ${(imageBase64.length / 1024).toFixed(0)} KB (base64)\n`)

        // Simple prompt - just describe what you see
        const simplePrompt = "Describe what you see in this image. List any headings, titles, or important text you can read."

        const payload = {
            model: OLLAMA_MODEL,
            prompt: simplePrompt,
            images: [imageBase64],
            stream: false,
        }

        const tempFile = path.join(outputDir, 'simple-test-payload.json')
        fs.writeFileSync(tempFile, JSON.stringify(payload))

        console.log(`   Sending simple vision test to Ollama...`)
        const result = spawnSync('curl', [
            '-X', 'POST',
            'http://localhost:11434/api/generate',
            '-H', 'Content-Type: application/json',
            '-d', `@${tempFile}`,
        ], {
            encoding: 'utf8',
            maxBuffer: 50 * 1024 * 1024,
        })

        fs.unlinkSync(tempFile)
        cleanupDir(tempDir)

        if (result.error || result.status !== 0) {
            throw new Error(`Ollama request failed: ${result.stderr}`)
        }

        const response = JSON.parse(result.stdout)

        console.log(`\n✅ Response received:`)
        console.log(`   Error: ${response.error || 'none'}`)
        console.log(`   Response: ${response.response || '(empty)'}`)
        console.log(`\nFull response object:`)
        console.log(JSON.stringify(response, null, 2))

        if (response.response && response.response.length > 0) {
            console.log(`\n✅ Vision model is working!`)
            console.log(`\nNow we can proceed with definition extraction.`)
        } else {
            console.log(`\n⚠️  Model returned empty response. This might be a model configuration issue.`)
            console.log(`\nTry:`)
            console.log(`   1. Check if model supports vision: ollama show ${OLLAMA_MODEL}`)
            console.log(`   2. Try a different model: llama3.2-vision:11b or llava:13b`)
        }

    } catch (error) {
        console.error(`\n❌ Test failed:`, error.message)
        cleanupDir(tempDir)
        process.exit(1)
    }
}

testSimpleVision()
