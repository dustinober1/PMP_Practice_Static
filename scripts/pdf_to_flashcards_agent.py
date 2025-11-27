#!/usr/bin/env python3
"""
PDF to Flashcards Agent

This agent processes PDF files to extract terms and definitions, converting them into flashcards
for the PMP Practice Static application. It handles both traditional glossary formats (terms
followed by periods and definitions) and non-traditional formats (terms on separate lines
followed by definitions).

Features:
- Extracts text from PDFs using pdftotext
- Detects glossary/definitions sections automatically
- Handles both "Term. Definition" and "TERM on line\nDefinition on next lines" formats
- Creates flashcards in the project's required format
- Can process various PMI reference documents including Agile Practice Guide, AI Essentials, etc.
"""

import os
import sys
import json
import re
import subprocess
from pathlib import Path


def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using pdftotext utility."""
    output_path = pdf_path.with_suffix('.txt')
    
    try:
        # Use pdftotext to extract text with layout preservation
        result = subprocess.run([
            'pdftotext', '-layout', str(pdf_path), str(output_path)
        ], capture_output=True, text=True, check=True)
        
        if result.returncode != 0:
            raise Exception(f"pdftotext failed: {result.stderr}")
        
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"Error running pdftotext: {e}")
        # If pdftotext fails, try alternative approach
        return None


def detect_glossary_section(text_content, source_name=""):
    """Detect the glossary or terms section in the text content."""
    lines = text_content.split('\n')

    # For specific document types, apply targeted patterns
    if 'ai_essentials' in source_name.lower():
        # AI Essentials document has specific terms in the content, look for them
        # Rather than a traditional glossary, look for actual term-definition patterns
        # First, find the actual terms in the document
        term_start_indices = []

        for i, line in enumerate(lines):
            # Look for the specific pattern in AI Essentials: "TERM" on a line by itself followed by definition
            if re.match(r'^[A-Z][A-Za-z\s\-]+$', line.strip()) and len(line.strip().split()) <= 4:
                # Check if the next few lines look like a definition
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # If next line starts with the same term, it's likely a definition
                    term = line.strip()
                    if next_line.lower().startswith(term.lower()):
                        term_start_indices.append(i)

        if term_start_indices:
            # If we found term patterns, extract from the first occurrence to the end
            # or until we hit a section that's clearly not a term/definition
            start_idx = term_start_indices[0]

            # Find a reasonable end point
            end_idx = len(lines)
            for i in range(start_idx, len(lines)):
                line = lines[i].strip()
                if 'bibliography' in line.lower() or 'references' in line.lower() or 'index' in line.lower():
                    end_idx = i
                    break

            return '\n'.join(lines[start_idx:end_idx])

    # Try to find common glossary indicators for other documents
    start_patterns = [
        r'glossary', r'definitions', r'key terms', r'terms and definitions'
    ]

    end_patterns = [
        r'bibliography', r'references', r'index', r'appendix', r'about the author'
    ]

    start_line_idx = -1
    end_line_idx = len(lines)

    # Find start of glossary
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        for pattern in start_patterns:
            if re.search(pattern, line_lower):
                start_line_idx = i
                break
        if start_line_idx != -1:
            break

    # If no clear start found, try looking for common term-definition patterns
    if start_line_idx == -1:
        for i, line in enumerate(lines):
            # Look for capitalized terms followed by definition patterns
            if re.match(r'^[A-Z][A-Za-z\s\-\(\)&,®"]{2,100}\.\s+[A-Z]', line.strip()):
                start_line_idx = i
                break

    # Find end of glossary
    for i in range(start_line_idx + 1, len(lines)):
        line_lower = lines[i].lower().strip()
        for pattern in end_patterns:
            if re.search(pattern, line_lower):
                end_line_idx = i
                break

    if start_line_idx != -1:
        return '\n'.join(lines[start_line_idx:end_line_idx])
    else:
        # If no clear glossary section found, return the whole content
        return text_content


def extract_terms_from_text(text_path, source_name=""):
    """Extract terms and definitions from the text content."""
    with open(text_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Detect glossary section
    glossary_content = detect_glossary_section(content, source_name)

    lines = glossary_content.split('\n')
    clean_lines = []

    for line in lines:
        line = line.strip()
        # Skip empty lines and common artifacts
        if not line or line.isdigit() or re.match(r'^\d+\s+.*', line):
            continue
        # Skip license text if present
        if 'PMI Member benefit' in line or 'Not for distribution' in line:
            continue
        clean_lines.append(line)

    # First, try to find traditional glossary format (Term. Definition)
    entries = []
    i = 0

    # Look for traditional glossary format first
    while i < len(clean_lines):
        line = clean_lines[i]

        # Look for a line that starts with a potential term definition (Term. Definition format)
        term_pattern = r'^([A-Z][A-Za-z\'\-\s\(\)&,/®"]{2,100}?)\.\s*(.*)'
        match = re.match(term_pattern, line)

        if match:
            term = match.group(1).strip()
            definition = match.group(2).strip() if match.group(2).strip() else ""

            # Look ahead for continuation of the definition
            j = i + 1
            while j < len(clean_lines):
                next_line = clean_lines[j]

                # Check if the next line starts a new term definition
                next_match = re.match(r'^([A-Z][A-Za-z\'\-\s\(\)&,/®"]{2,100}?)\.\s*(.*)', next_line)
                if next_match:
                    break  # This is the start of the next term

                # Skip cross-references
                if next_line.startswith("Also known as") or next_line.startswith("See also") or next_line.startswith("Equivalent to"):
                    j += 1
                    continue

                # Otherwise, this is part of the current definition
                if next_line.strip():
                    if definition:
                        definition += " " + next_line.strip()
                    else:
                        definition = next_line.strip()

                j += 1

            # Clean up the definition
            if definition:
                definition = re.sub(r'\s+\d{3}\s*$', '', definition).strip()  # Remove trailing page numbers

            # Add entry if it's a valid definition
            if definition and not definition.startswith("See ") and not definition.startswith("Also known as"):
                entries.append((term, definition))

            i = j
        else:
            i += 1

    # If we found traditional glossary entries, return them
    if entries:
        return entries

    # Specific handling for AI Essentials document
    if 'ai_essentials' in source_name.lower():
        ai_entries = []
        i = 0
        while i < len(lines):
            line = lines[i]

            # Look for the AI Essentials pattern: "TERM" on a line by itself followed by definition
            # The term should be title case with capitalized first letters
            if re.match(r'^[A-Z][A-Za-z\s\-()]{5,50}$', line.strip()):
                term = line.strip()

                # Check if the next line starts with the same term (confirming it's a definition)
                if i + 1 < len(lines):
                    next_line = lines[i+1].strip()
                    if next_line.lower().startswith(term.lower()):
                        # Found a valid term-definition pair
                        definition_lines = [next_line]
                        j = i + 2

                        # Collect the rest of the definition
                        while j < len(lines):
                            next_line = lines[j].strip()

                            # Stop if we hit another potential term or section header
                            if re.match(r'^[A-Z][A-Za-z\s\-()]{5,50}$', next_line) or \
                               next_line in ['', ' ', '©', 'PMI', 'AI Essentials for Project Professionals'] or \
                               next_line.isdigit() or \
                               any(skip_word in next_line.lower() for skip_word in
                                   ['chapter', 'introduction', 'section', 'part', 'table', 'figure', 'appendix', 'index', 'bibliography']):
                                break

                            if next_line:
                                definition_lines.append(next_line)
                            j += 1

                        definition = ' '.join(definition_lines)

                        # Skip the term at the beginning of the definition (it's already the term)
                        if definition.lower().startswith(term.lower()):
                            definition = definition[len(term):].strip()
                            if definition.startswith('is') or definition.startswith('are') or definition.startswith(':'):
                                definition = definition[definition.find(' ') + 1:].strip()

                        if len(definition) > 10:  # Ensure definition has substance
                            ai_entries.append((term, definition))

                        i = j
                    else:
                        i += 1
                else:
                    i += 1
            else:
                i += 1

        if ai_entries:
            return ai_entries

    # For other documents without clear glossary sections, apply more selective criteria
    potential_terms = []

    # Look for potential term-definition pairs in the content
    # Pattern: Lines that look like terms followed by explanations
    i = 0
    while i < len(clean_lines):
        line = clean_lines[i]

        # Look for lines that are all caps or title case that might be terms
        # But be more selective - check if the term has characteristics of an actual term
        if re.match(r'^[A-Z][A-Z\s\-\(\)]{5,50}$', line.strip()) or \
           re.match(r'^[A-Z][A-Za-z\s\-\(\)]{5,50}$', line.strip()):

            # More selective: check if the term looks like an actual technical term
            term_candidate = line.strip()

            # Skip if it looks like a section header or other non-term
            if any(skip_word in term_candidate.lower() for skip_word in
                   ['chapter', 'introduction', 'section', 'part', 'table', 'figure', 'appendix', 'index', 'bibliography']):
                i += 1
                continue

            # Look for following lines that could be the definition
            j = i + 1
            definition_lines = []

            # Collect lines that form the definition
            while j < len(clean_lines):
                next_line = clean_lines[j].strip()

                # Stop if we hit an empty line or another potential term
                if not next_line or re.match(r'^[A-Z][A-Z\s\-\(\)]{5,50}$', next_line) or re.match(r'^[A-Z][A-Za-z\s\-\(\)]{5,50}$', next_line):
                    break

                # Stop if we hit a page number or other artifact
                if next_line.isdigit() or next_line.startswith('©') or next_line.startswith('AI Essentials') or next_line.startswith('PMI'):
                    break

                # Add this line to definition
                if next_line:
                    definition_lines.append(next_line)

                j += 1

            # Join the definition lines
            if definition_lines:
                definition = ' '.join(definition_lines)
                # Be more selective about what constitutes a good definition
                if len(definition) > 20 and len(definition.split()) > 5:  # Ensure definition is substantial
                    # Filter out definitions that start with common non-definition text
                    if not any(definition.lower().startswith(prefix) for prefix in
                              ['in this', 'as we', 'the purpose', 'to help', 'when', 'where', 'this section', 'the goal']):
                        potential_terms.append((term_candidate, definition))

            # Move i to j to continue from where we left off
            i = j
        else:
            i += 1

    # Look for patterns like "Term is/means definition" or "Term: definition"
    for i, line in enumerate(clean_lines):
        # Skip if it looks like a header or other non-content
        if any(skip_word in line.lower() for skip_word in
               ['chapter', 'introduction', 'section', 'table of contents', 'appendix', 'index', 'bibliography']):
            continue

        if re.match(r'^[A-Z][A-Za-z\s\-\'\"]{3,50}\s*(is|are|was|means|refers to)\s+', line, re.IGNORECASE):
            parts = re.split(r'\s+(is|are|was|means|refers to)\s+', line, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) >= 3:
                term = parts[0].strip()
                definition = parts[2].strip()
                if len(definition) > 10 and len(definition.split()) > 3:  # Ensure definition is substantial
                    potential_terms.append((term, definition))

        # Look for "Term:" pattern
        elif re.match(r'^[A-Z][A-Za-z\s\-\'\"]{3,50}:', line):
            parts = line.split(':', 1)
            if len(parts) == 2:
                term = parts[0].strip()
                definition = parts[1].strip()
                if len(definition) > 10 and len(definition.split()) > 3:  # Ensure definition is substantial
                    potential_terms.append((term, definition))

    # If we found potential terms from these patterns, return them
    if potential_terms:
        return potential_terms

    # If no good terms found, return empty list
    return []


def create_flashcards_in_project_format(terms_list, source_name="PDF"):
    """Create flashcards in the project's expected format."""
    flashcards = []
    for i, (term, definition) in enumerate(terms_list, 1):
        # Clean up the definition
        clean_def = definition.strip()
        if clean_def.endswith('.'):
            clean_def = clean_def[:-1].strip()
        
        # Remove cross-references at the end
        if ' See also ' in clean_def:
            clean_def = clean_def.split(' See also ')[0].strip()
        if ' Also known as ' in clean_def:
            clean_def = clean_def.split(' Also known as ')[0].strip()
        if ' Equivalent to ' in clean_def:
            clean_def = clean_def.split(' Equivalent to ')[0].strip()
        
        if clean_def.endswith('.'):
            clean_def = clean_def[:-1].strip()
        
        flashcard = {
            'id': f'{source_name.lower()}-{i:03d}',
            'type': 'definition',
            'category': f'{source_name.upper()}_TERM',
            'front': f'What is {term}?',
            'back': f'{clean_def}.',
            'original_term': term,
            'original_definition': definition.strip()
        }
        flashcards.append(flashcard)
    
    return flashcards


def process_pdf_to_flashcards(pdf_path, output_path=None):
    """Main function to process a PDF file into flashcards."""
    print(f"Processing PDF: {pdf_path}")

    # Extract text from PDF
    text_path = extract_text_from_pdf(pdf_path)
    if not text_path or not text_path.exists():
        print("Could not extract text from PDF. Attempting alternative method...")
        # If pdftotext fails, we could try other methods here
        return []

    print(f"Text extracted to: {text_path}")

    # Create source name for detection purposes
    source_name = pdf_path.stem.replace(' ', '_').replace('-', '_')

    # Extract terms and definitions
    terms = extract_terms_from_text(text_path, source_name)
    print(f"Extracted {len(terms)} terms from the PDF")

    # Create flashcards in project format
    flashcards = create_flashcards_in_project_format(terms, source_name)

    print(f"Created {len(flashcards)} flashcards in project format")

    # Clean up temporary text file
    if text_path and text_path.exists():
        text_path.unlink()
        print(f"Cleaned up temporary text file: {text_path}")

    return flashcards


def load_existing_flashcards(flashcards_path):
    """Load existing flashcards from the project."""
    if flashcards_path.exists():
        with open(flashcards_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def save_flashcards(flashcards, flashcards_path):
    """Save flashcards to the project file."""
    with open(flashcards_path, 'w', encoding='utf-8') as f:
        json.dump(flashcards, f, indent=2)


def main(pdf_path_str, project_root=None):
    """
    Main entry point for the PDF to flashcards agent.

    Args:
        pdf_path_str (str): Path to the PDF file to process
        project_root (str, optional): Path to the project root directory.
                                    If None, will be inferred from PDF location.

    Returns:
        int: Exit code (0 for success, 1 for error)
    """
    pdf_path = Path(pdf_path_str)

    if not pdf_path.exists():
        print(f"Error: PDF file does not exist: {pdf_path}")
        return 1

    # Determine project root
    if project_root is None:
        project_root = pdf_path.parent.parent  # Go up two levels from references

    # Define the flashcards file path
    flashcards_path = project_root / 'src' / 'data' / 'flashcards.json'

    print(f"Project root: {project_root}")
    print(f"Flashcards will be saved to: {flashcards_path}")

    # Process the PDF to generate flashcards
    new_flashcards = process_pdf_to_flashcards(pdf_path)

    if not new_flashcards:
        print("No flashcards were generated from the PDF.")
        return 1

    # Load existing flashcards
    existing_flashcards = load_existing_flashcards(flashcards_path)
    print(f"Loaded {len(existing_flashcards)} existing flashcards")

    # Combine existing and new flashcards
    all_flashcards = existing_flashcards + new_flashcards
    print(f"Total flashcards after combining: {len(all_flashcards)}")

    # Save all flashcards to the project file
    save_flashcards(all_flashcards, flashcards_path)
    print(f"Successfully saved {len(all_flashcards)} flashcards to {flashcards_path}")

    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_flashcards_agent.py <pdf_path> [project_root]")
        print("Example: python pdf_to_flashcards_agent.py '/path/to/references/my_pdf.pdf'")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    project_root = sys.argv[2] if len(sys.argv) > 2 else None
    
    exit_code = main(pdf_path, project_root)
    sys.exit(exit_code)