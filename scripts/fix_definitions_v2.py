#!/usr/bin/env python3
"""
Script to process AgilePracticeGuide.md and:
1. Split combined definitions that were joined together
2. Ensure each definition has a bullet point
"""

import os
import re

def process_definitions(input_file, output_file):
    """
    Process the input file to separate combined definitions and ensure proper bullet points.
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
        
        # Look for combined entries in the line (two definitions combined on one line)
        # Pattern: ". [A-Z][^.]*\\." - period followed by space, capitalized word, period
        combined_matches = list(re.finditer(r'\. ([A-Z][^.]*?\.)', stripped_line))
        
        if combined_matches:
            # Split the line with proper line breaks
            parts = []
            start = 0
            
            for match in combined_matches:
                # Add the text before the match
                part = stripped_line[start:match.start()]
                if part.strip():
                    # Add bullet if not present
                    if not part.startswith('- '):
                        part = '- ' + part.lstrip()
                    parts.append(part.strip())
                
                # Update start to the beginning of the matched definition
                start = match.start(1)  # Start of group 1 (the capitalized definition start)
            
            # Add the remainder of the line
            if start < len(stripped_line):
                remainder = stripped_line[start:].strip()
                if remainder:
                    if not remainder.startswith('- '):
                        remainder = '- ' + remainder
                    parts.append(remainder)
            
            # Add all the split parts to the processed lines
            for part in parts:
                # Maintain original indentation for the first line, spaces for continuation
                if part == parts[0]:
                    indentation = len(line) - len(line.lstrip())
                    processed_lines.append(' ' * indentation + part + '\n')
                else:
                    # Add appropriate indentation for continuation items
                    processed_lines.append(part + '\n')
        else:
            # Check if line already starts with a bullet point
            if stripped_line.startswith('- '):
                processed_lines.append(line)
            elif re.match(r'^[A-Z][^.]*\. ', stripped_line):
                # This is a definition without bullet point, add it
                indentation = len(line) - len(line.lstrip())
                processed_line = ' ' * indentation + '- ' + stripped_line
                processed_lines.append(processed_line)
            else:
                # Regular line, add as is
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