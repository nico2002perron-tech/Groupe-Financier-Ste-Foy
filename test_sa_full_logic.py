
from fetchers.stock_analysis import get_extended_history
import pandas as pd

def process_financial_metrics(inc_df, bs_df, cf_df):
    if inc_df.empty and bs_df.empty and cf_df.empty:
        return pd.DataFrame()
        
    # Transpose
    def clean_transpose(df):
        if df.empty: return pd.DataFrame()
        df_t = df.T
        if "TTM" in df_t.index: df_t = df_t.rename(index={"TTM": "Last 12M"})
        return df_t

    # Prepare for joining by normalizing date index
    def prepare_for_join(df):
        if df.empty: return df
        try:
            df.index = pd.to_datetime(df.index, errors='coerce')
            df.index = df.index.to_period('Q')
        except:
            pass
        return df

    df_inc = prepare_for_join(clean_transpose(inc_df))
    df_bs = prepare_for_join(clean_transpose(bs_df))
    df_cf = prepare_for_join(clean_transpose(cf_df))
    
    # Merge
    df_all = df_inc.join(df_bs, lsuffix="_inc", rsuffix="_bs", how="outer")
    df_all = df_all.join(df_cf, rsuffix="_cf", how="outer")
    
    # Convert index back to string dates
    try:
        df_all.index = df_all.index.to_timestamp(how='end').strftime('%Y-%m-%d')
    except:
        df_all.index = df_all.index.astype(str)

    # Sort Logic
    try:
        df_all = df_all.sort_index(ascending=True)
    except:
        df_all = df_all.iloc[::-1]

    # Helper col finder
    def get_col(df, candidates):
        for c in df.columns:
            for cand in candidates:
                if cand.lower().replace(" ", "") == str(c).lower().replace(" ", ""):
                    return c
        return None
        
    print("\n--- Available Columns Scan ---")
    all_cols = list(df_all.columns)
    keywords = ["Revenue", "Profit", "Income", "Equity", "Debt", "Cash", "Asset", "Liabilit"]
    for k in keywords:
        matches = [c for c in all_cols if k.lower() in str(c).lower()]
        print(f"Key '{k}': {matches[:5]}") # Show first 5 matches

    # --- Calculations ---
    print("\n--- Processing Calculations ---")
    
    # FCF
    col_ocf = get_col(df_all, ["Operating Cash Flow", "Cash From Operations"])
    col_capex = get_col(df_all, ["Capital Expenditures", "CapEx"])
    if col_ocf and col_capex:
            df_all["Free Cash Flow"] = df_all[col_ocf] - df_all[col_capex].abs()
    else:
        print(f"FCF missing cols: OCF={col_ocf}, CapEx={col_capex}")

    # Margins
    col_rev = get_col(df_all, ["Total Revenue", "Revenue"])
    col_gp = get_col(df_all, ["Gross Profit"])
    col_op = get_col(df_all, ["Operating Income"])
    col_ni = get_col(df_all, ["Net Income", "Net Income Common Stockholders"])
    
    logs = []
    if col_rev:
        logs.append(f"DEBUG: Found Revenue col: {col_rev}")
        if col_gp: 
             df_all["Gross Margin %"] = (df_all[col_gp] / df_all[col_rev]) * 100
             logs.append(f"DEBUG: Calculated Gross Margin using {col_gp}")
        if col_op: 
             df_all["Operating Margin %"] = (df_all[col_op] / df_all[col_rev]) * 100
             logs.append(f"DEBUG: Calculated Oper Margin using {col_op}")
        else:
             logs.append("DEBUG: SKIP Oper Margin (col_op is None)")
        if col_ni: df_all["Net Margin %"] = (df_all[col_ni] / df_all[col_rev]) * 100
    else:
        logs.append("DEBUG: SKIP Margins (col_rev is None)")
        logs.append("Margins missing Revenue")

    # ROIC Proxy
    col_equity = get_col(df_all, ["Total Stockholders' Equity", "Total Equity", "Shareholders' Equity"])
    col_debt = get_col(df_all, ["Total Debt"])
    col_cash = get_col(df_all, ["Cash & Equivalents", "Cash and Equivalents", "Total Cash & Equivalents"])
    
    if col_op and col_equity and col_debt and col_cash:
        nopat = df_all[col_op] * 0.79
        invested_capital = df_all[col_equity] + df_all[col_debt] - df_all[col_cash]
        df_all["ROIC %"] = (nopat / invested_capital) * 100
    else:
        print(f"ROIC missing cols: Op={col_op}, Eq={col_equity}, Debt={col_debt}, Cash={col_cash}")
    
    return df_all, logs

def test_full_logic(ticker):
    print(f"Fetching {ticker}...")
    data = get_extended_history(ticker)
    
    if data.get("error"):
        print(f"Error: {data['error']}")
        return

    print("\nProcessing Quarterly Data...")
    df_q, logs = process_financial_metrics(
        data.get("inc_q", pd.DataFrame()),
        data.get("bs_q", pd.DataFrame()),
        data.get("cf_q", pd.DataFrame())
    )
    
    print("\n--- Diagnostic ---")
    metrics_to_check = [
        "Gross Margin %", "Operating Margin %", "ROIC %", 
        "Current Ratio (Fonds de roulement)", "Defensive Interval (Days)"
    ]
    
    for m in metrics_to_check:
        if m in df_q.columns:
            print(f"[OK] {m} FOUND. Sample: {df_q[m].dropna().head(3).tolist()}")
        else:
            print(f"[FAIL] {m} MISSING")
            
    # Check source columns for ROIC failure
    if "ROIC %" not in df_q.columns:
        print("Checking ROIC Sources:")
        print(f"  Op Income: {[c for c in df_q.columns if 'Operating' in c]}")
        print(f"  Equity: {[c for c in df_q.columns if 'Equity' in c]}")
        print(f"  Debt: {[c for c in df_q.columns if 'Debt' in c]}")

    with open("debug_columns.txt", "w", encoding="utf-8") as f:
        f.write("--- Log Trace ---\n")
        f.write("\n".join(logs))
        f.write("\n\n--- Available Columns Scan ---\n")
        all_cols = sorted(list(df_q.columns))
        for c in all_cols:
            f.write(f"- {c}\n")
            
        f.write("\n--- Diagnostic ---\n")
        metrics_to_check = [
            "Gross Margin %", "Operating Margin %", "ROIC %", 
            "Current Ratio (Fonds de roulement)", "Defensive Interval (Days)"
        ]
        
        for m in metrics_to_check:
            if m in df_q.columns:
                f.write(f"[OK] {m} FOUND. Sample: {df_q[m].dropna().head(3).tolist()}\n")
            else:
                f.write(f"[FAIL] {m} MISSING\n")
                if m == "ROIC %":
                   f.write("Checking ROIC Sources:\n")
                   f.write(f"  Op Income: {[c for c in df_q.columns if 'Operating' in str(c)]}\n")
                   f.write(f"  Equity: {[c for c in df_q.columns if 'Equity' in str(c)]}\n")
                   f.write(f"  Debt: {[c for c in df_q.columns if 'Debt' in str(c)]}\n")
                   f.write(f"  Cash: {[c for c in df_q.columns if 'Cash' in str(c)]}\n")

    print("Debug written to debug_columns.txt")


test_full_logic("AAPL")
