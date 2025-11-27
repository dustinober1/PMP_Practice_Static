import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import Anthropic from '@anthropic-ai/sdk'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.resolve(__dirname, '..')
const referencesDir = path.join(rootDir, 'references')
const outputDir = path.join(rootDir, 'data-extraction', 'definitions-raw')

// Configuration
const USE_OLLAMA = process.env.USE_OLLAMA !== 'false' // Default to Ollama
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2-vision:11b'
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022'

// Initialize Anthropic client (only if not using Ollama)
let anthropicClient = null
if (!USE_OLLAMA) {
    anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    })
}

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

const readJson = (filePath) => {
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))
}

const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', {
        encoding: 'utf8',
    })
}

// Convert PDF to base64 for Claude API
const pdfToBase64 = (pdfPath) => {
    const pdfBuffer = fs.readFileSync(pdfPath)
    return pdfBuffer.toString('base64')
}

const extractPrompt = `You are analyzing a PMP(Project Management Professional) reference document to extract terminology and definitions.

Your task is to:
1. Identify all terms that have clear, explicit definitions in this document
2. Extract the term and its complete definition
3. Focus on project management terminology, concepts, methodologies, and frameworks
4. Only include terms that are actually defined in the text(not just mentioned)

Return your response as a JSON array of objects with this structure:
[
    {
        "term": "The exact term being defined",
        "definition": "The complete definition as stated in the document",
        "page": "Page number if visible (or null if not visible)"
    }
]

Guidelines:
- Only include explicit definitions, not casual mentions or usage
    - Keep definitions complete but concise
        - If a term has multiple definitions, create separate entries
            - Maintain the original wording from the document
                - Skip common words or concepts not specific to project management

Return ONLY the JSON array, no additional text.`

const extractWithOllama = (pdfPath) => {
    console.log(`   Using Ollama model: ${OLLAMA_MODEL} `)

    const pdfBase64 = pdfToBase64(pdfPath)

    // Create a temporary prompt file for Ollama
    const promptPayload = JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: extractPrompt,
        images: [pdfBase64],
        stream: false,
        options: {
            temperature: 0.1,
            num_predict: 4096,
        },
    })

    const result = spawnSync('curl', [
        '-X', 'POST',
        'http://localhost:11434/api/generate',
        '-H', 'Content-Type: application/json',
        '-d', promptPayload,
    ], {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large responses
    })

    if (result.error) {
        throw new Error(`Ollama API error: ${result.error.message} `)
    }

    if (result.status !== 0) {
        throw new Error(`Ollama returned status ${result.status}: ${result.stderr} `)
    }

    const response = JSON.parse(result.stdout)
    return response.response
}

const extractWithAnthropic = async (pdfPath) => {
    console.log(`   Using Anthropic model: ${ANTHROPIC_MODEL} `)

    const pdfBase64 = pdfToBase64(pdfPath)

    const message = await anthropicClient.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 4096,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'document',
                        source: {
                            type: 'base64',
                            media_type: 'application/pdf',
                            data: pdfBase64,
                        },
                    },
                    {
                        type: 'text',
                        text: extractPrompt,
                    },
                ],
            },
        ],
    })

    return message.content[0].text
}

const extractDefinitionsFromPDF = async (pdfPath, documentName) => {
    console.log(`\n📄 Processing: ${documentName} `)
    console.log(`   Path: ${pdfPath} `)

    try {
        let responseText

        if (USE_OLLAMA) {
            responseText = extractWithOllama(pdfPath)
        } else {
            responseText = await extractWithAnthropic(pdfPath)
        }

        console.log(`   Received response`)

        // Try to parse JSON from response
        let definitions = []
        try {
            // Look for JSON array in the response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                definitions = JSON.parse(jsonMatch[0])
                console.log(`   ✅ Extracted ${definitions.length} definitions`)
            } else {
                console.log(`   ⚠️  No JSON array found in response`)
                console.log(`   Response preview: ${responseText.substring(0, 200)}...`)
            }
        } catch (parseError) {
            console.error(`   ❌ Failed to parse JSON response: `, parseError.message)
            console.log(`   Response preview: ${responseText.substring(0, 200)}...`)
        }

        return {
            document: documentName,
            documentPath: pdfPath,
            extractedAt: new Date().toISOString(),
            model: USE_OLLAMA ? OLLAMA_MODEL : ANTHROPIC_MODEL,
            definitionsCount: definitions.length,
            definitions: definitions,
            rawResponse: responseText,
        }
    } catch (error) {
        console.error(`   ❌ Error processing ${documentName}: `, error.message)
        return {
            document: documentName,
            documentPath: pdfPath,
            extractedAt: new Date().toISOString(),
            model: USE_OLLAMA ? OLLAMA_MODEL : ANTHROPIC_MODEL,
            definitionsCount: 0,
            definitions: [],
            error: error.message,
        }
    }
}
const main = async () => {
    console.log('🚀 PMP Definition Extraction from PDFs')
    console.log('=======================================\n')

    if (USE_OLLAMA) {
        console.log(`📌 Using Ollama(model: ${OLLAMA_MODEL})`)
        console.log('   Make sure Ollama is running: ollama serve\n')

        // Check if Ollama is available
        const ollamaCheck = spawnSync('curl', [
            '-s',
            'http://localhost:11434/api/tags',
        ], { encoding: 'utf8' })

        if (ollamaCheck.status !== 0) {
            console.error('❌ Error: Cannot connect to Ollama')
            console.error('   Please start Ollama: ollama serve')
            console.error('   Or use Anthropic instead: export USE_OLLAMA=false')
            process.exit(1)
        }
    } else {
        console.log(`📌 Using Anthropic Claude(model: ${ANTHROPIC_MODEL}) \n`)

        if (!process.env.ANTHROPIC_API_KEY) {
            console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set')
            console.error('   Please set your Anthropic API key:')
            console.error('   export ANTHROPIC_API_KEY=your-api-key-here')
            console.error('   Or use Ollama instead: export USE_OLLAMA=true')
            process.exit(1)
        }
    }

    ensureDir(outputDir)

    // Define priority documents to process
    const priorityDocs = [
        {
            filename: 'pmbokguide_eighthed_eng.pdf',
            name: 'PMBOK Guide 8th Edition',
        },
        {
            filename: 'AgilePracticeGuide.pdf',
            name: 'Agile Practice Guide',
        },
        {
            filename: 'New-PMP-Examination-Content-Outline-2026.pdf',
            name: 'PMP Examination Content Outline 2026',
        },
        {
            filename: 'pmi_guide to ba.pdf',
            name: 'PMI Guide to Business Analysis',
        },
    ]

    // Get list of all PDFs if --all flag is provided
    const processAll = process.argv.includes('--all')
    const allPDFs = fs
        .readdirSync(referencesDir)
        .filter((file) => file.endsWith('.pdf'))

    const docsToProcess = processAll
        ? allPDFs.map((filename) => ({
            filename,
            name: filename.replace('.pdf', '').replace(/_/g, ' '),
        }))
        : priorityDocs

    console.log(
        `📋 Processing ${docsToProcess.length} document(s)${processAll ? ' (ALL)' : ' (PRIORITY)'} \n`
    )

    const results = []

    for (const doc of docsToProcess) {
        const pdfPath = path.join(referencesDir, doc.filename)

        if (!fs.existsSync(pdfPath)) {
            console.log(`⚠️  Skipping ${doc.name}: File not found`)
            continue
        }

        const result = await extractDefinitionsFromPDF(pdfPath, doc.name)
        results.push(result)

        // Save individual result
        const outputFilename = doc.filename.replace('.pdf', '.json')
        const outputPath = path.join(outputDir, outputFilename)
        writeJson(outputPath, result)
        console.log(`   💾 Saved to: ${outputFilename} \n`)

        // Rate limiting: wait 2 seconds between requests to avoid API throttling
        if (docsToProcess.indexOf(doc) < docsToProcess.length - 1) {
            console.log(`   ⏳ Waiting 2 seconds before next request...\n`)
            await new Promise((resolve) => setTimeout(resolve, 2000))
        }
    }

    // Save summary
    const summaryPath = path.join(outputDir, '_extraction_summary.json')
    writeJson(summaryPath, {
        extractedAt: new Date().toISOString(),
        totalDocuments: results.length,
        totalDefinitions: results.reduce((sum, r) => sum + r.definitionsCount, 0),
        results: results.map((r) => ({
            document: r.document,
            definitionsCount: r.definitionsCount,
            hasError: !!r.error,
        })),
    })

    console.log('\n✅ Extraction Complete!')
    console.log(`   Total documents processed: ${results.length} `)
    console.log(
        `   Total definitions extracted: ${results.reduce((sum, r) => sum + r.definitionsCount, 0)} `
    )
    console.log(`   Summary saved to: _extraction_summary.json`)
    console.log(`\n📁 Output directory: ${outputDir} `)
}

main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})
