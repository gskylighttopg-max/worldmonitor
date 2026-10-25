import os
import requests
import logging
import json

logger = logging.getLogger(__name__)

class KVClient:
    def __init__(self):
        self.account_id = os.getenv("CF_ACCOUNT_ID")
        self.api_token = os.getenv("CF_API_TOKEN")
        self.namespace_id = os.getenv("CF_KV_NAMESPACE_ID")
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/storage/kv/namespaces/{self.namespace_id}"
        self.headers = {"Authorization": f"Bearer {self.api_token}", "Content-Type": "application/json"}
    
    def put(self, key, value, expiration_ttl=None):
        url = f"{self.base_url}/values/{key}"
        params = {}
        if expiration_ttl:
            params["expiration_ttl"] = expiration_ttl
        try:
            r = requests.put(url, headers=self.headers, data=value, params=params, timeout=10)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error(f"KV put failed for {key}: {e}")
            raise
    
    def get(self, key):
        url = f"{self.base_url}/values/{key}"
        try:
            r = requests.get(url, headers=self.headers, timeout=10)
            if r.status_code == 404:
                return None
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error(f"KV get failed for {key}: {e}")
            raise
    
    def delete(self, key):
        url = f"{self.base_url}/values/{key}"
        try:
            r = requests.delete(url, headers=self.headers, timeout=10)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error(f"KV delete failed for {key}: {e}")
            raise
    
    def list_keys(self, prefix=None, limit=1000):
        url = f"{self.base_url}/keys"
        params = {"limit": limit}
        if prefix:
            params["prefix"] = prefix
        try:
            r = requests.get(url, headers=self.headers, params=params, timeout=10)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error(f"KV list failed: {e}")
            raise