#!/usr/bin/env python3
"""
Script to process AgilePracticeGuide.txt and join continuation lines to the line above them.
"""

import os
import re

def join_continuation_lines(input_file, output_file):
    """
    Process the input file and join lines that don't start with capital letters to the line above.
    """
    with open(input_file, 'r', encoding='utf-8') as infile:
        lines = infile.readlines()

    # Process the lines to join continuations
    processed_lines = []
    i = 0
    while i < len(lines):
        current_line = lines[i].rstrip('\n')
        
        # Check if next line exists and doesn't start with capital letter or common punctuation
        # that would indicate a new sentence/term
        if (i + 1 < len(lines) and 
            lines[i + 1].strip() and 
            not lines[i + 1].strip()[0].isupper() and
            not re.match(r'^[\[\(#]', lines[i + 1].strip()) and 
            not lines[i + 1].strip().startswith('u')):
            
            # Join the current line with the next line
            next_line = lines[i + 1].strip()
            joined_line = current_line + ' ' + next_line
            processed_lines.append(joined_line + '\n')
            i += 2  # Skip the next line since we've joined it
        else:
            processed_lines.append(current_line + '\n')
            i += 1

    # Write the processed content to the output file
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.writelines(processed_lines)

def main():
    input_file = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/AgilePracticeGuide.txt"
    temp_output_file = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/AgilePracticeGuide.txt.tmp"
    
    # Process the file to join continuation lines
    join_continuation_lines(input_file, temp_output_file)
    
    # Replace the original file with the processed one
    os.replace(temp_output_file, input_file)
    
    print(f"Processed {input_file} and joined continuation lines.")

if __name__ == "__main__":
    main()