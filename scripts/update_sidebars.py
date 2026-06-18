import os
import re

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))
print(f"Scanning directory: {frontend_dir}")

replacements = [
    # Replace standard icons and labels
    (r'<span class="material-symbols-outlined">dashboard</span>\s*Dashboard',
     '<span class="material-symbols-outlined">newspaper</span> FinTrack Daily'),
    
    (r'<span class="material-symbols-outlined text-lg">dashboard</span>\s*Dashboard',
     '<span class="material-symbols-outlined text-lg">newspaper</span> FinTrack Daily'),

    (r'<span class="material-symbols-outlined"\s+data-icon="dashboard">dashboard</span>\s*Dashboard',
     '<span class="material-symbols-outlined" data-icon="newspaper">newspaper</span> FinTrack Daily'),

    # Replace raw templates
    (r'data-icon="dashboard">dashboard</span>Dashboard',
     'data-icon="newspaper">newspaper</span>FinTrack Daily'),

    (r'data-icon="dashboard">dashboard</span>',
     'data-icon="newspaper">newspaper</span>'),
     
    (r'mr-3 text-\[22px\]" data-icon="dashboard">dashboard</span>',
     'mr-3 text-[22px]" data-icon="newspaper">newspaper</span>'),

    # Simple text replacements for dashboard text in sidebar context
    (r'href="dashboard.html"([^>]*?)>\s*Dashboard\s*</a>',
     r'href="dashboard.html"\1>FinTrack Daily</a>')
]

for filename in os.listdir(frontend_dir):
    if filename.endswith('.html'):
        filepath = os.path.join(frontend_dir, filename)
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        updated_content = content
        changes_made = 0
        for pattern, replacement in replacements:
            new_content, count = re.subn(pattern, replacement, updated_content)
            if count > 0:
                updated_content = new_content
                changes_made += count

        if changes_made > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"[UPDATED] {filename} ({changes_made} replacements)")
        else:
            print(f"[NO CHANGE] {filename}")
