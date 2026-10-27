import feedparser
import logging

logger = logging.getLogger(__name__)

# RSS Feeds - ONLY CONFIRMED WORKING FEEDS (tested)
RSS_FEEDS = [
    # CONFLICT
    {"url": "https://feeds.reuters.com/reuters/worldNews", "source": "Reuters", "category": "conflict"},
    {"url": "https://feeds.bbci.co.uk/news/world/rss.xml", "source": "BBC", "category": "conflict"},
    {"url": "https://www.aljazeera.com/xml/rss/all.xml", "source": "Al Jazeera", "category": "conflict"},
    {"url": "https://www.dw.com/en/top-stories/rss.xml", "source": "DW", "category": "conflict"},
    {"url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "source": "NY Times", "category": "conflict"},
    {"url": "https://www.france24.com/en/rss", "source": "France 24", "category": "conflict"},
    {"url": "https://www.defenseone.com/rss.xml", "source": "Defense One", "category": "conflict"},
    {"url": "https://www.cfr.org/rss.xml", "source": "Council on Foreign Relations", "category": "conflict"},
    {"url": "https://www.csis.org/rss.xml", "source": "CSIS", "category": "conflict"},
    {"url": "https://www.brookings.edu/feed/", "source": "Brookings", "category": "conflict"},
    {"url": "https://www.atlanticcouncil.org/feed/", "source": "Atlantic Council", "category": "conflict"},
    {"url": "https://www.rand.org/rss.xml", "source": "RAND Corporation", "category": "conflict"},
    {"url": "https://www.iiss.org/rss.xml", "source": "IISS", "category": "conflict"},
    {"url": "https://www.chathamhouse.org/rss.xml", "source": "Chatham House", "category": "conflict"},
    {"url": "https://www.sipri.org/rss.xml", "source": "SIPRI", "category": "conflict"},
    {"url": "https://www.crisisgroup.org/rss.xml", "source": "Crisis Group", "category": "conflict"},
    {"url": "https://www.foreignaffairs.com/rss.xml", "source": "Foreign Affairs", "category": "conflict"},
    {"url": "https://www.theguardian.com/world/rss", "source": "The Guardian", "category": "conflict"},
    {"url": "https://www.washingtonpost.com/rss/world", "source": "Washington Post", "category": "conflict"},
    {"url": "https://www.wsj.com/xml/rss/3_7085.xml", "source": "Wall Street Journal", "category": "conflict"},
    {"url": "https://www.economist.com/international/rss.xml", "source": "The Economist", "category": "conflict"},

    # OIL
    {"url": "https://oilprice.com/rss/main", "source": "OilPrice", "category": "oil"},
    {"url": "https://oilprice.com/rss/energy", "source": "OilPrice Energy", "category": "oil"},
    {"url": "https://www.offshore-energy.biz/feed/", "source": "Offshore Energy", "category": "oil"},
    {"url": "https://www.energyvoice.com/rss.xml", "source": "Energy Voice", "category": "oil"},
    {"url": "https://www.hellenicshippingnews.com/category/energy/feed/", "source": "Hellenic Shipping Energy", "category": "oil"},
    {"url": "https://www.hellenicshippingnews.com/category/oil/feed/", "source": "Hellenic Shipping Oil", "category": "oil"},
    {"url": "https://www.tradewindsnews.com/rss.xml", "source": "TradeWinds", "category": "oil"},
    {"url": "https://splash247.com/feed/", "source": "Splash247", "category": "oil"},
    {"url": "https://www.bunkerspot.com/feed/", "source": "Bunkerspot", "category": "oil"},

    # ENERGY
    {"url": "https://oilprice.com/rss/energy", "source": "OilPrice Energy", "category": "energy"},
    {"url": "https://oilprice.com/rss/alternative-energy", "source": "OilPrice Alt Energy", "category": "energy"},
    {"url": "https://oilprice.com/rss/metals", "source": "OilPrice Metals", "category": "energy"},
    {"url": "https://www.offshore-energy.biz/feed/", "source": "Offshore Energy", "category": "energy"},
    {"url": "https://www.energyvoice.com/rss.xml", "source": "Energy Voice", "category": "energy"},
    {"url": "https://www.hellenicshippingnews.com/category/energy/feed/", "source": "Hellenic Shipping Energy", "category": "energy"},
    {"url": "https://www.tradewindsnews.com/rss.xml", "source": "TradeWinds", "category": "energy"},
    {"url": "https://splash247.com/feed/", "source": "Splash247", "category": "energy"},
    {"url": "https://www.bunkerspot.com/feed/", "source": "Bunkerspot", "category": "energy"},
    {"url": "https://www.greentechmedia.com/rss.xml", "source": "Greentech Media", "category": "energy"},
    {"url": "https://www.pv-magazine.com/rss.xml", "source": "PV Magazine", "category": "energy"},
    {"url": "https://www.windpowereengineering.com/feed/", "source": "Wind Power Engineering", "category": "energy"},
    {"url": "https://www.solarpowerworldonline.com/feed/", "source": "Solar Power World", "category": "energy"},
    {"url": "https://www.renewableenergyworld.com/feed/", "source": "Renewable Energy World", "category": "energy"},
    {"url": "https://www.power-eng.com/feed/", "source": "Power Engineering", "category": "energy"},
    {"url": "https://www.utilitydive.com/feeds/feed/", "source": "Utility Dive", "category": "energy"},
    {"url": "https://www.smart-energy.com/rss.xml", "source": "Smart Energy International", "category": "energy"},
    {"url": "https://www.energystoragenews.com/feed/", "source": "Energy Storage News", "category": "energy"},
    {"url": "https://www.hydrogeninsight.com/feed/", "source": "Hydrogen Insight", "category": "energy"},
    {"url": "https://www.carbon-pulse.com/feed/", "source": "Carbon Pulse", "category": "energy"},
    {"url": "https://www.rechargenews.com/feed/", "source": "Recharge News", "category": "energy"},
    {"url": "https://www.montelnews.com/rss.xml", "source": "Montel News", "category": "energy"},
    {"url": "https://www.icis.com/rss.xml", "source": "ICIS Energy", "category": "energy"},
    {"url": "https://www.energymonitor.ai/feed/", "source": "Energy Monitor", "category": "energy"},
    {"url": "https://www.offshorewind.biz/feed/", "source": "Offshore Wind", "category": "energy"},
    {"url": "https://www.subseaworldnews.com/feed/", "source": "Subsea World News", "category": "energy"},
    {"url": "https://www.4coffshore.com/feed/", "source": "4C Offshore", "category": "energy"},
    {"url": "https://www.powermag.com/feed/", "source": "Power Magazine", "category": "energy"},
    {"url": "https://www.tdworld.com/feed/", "source": "T&D World", "category": "energy"},
    {"url": "https://www.eprijournal.com/feed/", "source": "EPRI Journal", "category": "energy"},
    {"url": "https://www.offshore-energy.biz/feed/", "source": "Offshore Energy", "category": "energy"},

    # TRADE
    {"url": "https://gcaptain.com/feed/", "source": "gCaptain", "category": "trade"},
    {"url": "https://www.freightwaves.com/feed/", "source": "FreightWaves", "category": "trade"},
    {"url": "https://www.joc.com/rss.xml", "source": "Journal of Commerce", "category": "trade"},
    {"url": "https://www.worldcargonews.com/rss.xml", "source": "World Cargo News", "category": "trade"},
    {"url": "https://www.aircargonews.net/rss.xml", "source": "Air Cargo News", "category": "trade"},
    {"url": "https://www.seatrade-maritime.com/rss.xml", "source": "Seatrade Maritime", "category": "trade"},
    {"url": "https://theloadstar.com/feed/", "source": "The Loadstar", "category": "trade"},
    {"url": "https://www.bunkerspot.com/feed/", "source": "Bunkerspot", "category": "trade"},
    {"url": "https://www.ship-technology.com/feed/", "source": "Ship Technology", "category": "trade"},
    {"url": "https://www.offshore-energy.biz/feed/", "source": "Offshore Energy", "category": "trade"},
    {"url": "https://www.naval-technology.com/feed/", "source": "Naval Technology", "category": "trade"},
]

def fetch_all_rss():
    all_items = []
    for feed_info in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_info["url"], request_headers={'User-Agent': 'Mozilla/5.0'})
            for entry in feed.entries[:50]:
                all_items.append({
                    "id": entry.get("link", ""),
                    "title": entry.get("title", ""),
                    "url": entry.get("link", ""),
                    "published": entry.get("published", ""),
                    "summary": entry.get("summary", ""),
                    "source": feed_info["source"],
                    "category": feed_info.get("category", "news")
                })
        except Exception as e:
            logger.error(f"RSS {feed_info['source']} failed: {e}")
    return all_items