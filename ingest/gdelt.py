import os
import json
import logging
from datetime import datetime, timedelta
from google.cloud import bigquery
from google.oauth2 import service_account

logger = logging.getLogger(__name__)

# GDELT BigQuery tables
# Events: gdelt-bq.gdeltv2.events (main event table)
# GKG: gdelt-bq.gdeltv2.gkg (global knowledge graph)

def fetch_gdelt_bigquery(hours=1, max_records=1000, project_id=None):
    """
    Fetch GDELT events from BigQuery for the last N hours.
    """
    try:
        # Load credentials from service account key
        creds_json = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
        project_id = project_id or os.getenv("GCP_PROJECT_ID")
        
        if not creds_json:
            logger.warning("GCP_SERVICE_ACCOUNT_KEY not set, falling back to REST API")
            return fetch_gdelt_rest(hours, max_records)
        
        creds = service_account.Credentials.from_service_account_info(
            json.loads(creds_json)
        )
        client = bigquery.Client(credentials=creds, project=project_id)
        
        # Calculate time window
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        # Query GDELT events table
        # DATEADDED is INT64 in format YYYYMMDDHHMMSS
        start_ts = int(start_time.strftime('%Y%m%d%H%M%S'))
        query = f"""
        SELECT
            GlobalEventID as id,
            Day,
            MonthYear,
            Year,
            FractionDate,
            Actor1Code,
            Actor1Name,
            Actor1CountryCode,
            Actor1KnownGroupCode,
            Actor1EthnicCode,
            Actor1Religion1Code,
            Actor1Religion2Code,
            Actor1Type1Code,
            Actor1Type2Code,
            Actor1Type3Code,
            Actor2Code,
            Actor2Name,
            Actor2CountryCode,
            Actor2KnownGroupCode,
            Actor2EthnicCode,
            Actor2Religion1Code,
            Actor2Religion2Code,
            Actor2Type1Code,
            Actor2Type2Code,
            Actor2Type3Code,
            IsRootEvent,
            EventCode,
            EventBaseCode,
            EventRootCode,
            QuadClass,
            GoldsteinScale,
            NumMentions,
            NumSources,
            NumArticles,
            AvgTone,
            Actor1Geo_Type,
            Actor1Geo_FullName,
            Actor1Geo_CountryCode,
            Actor1Geo_ADM1Code,
            Actor1Geo_Lat,
            Actor1Geo_Long,
            Actor1Geo_FeatureID,
            Actor2Geo_Type,
            Actor2Geo_FullName,
            Actor2Geo_CountryCode,
            Actor2Geo_ADM1Code,
            Actor2Geo_Lat,
            Actor2Geo_Long,
            Actor2Geo_FeatureID,
            ActionGeo_Type,
            ActionGeo_FullName,
            ActionGeo_CountryCode,
            ActionGeo_ADM1Code,
            ActionGeo_Lat,
            ActionGeo_Long,
            ActionGeo_FeatureID,
            DATEADDED,
            SOURCEURL
        FROM `gdelt-bq.gdeltv2.events`
        WHERE DATEADDED >= {start_ts}
        ORDER BY DATEADDED DESC
        LIMIT {max_records}
        """
        
        logger.info(f"Querying BigQuery for GDELT events (last {hours}h, max {max_records})")
        query_job = client.query(query)
        rows = query_job.result()
        
        events = []
        for row in rows:
            try:
                # Build location from ActionGeo (primary) or Actor1Geo
                lat = row.ActionGeo_Lat or row.Actor1Geo_Lat
                lng = row.ActionGeo_Long or row.Actor1Geo_Long
                country = row.ActionGeo_CountryCode or row.Actor1Geo_CountryCode
                location_name = row.ActionGeo_FullName or row.Actor1Geo_FullName
                
                events.append({
                    "id": str(row.GlobalEventID) if row.GlobalEventID else row.SOURCEURL,
                    "title": f"GDELT Event: {row.EventCode}" if row.EventCode else "GDELT Event",
                    "url": row.SOURCEURL or "",
                    "source": "GDELT",
                    "published": datetime.strptime(str(row.DATEADDED), "%Y%m%d%H%M%S").isoformat() + "Z" if row.DATEADDED else datetime.utcnow().isoformat() + "Z",
                    "language": "",
                    "sentiment": float(row.AvgTone) if row.AvgTone else 0.0,
                    "themes": [],
                    "locations": location_name or "",
                    "source_country": country or "",
                    "lat": float(lat) if lat else None,
                    "lng": float(lng) if lng else None,
                    "actor1": row.Actor1Name,
                    "actor2": row.Actor2Name,
                    "event_code": row.EventCode,
                    "goldstein_scale": float(row.GoldsteinScale) if row.GoldsteinScale else None,
                    "num_mentions": row.NumMentions,
                    "num_sources": row.NumSources,
                    "num_articles": row.NumArticles,
                    "quad_class": row.QuadClass,
                    "raw": dict(row.items())
                })
            except Exception as e:
                logger.warning(f"Failed to parse GDELT row: {e}")
                continue
        
        logger.info(f"Fetched {len(events)} GDELT events from BigQuery")
        return events
        
    except Exception as e:
        logger.error(f"BigQuery GDELT failed: {e}")
        logger.info("Falling back to REST API")
        return fetch_gdelt_rest(hours, max_records)


def fetch_gdelt_rest(hours=24, max_records=500):
    """Fallback to REST API if BigQuery not available."""
    import requests
    
    BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
    params = {
        "format": "json",
        "mode": "artlist",
        "timespan": f"{hours}h",
        "maxrecords": str(max_records),
    }
    
    logger.info(f"Fetching GDELT events via REST API (last {hours}h)")
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
    
    logger.info(f"Fetched {len(events)} GDELT events via REST API")
    return events


def fetch_gdelt(hours=24, max_records=2500):
    """
    Main entry point - tries BigQuery first, falls back to REST.
    For 15-min cron, use hours=1, max_records=1000 with BigQuery.
    """
    # Check if BigQuery credentials available
    if os.getenv("GCP_SERVICE_ACCOUNT_KEY"):
        # Always use BigQuery when credentials available (no rate limits)
        return fetch_gdelt_bigquery(hours=hours, max_records=max_records)
    else:
        return fetch_gdelt_rest(hours=hours, max_records=min(max_records, 500))