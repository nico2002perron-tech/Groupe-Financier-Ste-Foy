
import os

# Paths
index_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\index.html'
snippet_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\snippet_manual_logos.html'
css_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\css\style.css'

# 1. READ FILES
with open(index_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(snippet_path, 'r', encoding='utf-8') as f:
    snippet = f.read()

# 2. IDENTIFY REPLACEMENT ZONE
# Confirmed structure in index.html:
# Line 473: <!-- TradingView Double Ticker -->
# ...
# Line 563: <div class="chart-controls">

start_marker = "<!-- TradingView Double Ticker -->"
end_marker = "<div class=\"chart-controls\">"

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if start_marker in line:
        start_idx = i
        break

for i, line in enumerate(lines):
    if end_marker in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    print(f"Restoring Manual Ticker from line {start_idx+1} to {end_idx+1}")
    # We replace from start_idx UP TO end_idx (exclusive of end_idx because we want to keep chart-controls)
    new_lines = lines[:start_idx] + [snippet + '\n'] + lines[end_idx:]
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("HTML restored to Manual Double Ticker.")
else:
    print(f"Could not find markers. Start: {start_idx}, End: {end_idx}")

# CSS is likely already there (Double Ticker styles were never deleted, just appended to).
# Since CSS cascades, we should be fine if .double-ticker-wrapper styles are present.
# I verified they are in lines 730-850.
# The appended 'single ticker' styles won't affect .double-ticker-wrapper.
print("CSS check skipped (styles assumed present).")
