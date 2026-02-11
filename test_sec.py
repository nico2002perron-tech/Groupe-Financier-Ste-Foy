import requests
import pandas as pd
import json

# Headers required by SEC (User-Agent with email)
HEADERS = {
    "User-Agent": "ValuationApp/1.0 (contact@example.com)"
}

def get_cik(ticker):
    print("Fetching CIK mapping...")
    url = "https://www.sec.gov/files/company_tickers.json"
    r = requests.get(url, headers=HEADERS)
    data = r.json()
    
    for key, val in data.items():
        if val["ticker"] == ticker.upper():
            return str(val["cik_str"]).zfill(10)
    return None

def test_sec_fetch(ticker):
    cik = get_cik(ticker)
    if not cik:
        print("CIK not found.")
        return

    print(f"CIK for {ticker}: {cik}")
    
    url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"
    print(f"Fetching {url}...")
    r = requests.get(url, headers=HEADERS)
    
    if r.status_code != 200:
        print(f"Error: {r.status_code}")
        return
        
    data = r.json()
    facts = data.get("facts", {}).get("us-gaap", {})
    
    print("\n--- Searching for Revenue ---")
    # Common Revenue tags
    rev_tags = ["Revenues", "SalesRevenueNet", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueGoodsNet"]
    
    found_data = []
    
    for tag in rev_tags:
        if tag in facts:
            print(f"Found tag: {tag}")
            units = facts[tag].get("units", {}).get("USD", [])
            print(f"Count: {len(units)}")
            if len(units) > 0:
                # Convert to dataframe to see dates
                df = pd.DataFrame(units)
                # Filter for 10-K (Annual)
                df_10k = df[df["form"] == "10-K"].copy()
                if not df_10k.empty:
                    df_10k = df_10k.sort_values("end")
                    print(f"Range 10-K: {df_10k['end'].min()} to {df_10k['end'].max()}")
                    print(df_10k[['end', 'val', 'fy', 'fp']].tail())
                    found_data.append(tag)
    
    if not found_data:
        print("No standard revenue tags found. Available keys (sample):")
        print(list(facts.keys())[:10])

print("Testing SEC Fetch for AAPL...")
test_sec_fetch("AAPL")
