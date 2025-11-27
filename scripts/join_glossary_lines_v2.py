#!/usr/bin/env python3
"""
Script to process AgilePracticeGuide.txt and join continuation lines in the glossary section only.
This version will look specifically for glossary entries that have been split across lines.
"""

import os
import re

def join_glossary_continuation_lines(input_file, output_file):
    """
    Process the input file and join lines that are continuations of glossary definitions.
    """
    with open(input_file, 'r', encoding='utf-8') as infile:
        lines = infile.readlines()

    # Find the glossary section - it starts with "# Definitions"
    in_glossary = False
    processed_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped_line = line.strip()
        
        # Check if this is the start of the glossary section
        if stripped_line == "# Definitions":
            in_glossary = True
            processed_lines.append(line)
            i += 1
            continue
        
        # If we're in the glossary section
        if in_glossary:
            # Check if this is a new glossary entry by matching the pattern: "Word(s). definition..."
            # This looks for capitalized word(s) followed by a period and then more text
            is_new_entry = bool(re.match(r'^[A-Z][^.]*\. ', stripped_line))
            
            if is_new_entry and i + 1 < len(lines):
                # This is a glossary entry, check if the definition continues on the next line
                # Look ahead to see if the next line continues the definition
                current_line = stripped_line
                j = i + 1
                
                # Keep joining lines while the next one doesn't start a new entry
                while j < len(lines):
                    next_line = lines[j].strip()
                    
                    # Check if next line is empty or starts a new entry
                    if not next_line:
                        j += 1
                        continue  # Skip empty lines
                    elif re.match(r'^[A-Z][^.]*\. ', next_line):
                        # This is a new entry, stop joining
                        break
                    else:
                        # This is a continuation, join it
                        current_line += ' ' + next_line
                        j += 1
                
                # Add the joined line to processed lines
                processed_lines.append(current_line + '\n')
                i = j  # Move index to the next new entry or end of file
            else:
                # Not in glossary or not a new entry, add as is
                processed_lines.append(line)
                i += 1
        else:
            # Not in glossary section, add line as is
            processed_lines.append(line)
            i += 1

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