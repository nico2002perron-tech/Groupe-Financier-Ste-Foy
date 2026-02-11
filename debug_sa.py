import pandas as pd
from fetchers.stock_analysis import get_extended_history

print("Fetching AAPL...")
data = get_extended_history("AAPL")

if "inc_a" in data and not data["inc_a"].empty:
    df = data["inc_a"]
    print("\n--- Annual Metrics (Index) ---")
    print(df.index.tolist())
    
    print("\nCheck for 'Revenue':")
    for idx in df.index:
        if "Revenue" in str(idx):
            print(f"'{idx}' (len={len(idx)}) - hex: {idx.encode('utf-8')}")
else:
    print("Error or empty data:", data.get("error"))
