import requests
import os
import logging

logger = logging.getLogger(__name__)

def fetch_gnews(query="conflict OR energy OR oil OR trade", max_records=100):
    key = os.getenv("GNEWS_KEY")
    if not key:
        logger.warning("GNEWS_KEY not set, skipping")
        return []
    
    url = "https://gnews.io/api/v4/search"
    params = {"q": query, "lang": "en", "max": max_records, "apikey": key}
    
    try:
        r = requests.get(url, params=params, timeout=30)
        if r.status_code == 429:
            logger.warning("GNews rate limited")
            return []
        r.raise_for_status()
        data = r.json()
        articles = []
        for a in data.get("articles", []):
            articles.append({
                "id": a["url"],
                "title": a["title"],
                "url": a["url"],
                "source": a["source"]["name"],
                "published": a["publishedAt"],
                "description": a["description"],
                "content": a["content"],
                "source": "gnews"
            })
        return articles
    except Exception as e:
        logger.error(f"GNews error: {e}")
        return []