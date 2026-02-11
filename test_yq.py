from yahooquery import Ticker

def test_yq(ticker):
    print(f"Testing {ticker} with yahooquery...")
    try:
        t = Ticker(ticker)
        
        # Price
        price = t.price
        if isinstance(price, dict) and ticker in price:
            p = price[ticker]['regularMarketPrice']
            print(f"  [OK] price = {p}")
        else:
             print(f"  [FAIL] price: {price}")

        # Summary Detail
        summary = t.summary_detail
        if isinstance(summary, dict) and ticker in summary:
             print(f"  [OK] summary fetched")
        else:
             print(f"  [FAIL] summary: {summary}")

    except Exception as e:
        print(f"CRITICAL ERROR for {ticker}: {e}")

if __name__ == "__main__":
    test_yq("MSFT")
    test_yq("AAPL")
