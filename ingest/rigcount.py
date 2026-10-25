import requests
import pandas as pd
import logging
from io import StringIO

logger = logging.getLogger(__name__)

def fetch_rigcount():
    url = "https://rigcount.bakerhughes.com/static-files/9e/9e8f4f4c-4d4f-4a4b-8e4f-4f4c4d4f4a4b.csv"
    try:
        r = requests.get(url, timeout=30)
        df = pd.read_csv(StringIO(r.text))
        return df.to_dict("records")
    except Exception as e:
        logger.error(f"RigCount error: {e}")
        return []