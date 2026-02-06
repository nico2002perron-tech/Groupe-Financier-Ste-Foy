
import os

# Paths
index_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\index.html'

# 1. READ FILES
with open(index_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 2. IDENTIFY REMOVAL ZONE
# Start: The comment before the double ticker wrapper
start_marker = "<!-- Mag 7 Double Ticker Tape (Custom - Prices Updated) -->"
# End: The start of the chart controls, which comes right after the ticker wrapper closing div
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
    print(f"Removing content from line {start_idx+1} to {end_idx+1}")
    # We keep everything BEFORE start_idx and everything FROM end_idx onwards.
    # effectively cutting out the ticker.
    new_lines = lines[:start_idx] + lines[end_idx:]
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("HTML updated: Ticker removed.")
else:
    print(f"Could not find markers. Start: {start_idx}, End: {end_idx}")
