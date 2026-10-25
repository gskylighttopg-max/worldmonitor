import asyncio
import json
import os
import logging
import websockets

logger = logging.getLogger(__name__)

AISSTREAM_KEY = os.getenv("AISSTREAM_KEY")

async def fetch_ais_stream(bbox=None, max_messages=100, timeout=30):
    """
    Fetch live AIS vessel data from AISStream.io WebSocket.
    Returns list of vessel position messages.
    """
    if not AISSTREAM_KEY:
        logger.warning("AISSTREAM_KEY not set, skipping AIS stream")
        return []
    
    url = "wss://stream.aisstream.io/v0/stream"
    
    # Default bbox covers major chokepoints
    if bbox is None:
        bbox = [[-180, -90], [180, 90]]  # Global
    
    subscribe_msg = {
        "APIKey": AISSTREAM_KEY,
        "BoundingBoxes": [bbox],
        "Filters": {
            "ShipTypes": [30, 31, 32, 33, 34, 35, 36, 37, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89]
        }
    }
    
    vessels = []
    
    try:
        async with websockets.connect(url, timeout=timeout) as ws:
            await ws.send(json.dumps(subscribe_msg))
            
            count = 0
            async for message in ws:
                try:
                    data = json.loads(message)
                    if "Message" in data and "PositionReport" in data["Message"]:
                        pos = data["Message"]["PositionReport"]
                        vessels.append({
                            "mmsi": pos.get("MMSI"),
                            "lat": pos.get("Latitude"),
                            "lng": pos.get("Longitude"),
                            "speed": pos.get("Speed"),
                            "course": pos.get("Course"),
                            "heading": pos.get("Heading"),
                            "timestamp": pos.get("Timestamp"),
                            "ship_type": pos.get("ShipType"),
                            "draught": pos.get("Draught"),
                            "destination": data["MetaData"].get("Destination"),
                            "eta": data["MetaData"].get("ETA"),
                            "source": "AISStream"
                        })
                        count += 1
                        if count >= max_messages:
                            break
                except Exception as e:
                    logger.warning(f"Error parsing AIS message: {e}")
                    continue
                    
    except asyncio.TimeoutError:
        logger.warning("AIS stream timeout")
    except Exception as e:
        logger.error(f"AIS stream error: {e}")
    
    logger.info(f"Fetched {len(vessels)} AIS vessel positions")
    return vessels


def fetch_ais_rest(max_records=100):
    """
    Fallback REST-style fetch (if WebSocket unavailable).
    Note: AISStream primarily uses WebSocket; this is a placeholder.
    """
    logger.warning("AIS REST fallback not implemented - AISStream uses WebSocket only")
    return []


# Synchronous wrapper for run_all.py compatibility
def fetch_ais(max_messages=50):
    """Synchronous wrapper for run_all.py"""
    try:
        return asyncio.run(fetch_ais_stream(max_messages=max_messages))
    except Exception as e:
        logger.error(f"AIS fetch failed: {e}")
        return []


if __name__ == "__main__":
    # Test run
    logging.basicConfig(level=logging.INFO)
    vessels = asyncio.run(fetch_ais_stream(max_messages=10))
    print(json.dumps(vessels, indent=2))