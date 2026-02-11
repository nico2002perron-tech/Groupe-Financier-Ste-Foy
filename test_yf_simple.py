import yfinance as yf
import traceback

def test_ticker(ticker):
    print(f"Testing {ticker}...")
    try:
        s = yf.Ticker(ticker)
        
        # Test 1: fast_info
        print("--- fast_info ---")
        try:
            val = s.fast_info['last_price']
            print(f"  [OK] fast_info['last_price'] = {val}")
        except Exception as e:
            print(f"  [FAIL] fast_info: {e}")
            traceback.print_exc()

        # Test 2: history
        print("--- history ---")
        try:
            hist = s.history(period="1d")
            if not hist.empty:
                print(f"  [OK] history 1d close = {hist['Close'].iloc[-1]}")
            else:
                print(f"  [FAIL] history returned empty df")
        except Exception as e:
            print(f"  [FAIL] history: {e}")
            traceback.print_exc()

        # Test 3: info
        print("--- info ---")
        try:
            info = s.info
            price = info.get("currentPrice") or info.get("regularMarketPrice")
            print(f"  [OK] info price = {price}")
        except Exception as e:
            print(f"  [FAIL] info: {e}")
            traceback.print_exc()

    except Exception as e:
        print(f"CRITICAL ERROR for {ticker}: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_ticker("MSFT")
