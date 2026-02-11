
import requests
import pandas as pd
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def test_url(name, url):
    print(f"Testing {name}: {url}")
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        print(f"  Status: {r.status_code}")
        if r.status_code == 200:
            dfs = pd.read_html(io.StringIO(r.text))
            print(f"  Found {len(dfs)} tables")
            for i, df in enumerate(dfs):
                print(f"  Table {i} shape: {df.shape}")
                print(f"  Cols: {list(df.columns)}")
                print(f"  Head:\n{df.head(2)}")
    except Exception as e:
        print(f"  Error: {e}")

# Nasdaq API
def test_nasdaq():
    print("Testing Nasdaq API...")
    url = "https://api.nasdaq.com/api/quote/AAPL/short-interest?assetclass=stocks"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Origin": "https://www.nasdaq.com",
        "Referer": "https://www.nasdaq.com/"
    }
# Nasdaq API (testing IBM - NYSE)
def test_nasdaq():
    print("Testing Nasdaq API for IBM (NYSE)...")
    url = "https://api.nasdaq.com/api/quote/IBM/short-interest?assetclass=stocks"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Origin": "https://www.nasdaq.com",
        "Referer": "https://www.nasdaq.com/"
    }
    try:
        r = requests.get(url, headers=headers, timeout=10)
        print(f"  Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            if data and "data" in data:
                coll = data["data"].get("shortInterestList", {}).get("collection", [])
                print(f"  Found {len(coll)} points in collection.")
                if coll:
                    print(f"  First point: {coll[0]}")
    except Exception as e:
        print(f"  Error: {e}")

# Fintel Chart API
def test_fintel_api():
    print("Testing Fintel Chart API...")
    url = "https://fintel.io/api/ss/us/aapl/chart/short-interest"
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        print(f"  Status: {r.status_code}")
        if r.status_code == 200:
            print(f"  Snippet: {r.text[:200]}")
    except Exception as e:
        print(f"  Error: {e}")

test_fintel_api()

test_nasdaq()

# Stocksera
test_url("Stocksera JSON", "https://stocksera.pythonanywhere.com/api/ticker/short_interest/AAPL")
