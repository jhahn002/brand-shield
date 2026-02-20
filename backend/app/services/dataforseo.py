"""DataForSEO API client — keyword volume + SERP data (paid, organic, shopping)."""
import httpx
import base64
import logging
import asyncio
from typing import List, Dict
from app.config import get_settings

logger = logging.getLogger(__name__)


class DataForSEOClient:
    BASE_URL = "https://api.dataforseo.com/v3"

    def __init__(self):
        settings = get_settings()
        self.login = settings.dataforseo_login
        self.password = settings.dataforseo_password
        credentials = base64.b64encode(
            f"{self.login}:{self.password}".encode()
        ).decode()
        self.headers = {
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
        }
        logger.info(f"DataForSEO client initialized for login: {self.login[:3]}***")

    async def _post(self, endpoint: str, payload: list) -> dict:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.BASE_URL}{endpoint}",
                json=payload,
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    async def get_search_volume(
        self,
        keywords: List[str],
        location_code: int = 2840,
        language_code: str = "en",
    ) -> List[Dict]:
        payload = [{
            "keywords": keywords[:1000],
            "location_code": location_code,
            "language_code": language_code,
        }]

        data = await self._post(
            "/keywords_data/google_ads/search_volume/live",
            payload,
        )

        results = []
        tasks = data.get("tasks") or []
        for task in tasks:
            if task.get("status_code") != 20000:
                logger.warning(f"Search volume task failed: {task.get('status_message')}")
                continue
            for item in task.get("result") or []:
                results.append({
                    "keyword": item.get("keyword", ""),
                    "search_volume": item.get("search_volume") or 0,
                    "cpc": item.get("cpc") or 0,
                    "competition": item.get("competition") or 0,
                })

        return results

    async def _get_organic(self, keyword: str, location_code: int, language_code: str, depth: int) -> List[Dict]:
        """Fetch organic SERP results."""
        payload = [{
            "keyword": keyword,
            "location_code": location_code,
            "language_code": language_code,
            "depth": depth,
        }]
        data = await self._post("/serp/google/organic/live/advanced", payload)
        
        results = []
        for task in data.get("tasks") or []:
            if task.get("status_code") != 20000:
                continue
            for result_set in task.get("result") or []:
                for item in result_set.get("items") or []:
                    if item.get("type") == "organic":
                        results.append({
                            "position": item.get("rank_group"),
                            "title": item.get("title", ""),
                            "description": item.get("description", ""),
                            "url": item.get("url", ""),
                            "domain": item.get("domain", ""),
                        })
        return results

    async def _get_paid(self, keyword: str, location_code: int, language_code: str) -> List[Dict]:
        """Fetch paid ad results."""
        payload = [{
            "keyword": keyword,
            "location_code": location_code,
            "language_code": language_code,
            "depth": 10,
        }]
        data = await self._post("/serp/google/paid/live/regular", payload)
        
        results = []
        for task in data.get("tasks") or []:
            if task.get("status_code") != 20000:
                continue
            for result_set in task.get("result") or []:
                for item in result_set.get("items") or []:
                    if item.get("type") == "paid":
                        results.append({
                            "position": item.get("rank_group"),
                            "title": item.get("title", ""),
                            "description": item.get("description", ""),
                            "url": item.get("url", ""),
                            "domain": item.get("domain", ""),
                            "display_url": item.get("breadcrumb", ""),
                        })
        return results

    async def get_serp(
        self,
        keyword: str,
        location_code: int = 2840,
        language_code: str = "en",
        depth: int = 30,
    ) -> Dict:
        """
        Get full SERP results: organic + paid ads, run in parallel.
        """
        organic_task = self._get_organic(keyword, location_code, language_code, depth)
        paid_task = self._get_paid(keyword, location_code, language_code)
        
        organic, paid = await asyncio.gather(organic_task, paid_task, return_exceptions=True)
        
        # Handle any exceptions from parallel calls
        if isinstance(organic, Exception):
            logger.error(f"Organic SERP failed for '{keyword}': {organic}")
            organic = []
        if isinstance(paid, Exception):
            logger.error(f"Paid SERP failed for '{keyword}': {paid}")
            paid = []

        logger.info(f"SERP for '{keyword}': {len(paid)} paid, {len(organic)} organic")
        return {
            "keyword": keyword,
            "paid": paid,
            "organic": organic,
            "shopping": [],  # Shopping requires separate Google Shopping endpoint
        }


def get_dataforseo_client() -> DataForSEOClient:
    """Create a fresh client each time."""
    return DataForSEOClient()
