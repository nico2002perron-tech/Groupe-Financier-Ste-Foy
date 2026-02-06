
import os

index_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\index.html'
snippet_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\snippet.html'

with open(index_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(snippet_path, 'r', encoding='utf-8') as f:
    snippet = f.read()

# Lines are 0-indexed in list, but 1-indexed in tool.
# Tool said line 473 is "<!-- Mag 7 Ticker Tape -->".
# List index for line 473 is 472.
# Tool said line 560 is "                </div>".
# List index for line 560 is 559.

start_idx = 472
end_idx = 560 # Python slice is end-exclusive, so this will include index 559.

# Verify we are cutting what we think we are cutting
print(f"Cutting from line {start_idx+1}: {lines[start_idx].strip()}")
print(f"Cutting to line {end_idx}: {lines[end_idx-1].strip()}")

new_lines = lines[:start_idx] + [snippet + '\n'] + lines[end_idx:]

with open(index_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully spliced index.html")
