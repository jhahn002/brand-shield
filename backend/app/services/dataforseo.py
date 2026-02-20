"""DataForSEO API client — keyword volume + SERP data."""
import httpx
import base64
import logging
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
        data = await self._post("/keywords_data/google_ads/search_volume/live", payload)

        results = []
        for task in data.get("tasks") or []:
            if task.get("status_code") != 20000:
                continue
            for item in task.get("result") or []:
                results.append({
                    "keyword": item.get("keyword", ""),
                    "search_volume": item.get("search_volume") or 0,
                    "cpc": item.get("cpc") or 0,
                    "competition": item.get("competition") or 0,
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
        Get SERP results using the organic/advanced endpoint.
        This returns organic, paid, shopping, and other result types all in one call.
        Paid ads appear as type="paid" when Google is serving them.
        """
        payload = [{
            "keyword": keyword,
            "location_code": location_code,
            "language_code": language_code,
            "depth": depth,
        }]
        data = await self._post("/serp/google/organic/live/advanced", payload)

        paid = []
        organic = []
        shopping = []

        for task in data.get("tasks") or []:
            if task.get("status_code") != 20000:
                continue
            for result_set in task.get("result") or []:
                for item in result_set.get("items") or []:
                    item_type = item.get("type", "")

                    if item_type == "paid":
                        paid.append({
                            "position": item.get("rank_group"),
                            "title": item.get("title", ""),
                            "description": item.get("description", ""),
                            "url": item.get("url", ""),
                            "domain": item.get("domain", ""),
                            "display_url": item.get("breadcrumb", ""),
                        })
                    elif item_type == "organic":
                        organic.append({
                            "position": item.get("rank_group"),
                            "title": item.get("title", ""),
                            "description": item.get("description", ""),
                            "url": item.get("url", ""),
                            "domain": item.get("domain", ""),
                        })
                    elif item_type in ("shopping", "commercial"):
                        shopping.append({
                            "title": item.get("title", ""),
                            "price": item.get("price", ""),
                            "merchant": item.get("seller", ""),
                            "url": item.get("url", ""),
                            "domain": item.get("domain", ""),
                        })

        logger.info(f"SERP '{keyword}': {len(paid)} paid, {len(organic)} organic, {len(shopping)} shopping")
        return {
            "keyword": keyword,
            "paid": paid,
            "organic": organic,
            "shopping": shopping,
        }


def get_dataforseo_client() -> DataForSEOClient:
    return DataForSEOClient()
