import requests
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc"

def fetch_gdelt(hours=24, max_records=2500):
    params = {
        "format": "json",
        "mode": "artlist",
        "timespan": f"{hours}h",
        "maxrecords": str(max_records),
        "format": "json",
    }
    
    logger.info(f"Fetching GDELT events for last {hours}h")
    r = requests.get(BASE_URL, params=params, timeout=60)
    r.raise_for_status()
    data = r.json()
    
    events = []
    for e in data.get("articles", []):
        try:
            events.append({
                "id": e.get("url", ""),
                "title": e.get("title", ""),
                "url": e.get("url", ""),
                "source": e.get("domain", ""),
                "published": e.get("seendate", ""),
                "language": e.get("language", ""),
                "sentiment": float(e.get("tone", 0)),
                "themes": e.get("theme", "").split(",") if e.get("theme") else [],
                "locations": e.get("locations", ""),
                "source_country": e.get("sourcecountry", ""),
                "raw": e
            })
        except Exception:
            continue
    
    logger.info(f"Fetched {len(events)} GDELT events")
    return events