#!/usr/bin/env python3
"""
Vector database creation script using Python sentence-transformers
More reliable than Ollama for local embedding generation
"""

import json
import os
import sys
from pathlib import Path

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("❌ sentence-transformers not installed")
    print("Install with: pip install sentence-transformers")
    sys.exit(1)

# Setup paths
script_dir = Path(__file__).parent.absolute()
project_root = script_dir.parent
data_dir = project_root / 'src' / 'data'
reference_dir = project_root / 'data' / 'reference'
vector_db_dir = data_dir / 'vectors'

# Create vector database directory
vector_db_dir.mkdir(parents=True, exist_ok=True)
print(f"📂 Vector database directory: {vector_db_dir}\n")


def parse_markdown_chunks(content, filename):
    """Parse markdown content and extract chapters/sections"""
    import re
    chunks = []
    lines = content.split('\n')
    current_chapter = None
    current_section = None
    current_content = []
    content_start_line = 0

    for i, line in enumerate(lines):
        if line.startswith('# '):
            if current_content:
                chunks.append({
                    'source': filename,
                    'chapter': current_chapter,
                    'section': current_section,
                    'content': '\n'.join(current_content).strip(),
                    'startLine': content_start_line,
                    'endLine': i,
                    'type': 'markdown'
                })

            current_chapter = re.sub(r'^#+\s+', '', line).strip()
            current_section = None
            current_content = []
            content_start_line = i + 1
        elif line.startswith('## '):
            if current_content:
                chunks.append({
                    'source': filename,
                    'chapter': current_chapter,
                    'section': current_section,
                    'content': '\n'.join(current_content).strip(),
                    'startLine': content_start_line,
                    'endLine': i,
                    'type': 'markdown'
                })

            current_section = re.sub(r'^#+\s+', '', line).strip()
            current_content = []
            content_start_line = i + 1
        elif line.strip():
            current_content.append(line)

    if current_content:
        chunks.append({
            'source': filename,
            'chapter': current_chapter,
            'section': current_section,
            'content': '\n'.join(current_content).strip(),
            'startLine': content_start_line,
            'endLine': len(lines),
            'type': 'markdown'
        })

    return chunks


def parse_json_chunks(content, filename):
    """Parse JSON flashcard files into chunks"""
    try:
        data = json.loads(content)
        chunks = []

        if isinstance(data, list):
            grouped = {}
            for item in data:
                category = item.get('category') or item.get('type') or 'general'
                if category not in grouped:
                    grouped[category] = []
                grouped[category].append(item)

            for category, items in grouped.items():
                chunk_size = 10
                for i in range(0, len(items), chunk_size):
                    chunk = items[i:i+chunk_size]
                    chunks.append({
                        'source': filename,
                        'chapter': category,
                        'section': None,
                        'content': '\n'.join([f"{item.get('front', '')} - {item.get('back', '')}" for item in chunk]),
                        'metadata': {
                            'type': 'flashcard',
                            'itemCount': len(chunk),
                            'originalIds': [item.get('id') for item in chunk]
                        },
                        'type': 'json'
                    })

        return chunks
    except Exception as e:
        print(f"❌ Error parsing {filename}: {e}")
        return []


def process_file(filepath):
    """Process a single file and extract chunks"""
    content = filepath.read_text(encoding='utf-8')
    filename = filepath.name
    chunks = []

    if filepath.suffix == '.md':
        chunks = parse_markdown_chunks(content, filename)
    elif filepath.suffix == '.json':
        chunks = parse_json_chunks(content, filename)

    return chunks


def process_directory(dir_path):
    """Recursively process all files in a directory"""
    all_chunks = []

    for item in dir_path.rglob('*'):
        if item.is_file() and item.suffix in ['.md', '.json']:
            all_chunks.extend(process_file(item))

    return all_chunks


def main():
    print("\n🚀 Vector Database Creation (Python + sentence-transformers)\n")

    # Step 1: Extract chunks
    print("📋 Step 1: Extracting chunks from reference files...")
    all_chunks = process_directory(reference_dir)
    print(f"✓ Extracted {len(all_chunks)} chunks\n")

    if not all_chunks:
        print("❌ No chunks found to vectorize")
        return

    # Step 2: Load embedding model
    print("🔄 Step 2: Loading embedding model...")
    print("  This may take a minute on first run...")
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print(f"✓ Model loaded: all-MiniLM-L6-v2\n")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return

    # Step 3: Vectorize chunks
    print(f"🔄 Step 3: Vectorizing {len(all_chunks)} chunks...")
    embeddings = []
    metadata = []

    for i, chunk in enumerate(all_chunks):
        try:
            # Truncate content for embedding
            text_to_embed = chunk['content'][:512]
            embedding = model.encode(text_to_embed, convert_to_tensor=False)

            embeddings.append({
                'id': f'chunk_{i}',
                'embedding': embedding.tolist()
            })

            metadata.append({
                'id': f'chunk_{i}',
                **chunk,
                'embeddingId': f'chunk_{i}'
            })

            if (i + 1) % 10 == 0:
                print(f"  [{i+1}/{len(all_chunks)}] ✓ {chunk['source']} → {chunk.get('chapter', 'unknown')}")
        except Exception as e:
            print(f"  [{i+1}/{len(all_chunks)}] ❌ {chunk['source']}: {e}")

    print()

    # Step 4: Save vector database
    print("💾 Step 4: Saving vector database...")

    # Save metadata
    metadata_path = vector_db_dir / 'chunks-metadata.json'
    metadata_path.write_text(json.dumps(metadata, indent=2))
    print(f"✓ Metadata: {metadata_path}")

    # Save embeddings
    embeddings_path = vector_db_dir / 'embeddings.json'
    embeddings_path.write_text(json.dumps(embeddings, indent=2))
    print(f"✓ Embeddings: {embeddings_path}")

    # Save index summary
    summary_path = vector_db_dir / 'index-summary.json'
    summary = {
        'totalChunks': len(all_chunks),
        'totalVectorized': len(embeddings),
        'embeddingModel': 'all-MiniLM-L6-v2',
        'embeddingDimension': len(embeddings[0]['embedding']) if embeddings else 384,
        'sourceFiles': list(set(chunk['source'] for chunk in all_chunks)),
        'chapters': list(set(chunk.get('chapter') for chunk in all_chunks if chunk.get('chapter'))),
        'createdAt': __import__('datetime').datetime.now().isoformat(),
        'status': 'complete'
    }
    summary_path.write_text(json.dumps(summary, indent=2))
    print(f"✓ Summary: {summary_path}\n")

    # Step 5: Summary
    print("📊 Vector Database Summary:")
    print(f"  Total chunks: {len(all_chunks)}")
    print(f"  Vectorized: {len(embeddings)}")
    print(f"  Model: {summary['embeddingModel']}")
    print(f"  Dimensions: {summary['embeddingDimension']}")
    print(f"  Source files: {len(summary['sourceFiles'])}")
    print(f"  Chapters: {', '.join(summary['chapters'][:3])}...")
    print("\n✅ Vector database ready for RAG pipeline!\n")


if __name__ == '__main__':
    main()
