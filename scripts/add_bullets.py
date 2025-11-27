#!/usr/bin/env python3
"""
Script to process AgilePracticeGuide.md and add bullet points to definitions that are missing them.
"""

import os
import re

def add_missing_bullets(input_file, output_file):
    """
    Process the input file and add bullet points to lines that are missing them 
    but appear to be definitions (start with a capitalized word followed by a period).
    """
    with open(input_file, 'r', encoding='utf-8') as infile:
        lines = infile.readlines()

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
        
        # Check if this looks like a definition entry (starts with capitalized word followed by period)
        # This pattern matches lines that start with a capitalized term followed by a period and space
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
    
    # Process the file to add missing bullet points
    add_missing_bullets(input_file, temp_output_file)
    
    # Replace the original file with the processed one
    os.replace(temp_output_file, input_file)
    
    print(f"Processed {input_file} and added missing bullet points to definitions.")

if __name__ == "__main__":
    main()