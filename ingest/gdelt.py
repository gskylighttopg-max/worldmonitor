import os
import json
import logging
from datetime import datetime, timedelta
from google.cloud import bigquery

logger = logging.getLogger(__name__)

def fetch_gdelt_bigquery(hours=1, max_records=1000, project_id=None):
    """
    Fetch GDELT events from BigQuery for the last N hours.
    Uses default credentials (from GOOGLE_APPLICATION_CREDENTIALS env var).
    """
    try:
        project_id = project_id or os.getenv("GCP_PROJECT_ID")
        
        # Use default credentials (picked up from GOOGLE_APPLICATION_CREDENTIALS)
        client = bigquery.Client(project=project_id)
        
        # Calculate time window
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        # Query GDELT events table
        # DATEADDED is INT64 in format YYYYMMDDHHMMSS
        start_ts = int(start_time.strftime('%Y%m%d%H%M%S'))
        query = f"""
        SELECT
            GLOBALEVENTID as id,
            SQLDATE as day,
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
                lat = row.get('ActionGeo_Lat') or row.get('Actor1Geo_Lat')
                lng = row.get('ActionGeo_Long') or row.get('Actor1Geo_Long')
                country = row.get('ActionGeo_CountryCode') or row.get('Actor1Geo_CountryCode')
                location_name = row.get('ActionGeo_FullName') or row.get('Actor1Geo_FullName')
                
                global_event_id = row.get('id')  # This is GLOBALEVENTID from query alias
                
                # Build descriptive title from GDELT data
                # BigQuery Row objects support dict-style access via row['column'] or attribute access row.column
                actor1 = row.get('Actor1Name') or row.get('actor1name') or row.get('actor1_name') or 'Unknown Actor'
                actor2 = row.get('Actor2Name') or row.get('actor2name') or row.get('actor2_name') or 'Unknown Actor'
                event_code = row.get('EventCode') or row.get('eventcode') or row.get('event_code')
                
                # Create descriptive title: "Actor1 vs Actor2 (EventCode)"
                if actor1 and actor2 and actor1 != 'Unknown Actor' and actor2 != 'Unknown Actor':
                    title = f"{actor1} vs {actor2}"
                    if event_code:
                        title += f" ({event_code})"
                elif event_code:
                    title = f"GDELT Event: {event_code}"
                else:
                    title = "GDELT Event"
                
                events.append({
                    "id": str(global_event_id) if global_event_id else row.get('SOURCEURL') or row.get('sourceurl') or "",
                    "title": title,
                    "url": row.get('SOURCEURL') or row.get('sourceurl') or "",
                    "source": "GDELT",
                    "published": datetime.strptime(str(row.get('DATEADDED') or row.get('dateadded')), "%Y%m%d%H%M%S").isoformat() + "Z" if row.get('DATEADDED') or row.get('dateadded') else datetime.utcnow().isoformat() + "Z",
                    "language": "",
                    "sentiment": float(row.get('AvgTone') or row.get('avgtone') or 0.0),
                    "themes": [],
                    "locations": location_name or "",
                    "source_country": country or "",
                    "lat": float(lat) if lat else None,
                    "lng": float(lng) if lng else None,
                    "actor1": actor1,
                    "actor2": actor2,
                    "event_code": event_code,
                    "goldstein_scale": float(row.get('GoldsteinScale') or row.get('goldsteinscale') or None),
                    "num_mentions": row.get('NumMentions') or row.get('nummentions'),
                    "num_sources": row.get('NumSources') or row.get('numsources'),
                    "num_articles": row.get('NumArticles') or row.get('numarticles'),
                    "quad_class": row.get('QuadClass') or row.get('quadclass'),
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
    # Check if BigQuery credentials available (via GOOGLE_APPLICATION_CREDENTIALS or GCP_SERVICE_ACCOUNT_KEY)
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GCP_SERVICE_ACCOUNT_KEY"):
        # Always use BigQuery when credentials available (no rate limits)
        return fetch_gdelt_bigquery(hours=hours, max_records=max_records)
    else:
        return fetch_gdelt_rest(hours=hours, max_records=min(max_records, 500))