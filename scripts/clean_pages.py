import re

def clean_txt_file(file_path):
    """
    Remove lines that contain page indicators like '=== PAGE 76 ===' 
    and lines that only have numbers.
    """
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    
    cleaned_lines = []
    
    for line in lines:
        # Remove the newline character for processing
        stripped_line = line.strip()
        
        # Skip lines that match the page format like '=== PAGE 76 ==='
        if re.match(r'^===\s*PAGE\s+\d+\s*===', stripped_line, re.IGNORECASE):
            continue
        
        # Skip lines that only contain numbers
        if re.match(r'^\d+$', stripped_line):
            continue
        
        # Keep all other lines
        cleaned_lines.append(line)
    
    # Write the cleaned content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.writelines(cleaned_lines)

if __name__ == "__main__":
    file_path = "/Users/dustinober/Projects/PMP_Practice_Static/data/txt/leading_ai_transformation.txt"
    clean_txt_file(file_path)
    print(f"File {file_path} has been cleaned successfully.")