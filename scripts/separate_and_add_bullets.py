#!/usr/bin/env python3
"""
Script to process AgilePracticeGuide.md and:
1. Separate combined definitions that were joined together
2. Add bullet points to all definitions
"""

import os
import re

def separate_and_add_bullets(input_file, output_file):
    """
    Process the input file to separate combined definitions and add bullet points.
    """
    with open(input_file, 'r', encoding='utf-8') as infile:
        lines = infile.readlines()

    processed_lines = []
    
    for line in lines:
        stripped_line = line.lstrip()  # Remove leading whitespace to check content
        
        # Skip empty lines or the header
        if not stripped_line.strip() or stripped_line.startswith('# '):
            processed_lines.append(line)
            continue
        
        # Look for multiple definitions in a single line
        # Pattern: find periods followed by capitalized terms (indicating new definitions)
        parts = re.split(r'(\. )([A-Z][^.]*?\.)', stripped_line)
        
        # If we found multiple definitions, split them into separate lines
        if len(parts) > 1:
            # Reconstruct the parts to separate the definitions properly
            separated_defs = []
            i = 0
            while i < len(parts):
                if i == 0:
                    # First part is the initial definition text
                    separated_defs.append(parts[i].strip())
                elif i % 3 == 1:  # This is the ". " part
                    # Skip this - it's handled with the next part
                    pass
                elif i % 3 == 2:  # This is the capitalized term part
                    # Combine the period, space, and capitalized term
                    if i + 1 < len(parts):
                        separated_defs.append(parts[i].strip() + parts[i+1].strip())
                        i += 1  # Skip the next part as it's already handled
                else:  # This is the definition text after the capitalized term
                    if parts[i].strip():
                        separated_defs[-1] += ' ' + parts[i].strip()
                i += 1
            
            # Add bullet points to each separated definition
            for def_text in separated_defs:
                if def_text.strip():
                    indentation = len(line) - len(line.lstrip())
                    processed_line = ' ' * indentation + '- ' + def_text + '\n'
                    processed_lines.append(processed_line)
        else:
            # Check if line already starts with a bullet point
            if stripped_line.startswith('- '):
                processed_lines.append(line)
            elif re.match(r'^[A-Z][^.]*\. ', stripped_line):
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
    separate_and_add_bullets(input_file, temp_output_file)
    
    # Replace the original file with the processed one
    os.replace(temp_output_file, input_file)
    
    print(f"Processed {input_file} to separate combined entries and add bullet points to definitions.")

if __name__ == "__main__":
    main()