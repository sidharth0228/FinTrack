import os
import re

workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
print(f"Scanning workspace directory: {workspace_dir}")

html_files = [
    'dashboard.html',
    'portfolio.html',
    'budget.html',
    'expenses.html',
    'goals.html',
    'loans.html',
    'score.html',
    'report.html',
    'recommendation.html',
    'profile.html',
    'category-details.html',
    'improvements.html'
]

sidebar_pattern = re.compile(r'<aside class="sidebar">.*?</aside>', re.DOTALL)
script_tag = '<script src="navigation.js" defer></script>'

for filename in html_files:
    filepath = os.path.join(workspace_dir, filename)
    if not os.path.exists(filepath):
        print(f"⚠️ File not found: {filename}")
        continue

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    original_length = len(content)
    
    # Remove the hardcoded sidebar block
    content_no_sidebar, count = re.subn(sidebar_pattern, '', content)
    
    # Ensure script tag for navigation.js is imported
    if 'src="navigation.js"' not in content_no_sidebar and "src='navigation.js'" not in content_no_sidebar:
        # Inject script in the <head> before closing </head>
        content_no_sidebar, inject_count = re.subn(r'</head>', f'    {script_tag}\n</head>', content_no_sidebar, flags=re.IGNORECASE)
    else:
        inject_count = 0

    if count > 0 or inject_count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content_no_sidebar)
        print(f"[SUCCESS] Cleaned {filename}: Removed {count} sidebars, injected {inject_count} script tag.")
    else:
        print(f"[NO CHANGES] {filename}")
