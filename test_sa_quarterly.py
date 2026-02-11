
from fetchers.stock_analysis import get_extended_history
import pandas as pd

def test_fetch(ticker):
    print(f"Fetching data for {ticker}...")
    data = get_extended_history(ticker)
    
    if data.get("error"):
        print(f"Error: {data['error']}")
        return

    print("--- Data Shapes ---")
    for key, df in data.items():
        if isinstance(df, pd.DataFrame):
            print(f"{key}: {df.shape}")
            if not df.empty:
               print(f"   Cols: {list(df.columns)[:3]}...{list(df.columns)[-3:]}")
               # Check index for Metric names
               print(f"   Index (first 5): {list(df.index)[:5]}")
    
    # Check BS Quarterly Index (Metrics)
    bs_q = data.get("bs_q")
    if not bs_q.empty:
        print("\n--- BS Quarterly Metrics (Index) ---")
        print(list(bs_q.index)[:30])
    
    inc_q = data.get("inc_q")
    if not inc_q.empty:
        print("\n--- Inc Quarterly Metrics (Index) ---")
        print(list(inc_q.index)[:20])

test_fetch("AAPL")
