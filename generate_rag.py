import ollama
import chromadb
from pypdf import PdfReader
import hashlib
import os
import re
import fitz

# =============================================================================
# Configuration
# =============================================================================
CHAT_MODEL = "deepseek-r1:8b"
EMBED_MODEL = "nomic-embed-text"
CHUNK_SIZE = 1000  
CHUNK_OVERLAP = 200
TOP_K = 10  
SHOW_THINKING = True

# Your PDF files - update these paths
PDF_FILES = [
    "references/New-PMP-Examination-Content-Outline-2026.pdf",
    "references/pmbokguide_eighthed_eng.pdf",
]

# =============================================================================
# Initialize ChromaDB (persists to disk)
# =============================================================================
chroma_client = chromadb.PersistentClient(path="./pmbok_vectordb")
collection = chroma_client.get_or_create_collection(
    name="pmbok_docs",
    metadata={"hnsw:space": "cosine"}
)


# =============================================================================
# Helper Functions
# =============================================================================
def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF file, handling encrypted PDFs."""
    try:
        doc = fitz.open(pdf_path)
        
        # Try to decrypt if encrypted (empty password often works)
        if doc.is_encrypted:
            if not doc.authenticate(""):
                raise ValueError(f"PDF '{pdf_path}' is password-protected and cannot be opened.")
        
        text = ""
        for i, page in enumerate(doc):
            page_text = page.get_text() or ""
            text += f"\n[Page {i + 1}]\n{page_text}"
        
        doc.close()
        return text
    
    except Exception as e:
        raise RuntimeError(f"Failed to extract text from '{pdf_path}': {e}")


def chunk_text(text: str, source: str) -> list[dict]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    chunk_id = 0

    while start < len(text):
        end = start + CHUNK_SIZE
        chunk_content = text[start:end]

        # Create unique ID based on content
        chunk_hash = hashlib.md5(
            f"{source}_{chunk_id}_{chunk_content[:100]}".encode()
        ).hexdigest()

        chunks.append({
            "id": chunk_hash,
            "text": chunk_content,
            "source": source,
            "chunk_index": chunk_id
        })

        start += CHUNK_SIZE - CHUNK_OVERLAP
        chunk_id += 1

    return chunks


def get_embedding(text: str) -> list[float]:
    """Get embedding vector from Ollama."""
    response = ollama.embed(model=EMBED_MODEL, input=text)
    return response["embeddings"][0]


def strip_thinking(response: str) -> str:
    """Remove <think>...</think> blocks from DeepSeek-R1 output."""
    return re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()


def parse_response(response: str) -> tuple[str, str]:
    """Parse DeepSeek-R1 response into (thinking, answer)."""
    think_match = re.search(r'<think>(.*?)</think>', response, flags=re.DOTALL)
    thinking = think_match.group(1).strip() if think_match else ""
    answer = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()
    return thinking, answer


# =============================================================================
# Indexing Functions
# =============================================================================
def index_pdf(pdf_path: str):
    """Extract, chunk, embed, and store a PDF."""
    source_name = os.path.basename(pdf_path)

    # Check if already indexed
    existing = collection.get(where={"source": source_name})
    if existing["ids"]:
        print(f"'{source_name}' already indexed ({len(existing['ids'])} chunks). Skipping.")
        return

    print(f"Extracting text from {source_name}...")
    text = extract_text_from_pdf(pdf_path)
    print(f"  Extracted {len(text):,} characters")

    print("Chunking...")
    chunks = chunk_text(text, source_name)
    print(f"  Created {len(chunks)} chunks")

    print("Embedding and indexing (this may take a while)...")
    batch_size = 20
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]

        embeddings = [get_embedding(c["text"]) for c in batch]

        collection.add(
            ids=[c["id"] for c in batch],
            embeddings=embeddings,
            documents=[c["text"] for c in batch],
            metadatas=[{
                "source": c["source"],
                "chunk_index": c["chunk_index"]
            } for c in batch]
        )

        print(f"  Indexed {min(i + batch_size, len(chunks))}/{len(chunks)} chunks")

    print(f"Done indexing {source_name}!\n")


def index_all_pdfs():
    """Index all configured PDF files."""
    for pdf in PDF_FILES:
        if os.path.exists(pdf):
            index_pdf(pdf)
        else:
            print(f"Warning: '{pdf}' not found, skipping")


# =============================================================================
# Retrieval and Query Functions
# =============================================================================
def retrieve(query: str, top_k: int = TOP_K) -> tuple[list[str], list[dict]]:
    """Retrieve most relevant chunks for a query."""
    query_embedding = get_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    return results["documents"][0], results["metadatas"][0]


def query_pmbok(question: str) -> str:
    """RAG query: retrieve context and generate answer."""
    chunks, metadatas = retrieve(question)

    # Build context with source attribution
    context_parts = []
    for chunk, meta in zip(chunks, metadatas):
        context_parts.append(f"[Source: {meta['source']}]\n{chunk}")

    context = "\n\n---\n\n".join(context_parts)

    prompt = f"""You are a PMP exam preparation assistant. Use the following excerpts from PMBOK to answer the question accurately.

CONTEXT FROM PMBOK:
{context}

QUESTION: {question}

Provide a clear, accurate answer based on the PMBOK content above. Include relevant PMBOK terminology and concepts. If the context doesn't fully answer the question, say what you can determine and what's missing."""

    response = ollama.chat(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    raw_answer = response["message"]["content"]

    if SHOW_THINKING:
        thinking, answer = parse_response(raw_answer)
        if thinking:
            print("\n" + "=" * 50)
            print("REASONING:")
            print("=" * 50)
            print(thinking)
            print("=" * 50 + "\n")
        return answer
    else:
        return strip_thinking(raw_answer)


# =============================================================================
# Utility Commands
# =============================================================================
def show_stats():
    """Display database statistics."""
    total = collection.count()
    print(f"\nDatabase Statistics:")
    print(f"  Total chunks: {total}")
    print(f"  Chat model: {CHAT_MODEL}")
    print(f"  Embed model: {EMBED_MODEL}")
    print(f"  Chunk size: {CHUNK_SIZE} chars")
    print(f"  Overlap: {CHUNK_OVERLAP} chars")
    print(f"  Top-K retrieval: {TOP_K}")


def reindex():
    """Delete all data and reindex PDFs."""
    print("Clearing existing index...")
    chroma_client.delete_collection("pmbok_docs")
    global collection
    collection = chroma_client.get_or_create_collection(
        name="pmbok_docs",
        metadata={"hnsw:space": "cosine"}
    )
    print("Reindexing all PDFs...\n")
    index_all_pdfs()


def toggle_thinking():
    """Toggle display of DeepSeek reasoning."""
    global SHOW_THINKING
    SHOW_THINKING = not SHOW_THINKING
    status = "ON" if SHOW_THINKING else "OFF"
    print(f"Thinking display is now {status}")


# =============================================================================
# Main Interactive Loop
# =============================================================================
def main():
    print("=" * 60)
    print("  PMBOK RAG System with DeepSeek-R1")
    print("=" * 60)

    # Index PDFs
    index_all_pdfs()

    print(f"\nTotal chunks in database: {collection.count()}")
    print(f"Model: {CHAT_MODEL}")
    print(f"Show reasoning: {'ON' if SHOW_THINKING else 'OFF'}")
    print("\nCommands:")
    print("  'quit' or 'q'  - Exit")
    print("  'stats'        - Show database stats")
    print("  'reindex'      - Clear and rebuild index")
    print("  'thinking'     - Toggle reasoning display")
    print("\nReady! Ask questions about PMBOK.\n")

    while True:
        try:
            user_input = input("Question: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        # Handle commands
        if user_input.lower() in ("quit", "exit", "q"):
            print("Goodbye!")
            break
        elif user_input.lower() == "stats":
            show_stats()
            continue
        elif user_input.lower() == "reindex":
            reindex()
            continue
        elif user_input.lower() == "thinking":
            toggle_thinking()
            continue

        # Process question
        print("\nSearching and generating answer...\n")
        try:
            answer = query_pmbok(user_input)
            print(f"{answer}\n")
        except Exception as e:
            print(f"Error: {e}\n")


if __name__ == "__main__":
    main()