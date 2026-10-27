import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime

sys.path.append(str(Path(__file__).parent))

from gdelt import fetch_gdelt
from newsapi import fetch_newsapi
from gnews import fetch_gnews
from reddit import fetch_reddit
from rss import fetch_all_rss
from eia import fetch_eia
from rigcount import fetch_rigcount
from wto import fetch_wto
from comtrade import fetch_comtrade
from usitc import fetch_usitc_tariffs
from yahoo import fetch_yahoo
from oilrss import fetch_oilprice
from ais import fetch_ais
from alphavantage import fetch_all_commodities
from utils.kv_client import KVClient

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

KV = KVClient()

def save_local(name, data):
    (DATA_DIR / f"{name}.json").write_text(json.dumps(data, indent=2))
    logger.info(f"Saved {name}: {len(data) if isinstance(data, list) else 'object'} items")

def save_kv(key, data):
    try:
        KV.put(key, json.dumps(data))
        logger.info(f"KV write: {key}")
    except Exception as e:
        logger.error(f"KV write failed for {key}: {e}")

def run_ingest():
    logger.info("Starting ingest run")
    start = datetime.now()
    
    try:
        logger.info("Fetching GDELT...")
        # Use 1-hour window for 15-min cron with BigQuery (no rate limits)
        gdelt_data = fetch_gdelt(hours=1, max_records=1000)
        save_local("conflict_gdelt", gdelt_data)
        save_kv("conflict:gdelt", gdelt_data)
    except Exception as e:
        logger.error(f"GDELT failed: {e}")
    
    try:
        logger.info("Fetching NewsAPI...")
        newsapi_data = fetch_newsapi()
        save_local("news_newsapi", newsapi_data)
        save_kv("news:newsapi", newsapi_data)
    except Exception as e:
        logger.error(f"NewsAPI failed: {e}")
    
    try:
        logger.info("Fetching GNews...")
        gnews_data = fetch_gnews()
        save_local("news_gnews", gnews_data)
        save_kv("news:gnews", gnews_data)
    except Exception as e:
        logger.error(f"GNews failed: {e}")
    
    try:
        logger.info("Fetching Reddit...")
        reddit_data = fetch_reddit()
        save_local("news_reddit", reddit_data)
        save_kv("news:reddit", reddit_data)
    except Exception as e:
        logger.error(f"Reddit failed: {e}")
    
    try:
        logger.info("Fetching RSS...")
        rss_data = fetch_all_rss()
        save_local("news_rss", rss_data)
        save_kv("news:rss", rss_data)
    except Exception as e:
        logger.error(f"RSS failed: {e}")
    
    try:
        logger.info("Fetching EIA...")
        for k in ["wti", "brent", "inventory", "rigs", "production"]:
            data = fetch_eia(k)
            save_local(f"oil_{k}", data)
            save_kv(f"oil:{k}", data)
    except Exception as e:
        logger.error(f"EIA failed: {e}")
    
    try:
        logger.info("Fetching RigCount...")
        rig_data = fetch_rigcount()
        save_local("oil_rigs", rig_data)
        save_kv("oil:rigs", rig_data)
    except Exception as e:
        logger.error(f"RigCount failed: {e}")
    
    try:
        logger.info("Fetching AIS vessel data...")
        ais_data = fetch_ais()
        save_local("vessels_ais", ais_data)
        save_kv("vessels:ais", ais_data)
    except Exception as e:
        logger.error(f"AIS failed: {e}")
    
    try:
        logger.info("Fetching Alpha Vantage commodities...")
        av_data = fetch_all_commodities()
        for symbol, data in av_data.items():
            save_local(f"commodity_{symbol}", data)
            save_kv(f"commodity:{symbol}", data)
    except Exception as e:
        logger.error(f"Alpha Vantage failed: {e}")
    
    try:
        logger.info("Fetching WTO...")
        wto_data = fetch_wto()
        save_local("trade_wto", wto_data)
        save_kv("trade:wto", wto_data)
    except Exception as e:
        logger.error(f"WTO failed: {e}")
    
    try:
        logger.info("Fetching UN Comtrade...")
        comtrade_data = fetch_comtrade()
        save_local("trade_comtrade", comtrade_data)
        save_kv("trade:comtrade", comtrade_data)
    except Exception as e:
        logger.error(f"Comtrade failed: {e}")
    
    try:
        logger.info("Fetching USITC...")
        usitc_data = fetch_usitc_tariffs()
        save_local("trade_usitc", usitc_data)
        save_kv("trade:usitc", usitc_data)
    except Exception as e:
        logger.error(f"USITC failed: {e}")
    
    try:
        logger.info("Fetching Yahoo Finance...")
        yahoo_data = fetch_yahoo()
        save_local("oil_yahoo", yahoo_data)
        save_kv("oil:yahoo", yahoo_data)
    except Exception as e:
        logger.error(f"Yahoo failed: {e}")
    
    try:
        logger.info("Fetching OilPrice RSS...")
        oil_news = fetch_oilprice()
        save_local("oil_news", oil_news)
        save_kv("news:oil", oil_news)
    except Exception as e:
        logger.error(f"OilPrice RSS failed: {e}")
    
    # Update meta keys for health endpoint
    try:
        meta = {
            "lastIngest": {"timestamp": datetime.now().isoformat()},
            "rsshub": {"status": "ok", "lastWebhook": datetime.now().isoformat()}
        }
        save_kv("meta:lastIngest", meta["lastIngest"])
        save_kv("meta:rsshub", meta["rsshub"])
        logger.info("Updated meta keys for health endpoint")
    except Exception as e:
        logger.error(f"Failed to update meta keys: {e}")
    
    elapsed = (datetime.now() - start).total_seconds()
    logger.info(f"Ingest complete in {elapsed:.1f}s")

if __name__ == "__main__":
    run_ingest()