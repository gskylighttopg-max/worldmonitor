import re

def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def extract_entities(text):
    # Simple entity extraction - extend with spaCy if needed
    entities = {
        "countries": [],
        "organizations": [],
        "people": []
    }
    # Add known entity patterns here
    return entities

def normalize_url(url):
    if not url:
        return ""
    # Remove tracking params, AMP, etc.
    tracking_params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                       'fbclid', 'gclid', 'ref', 'source', 'amp']
    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    filtered = {k: v for k, v in query.items() if k.lower() not in tracking_params}
    new_query = urlencode(filtered, doseq=True)
    return urlunparse(parsed._replace(query=new_query))

def haversine(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, sqrt, asin
    R = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return 2 * R * asin(sqrt(a))

def cluster_events(events, max_distance_km=50, time_window_hours=6):
    # Simple clustering by proximity and time
    clusters = []
    used = set()
    
    for i, event in enumerate(events):
        if i in used:
            continue
        
        cluster = [event]
        used.add(i)
        
        for j, other in enumerate(events):
            if j in used or i == j:
                continue
            
            # Check time proximity
            try:
                from datetime import datetime
                t1 = datetime.fromisoformat(event.get("published", "").replace("Z", "+00:00"))
                t2 = datetime.fromisoformat(other.get("published", "").replace("Z", "+00:00"))
                if abs((t1 - t2).total_seconds()) > time_window_hours * 3600:
                    continue
            except:
                continue
            
            # Check geographic proximity
            try:
                lat1, lon1 = float(event.get("lat", 0)), float(event.get("lng", 0))
                lat2, lon2 = float(other.get("lat", 0)), float(other.get("lng", 0))
                if haversine(lat1, lon1, lat2, lon2) <= max_distance_km:
                    cluster.append(other)
                    used.add(j)
            except:
                continue
        
        if len(cluster) > 1:
            clusters.append(cluster)
    
    return clusters