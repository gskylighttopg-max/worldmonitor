import feedparser
import logging

logger = logging.getLogger(__name__)

RSS_FEEDS = [
    {"url": "https://feeds.reuters.com/reuters/worldNews", "source": "Reuters"},
    {"url": "https://feeds.bbci.co.uk/news/world/rss.xml", "source": "BBC"},
    {"url": "https://www.aljazeera.com/xml/rss/all.xml", "source": "Al Jazeera"},
    {"url": "https://www.dw.com/en/top-stories/rss.xml", "source": "DW"},
    {"url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "source": "NY Times"},
    {"url": "https://www.france24.com/en/rss", "source": "France 24"},
    {"url": "https://oilprice.com/rss/main", "source": "OilPrice"},
    {"url": "https://www.energyintel.com/rss", "source": "Energy Intelligence"},
    {"url": "https://www.rigzone.com/news/rss/rigzone_latest.xml", "source": "Rigzone"},
    {"url": "https://gcaptain.com/feed/", "source": "gCaptain"},
    {"url": "https://www.defenseone.com/rss.xml", "source": "Defense One"},
]

def fetch_all_rss():
    all_items = []
    for feed_info in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_info["url"])
            for entry in feed.entries[:50]:
                all_items.append({
                    "id": entry.get("link", ""),
                    "title": entry.get("title", ""),
                    "url": entry.get("link", ""),
                    "published": entry.get("published", ""),
                    "summary": entry.get("summary", ""),
                    "source": feed_info["source"]
                })
        except Exception as e:
            logger.error(f"RSS {feed_info['source']} failed: {e}")
    return all_items