#!/usr/bin/env python3
import fitz  # PyMuPDF
from pathlib import Path
import sys
import argparse


def pdf_to_text(pdf_path: Path) -> str:
    """
    Extract text from a PDF file using PyMuPDF, with page markers.
    """
    doc = fitz.open(pdf_path)
    parts = []
    for page_num, page in enumerate(doc, start=1):
        # "text" preserves reading order reasonably well
        text = page.get_text("text")
        text = text.replace("\r", "\n")
        parts.append(f"=== PAGE {page_num} ===\n{text.strip()}\n")
    doc.close()
    return "\n\n".join(parts)


def convert_one(pdf_path: Path, out_dir: Path) -> Path:
    """
    Convert a single PDF to a .txt file in out_dir.
    """
    pdf_path = pdf_path.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    out_path = (out_dir / pdf_path.name).with_suffix(".txt")

    print(f"Extracting: {pdf_path.name} -> {out_path.name}")
    text = pdf_to_text(pdf_path)
    out_path.write_text(text, encoding="utf-8")

    return out_path


def main():
    parser = argparse.ArgumentParser(
        description="Convert AgilePracticeGuide.pdf to plain text for RAG/graph pipelines."
    )
    parser.add_argument(
        "--out",
        "-o",
        dest="out_dir",
        default="data/txt",
        help="Output directory for .txt files (default: data/txt).",
    )

    args = parser.parse_args()

    pdf_path = Path("data/txt/AgilePracticeGuide.pdf").expanduser().resolve()
    out_dir = Path(args.out_dir).expanduser().resolve()

    if not pdf_path.exists() or not pdf_path.is_file():
        print(f"PDF file does not exist: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    try:
        txt_path = convert_one(pdf_path, out_dir)
        print(f"[OK]  {pdf_path.name} -> {txt_path}")
    except Exception as e:
        print(f"[FAIL] {pdf_path.name}: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()