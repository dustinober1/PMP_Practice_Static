#!/usr/bin/env python3
"""
Script to process AgilePracticeGuide.txt and remove lines that only contain numbers.
"""

import os

def remove_number_lines(input_file, output_file):
    """
    Process the input file and remove lines that only contain numbers.
    """
    with open(input_file, 'r', encoding='utf-8') as infile:
        lines = infile.readlines()

    # Filter out lines that only contain numbers
    filtered_lines = []
    for line in lines:
        # Strip whitespace and check if the line only contains numbers
        stripped_line = line.strip()
        if stripped_line.isdigit():
            # Skip lines that only contain numbers
            continue
        else:
            filtered_lines.append(line)

    # Write the filtered content to the output file
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.writelines(filtered_lines)

def main():
    input_file = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/AgilePracticeGuide.txt"
    temp_output_file = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/AgilePracticeGuide.txt.tmp"
    
    # Process the file to remove number-only lines
    remove_number_lines(input_file, temp_output_file)
    
    # Replace the original file with the processed one
    os.replace(temp_output_file, input_file)
    
    print(f"Processed {input_file} and removed lines that only contained numbers.")

if __name__ == "__main__":
    main()