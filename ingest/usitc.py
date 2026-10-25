import requests
import logging

logger = logging.getLogger(__name__)

def fetch_usitc_tariffs():
    url = "https://dataweb.usitc.gov/api/tariff"
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        logger.error(f"USITC error: {e}")
        return {}