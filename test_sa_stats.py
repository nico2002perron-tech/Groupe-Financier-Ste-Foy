
import requests
import pandas as pd
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def check_sa_stats(ticker):
    url = f"https://stockanalysis.com/stocks/{ticker.lower()}/short-interest/"
    print(f"Checking {url}...")
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200:
            dfs = pd.read_html(io.StringIO(r.text))
            print(f"Found {len(dfs)} tables.")
            for i, df in enumerate(dfs):
                print(f"\nTable {i}:")
                print(df.head())
                # Check for Short Interest keywords
                if df.astype(str).apply(lambda x: x.str.contains("Short", case=False)).any().any():
                    print(">>> FOUND 'Short' in this table! <<<")
        else:
            print(f"Error {r.status_code}")
    except Exception as e:
        print(f"Exception: {e}")

check_sa_stats("AAPL")
