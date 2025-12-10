import os
import re
import datetime
import shutil

# Configuration
# Folders to scan directly
TARGET_FOLDERS = ['projects', 'templates']

def get_next_id(destination_dir):
    """
    Scans the directory for files matching YYYY-MM-DD-ID-Title.md
    Returns the next available ID (integer).
    """
    max_id = 0
    # Pattern: 2024-01-01-123-title.md
    pattern = re.compile(r'^\d{4}-\d{2}-\d{2}-(\d+)-.*\.md$')
    
    if not os.path.exists(destination_dir):
        return 1

    for filename in os.listdir(destination_dir):
        match = pattern.match(filename)
        if match:
            current_id = int(match.group(1))
            if current_id > max_id:
                max_id = current_id
    
    return max_id + 1

def process_folder(folder_path):
    print(f"Scanning {folder_path}...")
    
    if not os.path.exists(folder_path):
        return

    # 1. Identify files that need renaming
    # We first collect all valid IDs to know where to start counting
    next_id = get_next_id(folder_path)
    
    # Pattern to check if file is ALREADY valid
    valid_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}-(\d+)-.*\.md$')
    
    for filename in os.listdir(folder_path):
        if not filename.endswith(".md"):
            continue
        
        # Skip if already valid
        if valid_pattern.match(filename):
            continue
            
        file_path = os.path.join(folder_path, filename)
        
        # 2. Rename Logic
        today = datetime.date.today().strftime('%Y-%m-%d')
        id_str = f"{next_id:03d}"
        
        # Clean title
        clean_title = filename.replace('.md', '').lower().replace(' ', '-')
        clean_title = re.sub(r'[^a-z0-9-]', '', clean_title)
        
        new_filename = f"{today}-{id_str}-{clean_title}.md"
        new_path = os.path.join(folder_path, new_filename)
        
        print(f"Renaming {filename} -> {new_filename}")
        shutil.move(file_path, new_path)
        
        # Increment ID for the next file in this batch
        next_id += 1

def main():
    for folder in TARGET_FOLDERS:
        process_folder(folder)

if __name__ == "__main__":
    main()
