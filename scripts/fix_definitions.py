#!/usr/bin/env python3
"""
Script to process AgilePracticeGuide.md and:
1. Separate combined definitions that were joined together
2. Add bullet points to definitions
"""

import os
import re

def process_definitions(input_file, output_file):
    """
    Process the input file to separate combined definitions and add bullet points.
    """
    with open(input_file, 'r', encoding='utf-8') as infile:
        content = infile.read()

    # First, let's separate combined entries by finding patterns like "first definition. SecondTerm."
    # This looks for a period followed by a space and then a capitalized term starting with a capital letter
    # This separates combined definitions that were joined together
    separated_content = re.sub(r'(\. )([A-Z][^.]*?\.)', r'.\n\2', content)

    # Split the content into lines
    lines = separated_content.split('\n')
    
    processed_lines = []
    
    for line in lines:
        stripped_line = line.lstrip()  # Remove leading whitespace to check content
        
        # Skip empty lines
        if not stripped_line.strip():
            processed_lines.append(line)
            continue
        
        # Check if line already starts with a bullet point
        if stripped_line.startswith('- '):
            processed_lines.append(line)
            continue
        
        # Check if this looks like a definition entry (starts with a capitalized word followed by period)
        if re.match(r'^[A-Z][^.]*\. ', stripped_line):
            # Add the bullet point to the beginning of the line (preserving original indentation)
            indentation = len(line) - len(line.lstrip())
            processed_line = ' ' * indentation + '- ' + stripped_line
            processed_lines.append(processed_line)
        else:
            # Line doesn't need modification
            processed_lines.append(line)

    # Write the processed content to the output file
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.writelines(processed_lines)

def main():
    input_file = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/AgilePracticeGuide.md"
    temp_output_file = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/AgilePracticeGuide.md.tmp"
    
    # Process the file to separate combined entries and add bullet points
    process_definitions(input_file, temp_output_file)
    
    # Replace the original file with the processed one
    os.replace(temp_output_file, input_file)
    
    print(f"Processed {input_file} to separate combined entries and add bullet points to definitions.")

if __name__ == "__main__":
    main()