#!/usr/bin/env python3
import argparse
import subprocess
import sys
from pathlib import Path
import shutil


def find_soffice(explicit_path: str | None = None) -> str:
    """
    Try to find the LibreOffice 'soffice' binary.

    Precedence:
    1. Explicit path from CLI argument
    2. 'soffice' in PATH
    3. Common macOS app bundle path
    """
    # 1. Explicit path (trust the user)
    if explicit_path:
        return str(Path(explicit_path).expanduser())

    # 2. 'soffice' found in PATH
    soffice_in_path = shutil.which("soffice")
    if soffice_in_path:
        return soffice_in_path

    # 3. Common macOS path
    mac_path = Path("/Applications/LibreOffice.app/Contents/MacOS/soffice")
    if mac_path.is_file():
        return str(mac_path)

    raise FileNotFoundError(
        "Could not find 'soffice'.\n"
        "- If you used Homebrew, make sure LibreOffice is installed:\n"
        "    brew install --cask libreoffice\n"
        "- Or pass --soffice /full/path/to/soffice"
    )


def convert_single_pdf(
    input_pdf: Path,
    output_dir: Path,
    soffice_path: str,
) -> Path:
    """
    Convert a single PDF to DOCX using LibreOffice.

    Returns the path to the output DOCX.
    """
    input_pdf = input_pdf.resolve()
    if not input_pdf.is_file():
        raise FileNotFoundError(f"Input PDF not found: {input_pdf}")

    output_dir.mkdir(parents=True, exist_ok=True)

    # Use an explicit filter for DOCX (MS Word 2007 XML)
    cmd = [
        soffice_path,
        "--headless",
        "--convert-to",
        "docx:MS Word 2007 XML",
        "--outdir",
        str(output_dir),
        str(input_pdf),
    ]

    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    # Always show what LibreOffice said when debugging
    if result.stdout.strip():
        print(f"[soffice STDOUT] for {input_pdf.name}:\n{result.stdout}")
    if result.stderr.strip():
        print(f"[soffice STDERR] for {input_pdf.name}:\n{result.stderr}", file=sys.stderr)

    if result.returncode != 0:
        raise RuntimeError(
            f"Conversion failed for {input_pdf.name}\n"
            f"Command: {' '.join(cmd)}\n"
            f"Return code: {result.returncode}"
        )

    # Look for the expected DOCX
    output_docx = output_dir / f"{input_pdf.stem}.docx"
    if not output_docx.is_file():
        raise FileNotFoundError(
            f"Expected output DOCX not found after conversion: {output_docx}\n"
            "Check the soffice STDOUT/STDERR above for details. "
            "LibreOffice may have produced a different file type or encountered a hidden error."
        )

    return output_docx



def collect_pdfs(root: Path, recursive: bool) -> list[Path]:
    """
    Collect PDF files from a directory.
    """
    if recursive:
        return sorted(p for p in root.rglob("*.pdf") if p.is_file())
    else:
        return sorted(p for p in root.glob("*.pdf") if p.is_file())


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert PDF to Word (DOCX) using LibreOffice headless."
    )
    parser.add_argument(
        "source",
        help="Path to a PDF file or a directory containing PDFs.",
    )
    parser.add_argument(
        "--out",
        "-o",
        dest="out_dir",
        help="Output directory for DOCX files. "
             "Default: same directory as the source file, or the given folder.",
    )
    parser.add_argument(
        "--recursive",
        "-r",
        action="store_true",
        help="If source is a directory, also convert PDFs in subdirectories.",
    )
    parser.add_argument(
        "--soffice",
        help="Optional explicit path to the 'soffice' binary.",
    )

    args = parser.parse_args()

    try:
        soffice_path = find_soffice(args.soffice)
    except FileNotFoundError as e:
        print(e, file=sys.stderr)
        sys.exit(1)

    source_path = Path(args.source).expanduser().resolve()

    if not source_path.exists():
        print(f"Source path does not exist: {source_path}", file=sys.stderr)
        sys.exit(1)

    # Determine base output directory
    if args.out_dir:
        base_out_dir = Path(args.out_dir).expanduser().resolve()
        base_out_dir.mkdir(parents=True, exist_ok=True)
    else:
        # Default: same folder as source if file, or the folder itself if directory
        base_out_dir = source_path.parent if source_path.is_file() else source_path

    converted: list[tuple[Path, Path | None, str | None]] = []  # (pdf, docx_or_none, error_or_none)

    if source_path.is_file():
        if source_path.suffix.lower() != ".pdf":
            print(f"Source is a file but not a PDF: {source_path}", file=sys.stderr)
            sys.exit(1)

        try:
            out_docx = convert_single_pdf(source_path, base_out_dir, soffice_path)
            converted.append((source_path, out_docx, None))
        except Exception as e:
            converted.append((source_path, None, str(e)))

    else:
        # Directory mode
        pdfs = collect_pdfs(source_path, args.recursive)
        if not pdfs:
            print("No PDF files found.", file=sys.stderr)
            sys.exit(1)

        for pdf in pdfs:
            # Keep the relative structure when recursive
            if args.recursive:
                rel_parent = pdf.parent.relative_to(source_path)
                out_dir = base_out_dir / rel_parent
            else:
                out_dir = base_out_dir

            try:
                out_docx = convert_single_pdf(pdf, out_dir, soffice_path)
                converted.append((pdf, out_docx, None))
            except Exception as e:
                converted.append((pdf, None, str(e)))

    # Report results
    for pdf, docx, error in converted:
        if error is None:
            print(f"[OK] {pdf} -> {docx}")
        else:
            print(f"[FAIL] {pdf}\n       {error}", file=sys.stderr)


if __name__ == "__main__":
    main()
