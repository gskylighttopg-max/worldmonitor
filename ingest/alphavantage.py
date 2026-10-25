import requests
import os
import logging

logger = logging.getLogger(__name__)

ALPHA_KEY = os.getenv("ALPHA_KEY")
BASE_URL = "https://www.alphavantage.co/query"

# Alpha Vantage commodity functions
COMMODITY_FUNCTIONS = {
    "wti": "WTI",
    "brent": "BRENT",
    "natural_gas": "NATURAL_GAS",
    "copper": "COPPER",
    "aluminum": "ALUMINUM",
    "wheat": "WHEAT",
    "corn": "CORN",
    "cotton": "COTTON",
    "sugar": "SUGAR",
    "coffee": "COFFEE",
}

def fetch_commodity(symbol, interval="daily"):
    """
    Fetch commodity data from Alpha Vantage.
    Functions: WTI, BRENT, NATURAL_GAS, COPPER, ALUMINUM, WHEAT, CORN, COTTON, SUGAR, COFFEE
    Interval: daily, weekly, monthly
    """
    if not ALPHA_KEY:
        logger.warning("ALPHA_KEY not set, skipping Alpha Vantage")
        return []
    
    if symbol not in COMMODITY_FUNCTIONS:
        logger.warning(f"Unknown commodity symbol: {symbol}")
        return []
    
    function = COMMODITY_FUNCTIONS[symbol]
    
    params = {
        "function": function,
        "interval": interval,
        "apikey": ALPHA_KEY
    }
    
    try:
        r = requests.get(BASE_URL, params=params, timeout=30)
        
        if r.status_code == 429:
            logger.warning("Alpha Vantage rate limited")
            return []
        
        r.raise_for_status()
        data = r.json()
        
        # Check for API error messages
        if "Error Message" in data:
            logger.error(f"Alpha Vantage error: {data['Error Message']}")
            return []
        if "Note" in data:
            logger.warning(f"Alpha Vantage note: {data['Note']}")
            return []
        
        # Parse time series data
        time_series_key = None
        for key in data.keys():
            if "Time Series" in key or "Monthly" in key or "Weekly" in key:
                time_series_key = key
                break
        
        if not time_series_key:
            logger.warning(f"No time series data for {symbol}")
            return []
        
        series = data[time_series_key]
        results = []
        
        for date_str, values in series.items():
            try:
                # Normalize value keys (they vary by function)
                value = None
                for k, v in values.items():
                    if "close" in k.lower() or "value" in k.lower() or "price" in k.lower():
                        value = float(v)
                        break
                
                if value is not None:
                    results.append({
                        "series": symbol,
                        "date": date_str,
                        "value": value,
                        "raw": values
                    })
            except Exception as e:
                logger.warning(f"Error parsing {symbol} data for {date_str}: {e}")
                continue
        
        logger.info(f"Fetched {len(results)} {symbol} records from Alpha Vantage")
        return results
        
    except Exception as e:
        logger.error(f"Alpha Vantage error for {symbol}: {e}")
        return []


def fetch_all_commodities():
    """Fetch all configured commodities"""
    results = {}
    for symbol in COMMODITY_FUNCTIONS:
        try:
            data = fetch_commodity(symbol)
            if data:
                results[symbol] = data
        except Exception as e:
            logger.error(f"Failed to fetch {symbol}: {e}")
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    import json
    data = fetch_all_commodities()
    print(json.dumps(data, indent=2))