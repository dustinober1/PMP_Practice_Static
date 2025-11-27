#!/usr/bin/env python3
"""
Script to properly separate combined definitions that were joined together.
"""

import os
import re

def fix_definitions(input_file, output_file):
    """
    Process the input file to properly separate combined definitions.
    """
    with open(input_file, 'r', encoding='utf-8') as infile:
        content = infile.read()

    # Find patterns where two definitions were combined 
    # The correct pattern: Find ". [CapitalLetter" and split before the capitalized term
    # We need to match the period at the end of the first definition and the beginning of the second
    separated_content = re.sub(r'(\. )([A-Z][^.]*?\.)', r'.\n- \2', content)

    # Write the processed content to the output file
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write(separated_content)

def main():
    input_file = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/AgilePracticeGuide.md"
    temp_output_file = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/AgilePracticeGuide.md.tmp"
    
    # Process the file to separate combined entries
    fix_definitions(input_file, temp_output_file)
    
    # Replace the original file with the processed one
    os.replace(temp_output_file, input_file)
    
    print(f"Processed {input_file} to separate combined entries.")

if __name__ == "__main__":
    main()