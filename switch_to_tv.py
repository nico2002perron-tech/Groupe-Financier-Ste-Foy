
import os

# Paths
index_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\index.html'
snippet_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\snippet_tv.html'
css_path = r'c:\Users\Nicolas Perron\.gemini\antigravity\scratch\GroupeFinancierSteFoy\css\style.css'

# 1. READ FILES
with open(index_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(snippet_path, 'r', encoding='utf-8') as f:
    snippet = f.read()

# 2. IDENTIFY TARGET ZONE
# The previous script restored "<!-- Single Consolidated Ticker Tape -->".
# And ended at "<!-- Time Range Controls -->" (or nearby).
# Let's find the boundaries again.

start_marker_1 = "<!-- Single Consolidated Ticker Tape -->"
start_marker_2 = "<!-- Mag 7 Double Ticker Tape -->" # Just in case
start_marker_3 = "<div class=\"ticker-container\">" # Fallback

end_marker = "<div class=\"chart-controls\">"

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if start_marker_1 in line or start_marker_2 in line:
        start_idx = i
        break
    # Backup check if comment is missing but div is there
    if start_idx == -1 and start_marker_3 in line:
        start_idx = i

for i, line in enumerate(lines):
    if end_marker in line:
        end_idx = i
        # We want to insert BEFORE the chart controls, usually there's a few empty lines or the loop closing div before.
        # Let's look slightly up from here? No, replacement works fine if we cut correctly.
        # But wait, the ticker container ends with </div>.
        # Searching for the START of chart controls is safe as the end boundary.
        break

# Refine Start Index: We want to include the comment row if possible.
# Refine End Index: We want to replace everything UP TO the chart controls.

if start_idx != -1 and end_idx != -1:
    # Backtrack end_idx to remove trailing whitespace/divs belonging to previous ticker
    # actually, strict replacement between start and end is better.
    print(f"Replacing from line {start_idx+1} to {end_idx+1}")
    
    new_lines = lines[:start_idx] + [snippet + '\n'] + lines[end_idx:]
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("HTML updated with TradingView Widgets.")
else:
    print(f"Could not find markers. Start: {start_idx}, End: {end_idx}")

# 3. HIDE TRADINGVIEW BRANDING CSS
# We will append the display:none rule for the copyright class.
branding_css = """
/* HIDE TRADINGVIEW COPYRIGHT */
.tradingview-widget-copyright {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
}
"""

with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

if ".tradingview-widget-copyright" not in css_content:
    with open(css_path, 'a', encoding='utf-8') as f:
        f.write(branding_css)
    print("CSS updated to hide TradingView branding.")
else:
    print("CSS already contains TradingView hiding rule.")
