#!/usr/bin/env python3
"""
Build a vector dataset from the reference PDFs for downstream RAG use.

The script extracts text from each PDF in the /references directory, splits the
text into word-based chunks with overlap, embeds each chunk with a local
sentence-transformers model (or Ollama if requested), and writes the
metadata/embeddings/summary JSON files consumed by useVectorSearch.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List

import requests

# Force offline model loading so we rely on cached weights
os.environ.setdefault('HF_HUB_OFFLINE', '1')
os.environ.setdefault('TRANSFORMERS_OFFLINE', '1')

try:
  from sentence_transformers import SentenceTransformer
except ImportError:
  SentenceTransformer = None

try:
  import fitz  # PyMuPDF
except ImportError:
  print('❌ Missing dependency: PyMuPDF')
  print('Install with: pip install PyMuPDF requests sentence-transformers')
  sys.exit(1)


PROJECT_ROOT = Path(__file__).resolve().parent.parent
REFERENCES_DIR = PROJECT_ROOT / 'references'
OUTPUT_DIR = PROJECT_ROOT / 'src' / 'data' / 'vectors'
DEFAULT_SBERT_MODEL = 'all-MiniLM-L6-v2'
DEFAULT_OLLAMA_MODEL = 'nomic-embed-text'


def normalize_text(text: str) -> str:
  """Collapse whitespace and de-hyphenate common PDF breaks."""
  text = text.replace('\u00ad\n', '')
  text = re.sub(r'-\s*\n', '', text)
  text = re.sub(r'\s+', ' ', text)
  return text.strip()


def chunk_text(text: str, chunk_size: int, overlap: int, min_words: int) -> Iterable[str]:
  """Yield overlapping word chunks from text."""
  words = text.split()
  if not words:
    return

  start = 0
  while start < len(words):
    end = min(start + chunk_size, len(words))
    chunk_words = words[start:end]

    if len(chunk_words) >= min_words:
      yield ' '.join(chunk_words)

    if end == len(words):
      break

    start = end - overlap


def extract_chunks_from_pdf(pdf_path: Path, chunk_size: int, overlap: int, min_words: int, max_pages: int | None) -> List[Dict]:
  """Extract cleaned, chunked text from a single PDF."""
  doc = fitz.open(pdf_path)
  page_count = len(doc)
  if max_pages:
    page_count = min(page_count, max_pages)

  chunks = []

  for page_number in range(page_count):
    page = doc.load_page(page_number)
    raw_text = page.get_text() or ''
    normalized = normalize_text(raw_text)
    if not normalized:
      continue

    for idx, chunk in enumerate(chunk_text(normalized, chunk_size, overlap, min_words)):
      chunk_id = f'{pdf_path.stem}-p{page_number + 1}-c{idx + 1}'
      chunks.append({
        'id': chunk_id,
        'source': pdf_path.name,
        'chapter': pdf_path.stem,
        'section': f'Page {page_number + 1}',
        'page': page_number + 1,
        'chunk': idx + 1,
        'content': chunk,
        'tokens': len(chunk.split()),
        'embeddingId': chunk_id
      })

  doc.close()
  return chunks


def get_embedding_ollama(text: str, model: str) -> List[float]:
  """Call the Ollama embedding API for a single chunk of text."""
  payload = {
    'model': model,
    'prompt': text,
    'stream': False
  }

  response = requests.post('http://localhost:11434/api/embed', json=payload, timeout=60)
  response.raise_for_status()

  data = response.json()
  if 'embedding' in data:
    return data['embedding']
  if data.get('embeddings') and isinstance(data['embeddings'], list):
    return data['embeddings'][0]

  raise ValueError(f'Unexpected response from Ollama: {data}')


def vectorize_chunks(chunks: List[Dict], embed_fn, rate_limit: float) -> List[Dict]:
  """Embed all chunks and return embedding rows."""
  embeddings = []

  for i, chunk in enumerate(chunks):
    preview = chunk['content'][:60].replace('\n', ' ')
    print(f"  [{i + 1}/{len(chunks)}] {chunk['id']} … {preview}...")

    try:
      embedding = embed_fn(chunk['content'])
      embeddings.append({
        'id': chunk['id'],
        'embedding': embedding
      })
    except Exception as exc:
      print(f"    ⚠️  Skipped ({exc})")

    if rate_limit > 0:
      time.sleep(rate_limit)

  return embeddings


def write_json(path: Path, data) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(data, indent=2))
  print(f'  ✓ Wrote {path}')


def main():
  parser = argparse.ArgumentParser(description='Vectorize reference PDFs into JSON assets for RAG.')
  parser.add_argument('--backend', choices=['sbert', 'ollama'], default='sbert', help='Embedding backend (default: sentence-transformers)')
  parser.add_argument('--model', default=None, help='Embedding model name (default: all-MiniLM-L6-v2 for sbert, nomic-embed-text for Ollama)')
  parser.add_argument('--chunk-size', type=int, default=300, help='Words per chunk before overlap')
  parser.add_argument('--overlap', type=int, default=60, help='Word overlap between sequential chunks')
  parser.add_argument('--min-words', type=int, default=40, help='Minimum words required to keep a chunk')
  parser.add_argument('--max-pages', type=int, default=None, help='Optional page limit per PDF for quick runs')
  parser.add_argument('--rate-limit', type=float, default=0.0, help='Seconds to sleep between embedding requests (set >0 for Ollama)')
  args = parser.parse_args()

  model_name = args.model or (DEFAULT_SBERT_MODEL if args.backend == 'sbert' else DEFAULT_OLLAMA_MODEL)

  if not REFERENCES_DIR.exists():
    print(f'❌ References directory not found: {REFERENCES_DIR}')
    sys.exit(1)

  pdfs = sorted(REFERENCES_DIR.glob('*.pdf'))
  if not pdfs:
    print(f'❌ No PDFs found in {REFERENCES_DIR}')
    sys.exit(1)

  print('\n🚀 Building reference vector dataset')
  print(f'   Source: {REFERENCES_DIR}')
  print(f'   Output: {OUTPUT_DIR}')
  print(f'   Backend: {args.backend}')
  print(f'   Model:   {model_name}\n')

  if args.backend == 'sbert':
    if not SentenceTransformer:
      print('❌ sentence-transformers is not installed. Install with: pip install sentence-transformers')
      sys.exit(1)
    try:
      embed_model = SentenceTransformer(model_name)
    except Exception as exc:
      print(f'❌ Failed to load embedding model {model_name}: {exc}')
      sys.exit(1)
    embed_fn = lambda text: embed_model.encode(text, convert_to_numpy=False).tolist()
    rate_limit = 0.0
  else:
    embed_fn = lambda text: get_embedding_ollama(text, model_name)
    rate_limit = args.rate_limit

  all_chunks: List[Dict] = []
  for pdf_path in pdfs:
    print(f'📖 Extracting from {pdf_path.name}...')
    pdf_chunks = extract_chunks_from_pdf(pdf_path, args.chunk_size, args.overlap, args.min_words, args.max_pages)
    print(f'   → {len(pdf_chunks)} chunks\n')
    all_chunks.extend(pdf_chunks)

  if not all_chunks:
    print('❌ No chunks extracted. Check PDF text extraction.')
    sys.exit(1)

  print(f'🧠 Embedding {len(all_chunks)} chunks with {model_name}...\n')
  embeddings = vectorize_chunks(all_chunks, embed_fn, rate_limit)

  if not embeddings:
    print('❌ Embedding failed for all chunks.')
    sys.exit(1)

  embedding_dim = len(embeddings[0]['embedding'])
  summary = {
    'totalChunks': len(all_chunks),
    'totalVectorized': len(embeddings),
    'embeddingModel': model_name,
    'embeddingDimension': embedding_dim,
    'sourceFiles': sorted({chunk['source'] for chunk in all_chunks}),
    'chapters': sorted({chunk['chapter'] for chunk in all_chunks if chunk.get('chapter')}),
    'createdAt': datetime.now(timezone.utc).isoformat(),
    'status': 'complete'
  }

  print('💾 Writing vector assets...\n')
  write_json(OUTPUT_DIR / 'chunks-metadata.json', all_chunks)
  write_json(OUTPUT_DIR / 'embeddings.json', embeddings)
  write_json(OUTPUT_DIR / 'index-summary.json', summary)

  print('\n✅ Done')
  print(f"   Chunks:     {len(all_chunks)}")
  print(f"   Vectorized: {len(embeddings)}")
  print(f"   Dimensions: {embedding_dim}")
  print(f"   Sources:    {len(summary['sourceFiles'])}")


if __name__ == '__main__':
  main()
