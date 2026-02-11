import yfinance as yf
from datetime import datetime

tickers = ['DIS', 'UBER', 'KO', 'PEP', 'NVDA', 'SHOP.TO', 'RY.TO']
print(f"System Time: {datetime.now()}")

for t in tickers:
    try:
        tick = yf.Ticker(t)
        cal = tick.calendar
        print(f"--- {t} ---")
        if isinstance(cal, dict):
             d = cal.get("Earnings Date", [])
             if d:
                 print(f"Date: {d[0]} (Type: {type(d[0])})")
             else:
                 print("No 'Earnings Date' key or empty list")
        else:
            print(f"Not a dict: {type(cal)}")
            print(cal)
    except Exception as e:
        print(f"Error: {e}")
