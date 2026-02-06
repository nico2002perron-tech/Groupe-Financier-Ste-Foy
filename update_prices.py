
import os

# Paths
index_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\index.html'
snippet_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\snippet_prices.html'

# 1. READ FILES
with open(index_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(snippet_path, 'r', encoding='utf-8') as f:
    snippet = f.read()

# 2. IDENTIFY REPLACEMENT ZONE
# We look for the previous manual ticker block.
# Usually starts with: "<!-- Mag 7 Double Ticker Tape (Custom) -->"
# Or fallback to class.

start_marker_1 = "<!-- Mag 7 Double Ticker Tape (Custom) -->"
end_marker = "<div class=\"chart-controls\">"

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if start_marker_1 in line:
        start_idx = i
        break

for i, line in enumerate(lines):
    if end_marker in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    print(f"Updating Prices from line {start_idx+1} to {end_idx+1}")
    new_lines = lines[:start_idx] + [snippet + '\n'] + lines[end_idx:]
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("HTML updated with new prices.")
else:
    print(f"Could not find markers. Start: {start_idx}, End: {end_idx}")
