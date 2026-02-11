import requests

def test_html(ticker):
    url = f"https://finance.yahoo.com/quote/{ticker}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    try:
        r = requests.get(url, headers=headers)
        print(f"Status Code: {r.status_code}")
        if r.status_code == 200:
            print("Successfully fetched HTML")
            # Try to find price
            if "fin-streamer" in r.text or "regularMarketPrice" in r.text:
                print("Found price elements in HTML")
            else:
                 print("Could not find obvious price elements")
        else:
            print("Failed to fetch HTML")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_html("MSFT")
