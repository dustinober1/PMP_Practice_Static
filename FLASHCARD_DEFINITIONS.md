# Definition Flashcards Extraction

This directory contains scripts to extract PMP terminology definitions from reference PDFs using AI vision.

## Setup

1. **Install dependencies** (already done automatically):
   ```bash
   npm install
   ```

2. **Choose AI Provider**:

   **Option A: Ollama (Recommended - Free & Local)**
   - Install Ollama: https://ollama.ai
   - Pull a vision model:
     ```bash
     ollama pull llama3.2-vision:11b
     ```
   - Start Ollama:
     ```bash
     ollama serve
     ```
   - Copy `.env.example` to `.env` (default uses Ollama):
     ```bash
     cp .env.example .env
     ```

   **Option B: Anthropic Claude (Cloud - Paid)**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and set:
     ```
     USE_OLLAMA=false
     ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
     ```
   - Get API key from: https://console.anthropic.com/

## Usage

### Extract Definitions from PDFs

**Priority documents** (PMBOK, Agile Guide, 2026 Exam Outline, BA Guide):
```bash
npm run extract:definitions
```

**All PDFs** in the references folder:
```bash
npm run extract:definitions -- --all
```

This will:
- Process each PDF using Claude's vision API
- Extract term/definition pairs
- Save raw results to `data-extraction/definitions-raw/`
- Generate a summary of extracted definitions

### Format as Flashcards

Convert extracted definitions into flashcard format:
```bash
npm run format:definitions
```

This will:
- Read extracted definitions from `data-extraction/definitions-raw/`
- Format each as a flashcard following the template
- Save to `src/data/flashcards-definitions/`
- Generate flashcard summary

### Full Pipeline

Run extraction and formatting in one command:
```bash
npm run generate:definitions
```

## Output Structure

```
data-extraction/definitions-raw/
  ├── pmbokguide_eighthed_eng.json
  ├── AgilePracticeGuide.json
  └── _extraction_summary.json

src/data/flashcards-definitions/
  ├── pmbok-guide-8th-edition.json
  ├── agile-practice-guide.json
  └── _flashcards_summary.json
```

## Flashcard Structure

Each flashcard file contains an array of definition flashcards:

```json
[
  {
    "id": "def-pmbok-guide-8th-edition-001",
    "type": "definition",
    "category": "DEFINITION",
    "source": "PMBOK Guide 8th Edition",
    "page": 123,
    "front": "What is Progressive Elaboration?",
    "back": "The iterative process of continuously improving and detailing a plan as more information becomes available."
  }
]
```

## Cost Estimation

Claude API costs vary by model and usage. For the Sonnet model:
- ~$3 per million input tokens
- ~$15 per million output tokens

Processing large PDFs (like PMBOK ~400 pages) may cost $1-3 per document.
Priority documents (4 PDFs) estimated cost: $5-10 total.

## Troubleshooting

**API Key Error**: Make sure `.env` file exists and contains valid `ANTHROPIC_API_KEY`

**PDF Not Found**: Check that PDFs exist in `references/` directory

**Rate Limiting**: Script includes 2-second delays between requests to avoid throttling
