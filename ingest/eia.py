import requests
import os
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

EIA_KEY = os.getenv("EIA_KEY")
BASE = "https://api.eia.gov/v2"

SERIES = {
    "wti": "petroleum/pri/spt/data/?frequency=daily&data[0]=value&facets[product][]=RWTC",
    "brent": "petroleum/pri/spt/data/?frequency=daily&data[0]=value&facets[product][]=BRENT",
    "gasoline": "petroleum/pri/spt/data/?frequency=daily&data[0]=value&facets[product][]=EER_EPMR_PF4_RGC_DPG",
    "diesel": "petroleum/pri/spt/data/?frequency=daily&data[0]=value&facets[product][]=EER_EPMR_PF4_RDC",
    "inventory": "petroleum/stoc/wstk/data/?frequency=weekly&data[0]=value",
    "rigs": "petroleum/drill/data/?frequency=weekly&data[0]=value",
    "production": "petroleum/crd/data/?frequency=monthly&data[0]=value",
    "natural_gas_storage": "natural-gas/stor/wstk/data/?frequency=weekly&data[0]=value",
    "natural_gas_price": "natural-gas/pri/dcu/data/?frequency=daily&data[0]=value",
    "electricity": "electricity/rto/daily-fuel-type-data/data/?frequency=daily&data[0]=value",
}

def fetch_eia(series_key, days=30):
    if not EIA_KEY:
        raise ValueError("EIA_KEY not set")
    
    url = f"{BASE}/{SERIES[series_key]}"
    start = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    params = {
        "api_key": EIA_KEY,
        "start": start,
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        "length": 5000
    }
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json().get("response", {}).get("data", [])
    return [{"series": series_key, **row} for row in data]