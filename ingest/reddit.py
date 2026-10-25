import requests
import logging

logger = logging.getLogger(__name__)

def fetch_reddit(subreddits="geopolitics+worldnews+news+energy+oil+trade", limit=100):
    url = f"https://www.reddit.com/r/{subreddits}/hot.json"
    params = {"limit": limit, "raw_json": 1}
    headers = {"User-Agent": "WorldMonitor/1.0"}
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=30)
        r.raise_for_status()
        posts = []
        for p in r.json()["data"]["children"]:
            d = p["data"]
            posts.append({
                "id": d["id"],
                "title": d["title"],
                "url": f"https://reddit.com{d['permalink']}",
                "score": d["score"],
                "subreddit": d["subreddit"],
                "created": d["created_utc"],
                "source": "reddit",
                "comments": d["num_comments"]
            })
        return posts
    except Exception as e:
        logger.error(f"Reddit error: {e}")
        return []