#!/usr/bin/env python3
"""
Script to process AgilePracticeGuide.txt and join continuation lines in the glossary section only.
"""

import os
import re

def join_glossary_continuation_lines(input_file, output_file):
    """
    Process the input file and join lines that don't start with capital letters to the line above,
    but only in the glossary section.
    """
    with open(input_file, 'r', encoding='utf-8') as infile:
        lines = infile.readlines()

    # Find the glossary section - it starts with "# Definitions"
    in_glossary = False
    processed_lines = []
    
    for i, line in enumerate(lines):
        stripped_line = line.strip()
        
        # Check if this is the start of the glossary section
        if stripped_line == "# Definitions":
            in_glossary = True
            processed_lines.append(line)
            continue
        
        # If we're in the glossary section
        if in_glossary:
            # Check if the next line exists and is a continuation
            # A continuation line is one that doesn't start with a capital letter
            # and is not empty
            if stripped_line:
                # Check if this line starts with a capital letter or is a new glossary entry
                # A glossary entry typically starts with a capitalized term followed by a period
                is_new_entry = bool(re.match(r'^[A-Z][^.]*\.', stripped_line))
                
                if not is_new_entry and processed_lines:
                    # This is a continuation, join it to the previous line
                    # Remove the last line from processed_lines, join with current, and add back
                    last_line = processed_lines.pop()
                    last_line = last_line.rstrip()  # Remove newline
                    combined_line = last_line + ' ' + stripped_line
                    processed_lines.append(combined_line + '\n')
                else:
                    # This is a new entry or empty line, add as is
                    processed_lines.append(line)
            else:
                # Empty line, add as is
                processed_lines.append(line)
        else:
            # Not in glossary section, add line as is
            processed_lines.append(line)

    # Write the processed content to the output file
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.writelines(processed_lines)

def main():
    input_file = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/AgilePracticeGuide.txt"
    temp_output_file = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/AgilePracticeGuide.txt.tmp"
    
    # Process the file to join continuation lines in glossary
    join_glossary_continuation_lines(input_file, temp_output_file)
    
    # Replace the original file with the processed one
    os.replace(temp_output_file, input_file)
    
    print(f"Processed {input_file} and joined continuation lines in the glossary section.")

if __name__ == "__main__":
    main()