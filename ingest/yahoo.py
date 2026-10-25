import requests
import logging

logger = logging.getLogger(__name__)

def fetch_yahoo(symbols=["CL=F", "BZ=F", "USO", "XLE", "XOP", "UNG", "UGA"]):
    url = "https://query1.finance.yahoo.com/v8/finance/chart/"
    results = {}
    for sym in symbols:
        try:
            r = requests.get(f"{url}{sym}", params={"interval": "1d", "range": "1mo"}, timeout=30)
            if r.ok:
                results[sym] = r.json()
        except Exception:
            pass
    return results