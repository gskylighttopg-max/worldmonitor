import requests
import os
import logging

logger = logging.getLogger(__name__)

def fetch_comtrade(reporter="US", partner="CN", freq="A", max_records=100):
    key = os.getenv("COMTRADE_KEY")
    url = "https://comtradeapi.un.org/public/v1/preview/C/A/HS"
    params = {
        "reporterCode": reporter,
        "partnerCode": partner,
        "freqCode": freq,
        "maxRecords": max_records,
    }
    if key:
        params["subscriptionKey"] = key
    
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error(f"Comtrade error: {e}")
        return {}