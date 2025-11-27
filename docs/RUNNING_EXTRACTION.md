# Running the PMP Definition Extraction Test

## Quick Start

```bash
# Make sure Ollama is running
ollama serve

# In another terminal, run the test
cd /Users/dustinober/Projects/PMP_Practice_Static
node scripts/test-extraction.mjs
```

## What It Does

1. Converts first 5 pages of the PMP exam outline PDF to images
2. Sends images to Ollama (qwen3-vl:2b model)
3. Extracts term/definition pairs
4. Saves results to `data-extraction/test/test-result.json`

## Configuration

Edit `.env` file to change the model:
```bash
OLLAMA_MODEL=qwen3-vl:2b
USE_OLLAMA=true
```

## Adjusting Pages

Edit `scripts/test-extraction.mjs` line 16:
```javascript
const MAX_PAGES = 5  // Change this number
```

## Output

- **Console**: Verbose progress logging
- **File**: `data-extraction/test/test-result.json`

## Troubleshooting

**Ollama not running:**
```bash
ollama serve
```

**Model not found:**
```bash
ollama pull qwen3-vl:2b
```

**Check available models:**
```bash
ollama list
```
