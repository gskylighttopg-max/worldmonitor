import feedparser
import logging

logger = logging.getLogger(__name__)

def fetch_wto():
    url = "https://www.wto.org/english/tratop_e/dispu_e/dispu_rss_e.xml"
    try:
        feed = feedparser.parse(url)
        return [{
            "id": e.link,
            "title": e.title,
            "url": e.link,
            "published": e.published,
            "summary": e.summary,
            "source": "WTO"
        } for e in feed.entries]
    except Exception as e:
        logger.error(f"WTO error: {e}")
        return []