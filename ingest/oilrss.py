import feedparser
import logging

logger = logging.getLogger(__name__)

def fetch_oilprice():
    url = "https://oilprice.com/rss/main"
    try:
        feed = feedparser.parse(url)
        return [{
            "id": e.link,
            "title": e.title,
            "url": e.link,
            "published": e.published,
            "summary": e.summary,
            "source": "OilPrice.com"
        } for e in feed.entries]
    except Exception as e:
        logger.error(f"OilPrice RSS error: {e}")
        return []