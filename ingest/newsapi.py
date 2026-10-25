import requests
import os
import logging

logger = logging.getLogger(__name__)

def fetch_newsapi(query="conflict OR war OR protest OR energy OR oil OR trade", pages=2):
    key = os.getenv("NEWSAPI_KEY")
    if not key:
        logger.warning("NEWSAPI_KEY not set, skipping")
        return []
    
    url = "https://newsapi.org/v2/everything"
    all_articles = []
    
    for page in range(1, pages + 1):
        params = {
            "q": query,
            "language": "en",
            "pageSize": 100,
            "page": page,
            "sortBy": "publishedAt",
            "apiKey": key
        }
        try:
            r = requests.get("https://newsapi.org/v2/everything", params=params, timeout=30)
            if r.status_code == 429:
                logger.warning("NewsAPI rate limited")
                break
            r.raise_for_status()
            data = r.json()
            for a in data.get("articles", []):
                all_articles.append({
                    "id": a["url"],
                    "title": a["title"],
                    "url": a["url"],
                    "source": a["source"]["name"],
                    "published": a["publishedAt"],
                    "description": a["description"],
                    "content": a["content"],
                    "source": "newsapi"
                })
        except Exception as e:
            logger.error(f"NewsAPI error: {e}")
            break
    
    return all_articles