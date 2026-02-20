"""Debug endpoints to inspect raw DataForSEO data and threat analysis."""
from fastapi import APIRouter
from app.services.dataforseo import get_dataforseo_client
from app.services.threat_analyzer import analyze_serp_data
from app.config import get_settings
from pydantic import BaseModel
import httpx
import base64

router = APIRouter(prefix="/debug", tags=["debug"])


class SerpDebugRequest(BaseModel):
    keyword: str
    brand_name: str = ""
    brand_domain: str = ""


@router.post("/raw-serp")
async def raw_serp(body: SerpDebugRequest):
    """Get raw SERP data from DataForSEO — shows the FULL unprocessed API response."""
    settings = get_settings()
    creds = f"{settings.dataforseo_login}:{settings.dataforseo_password}"
    encoded = base64.b64encode(creds.encode()).decode()
    headers = {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json",
    }

    payload = [{
        "keyword": body.keyword,
        "location_code": 2840,
        "language_code": "en",
        "depth": 30,
    }]

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
            json=payload,
            headers=headers,
        )
        raw = resp.json()

    # Extract key info for debugging
    task = raw.get("tasks", [{}])[0] if raw.get("tasks") else {}
    
    return {
        "keyword": body.keyword,
        "http_status": resp.status_code,
        "api_version": raw.get("version"),
        "status_code": raw.get("status_code"),
        "status_message": raw.get("status_message"),
        "task_status_code": task.get("status_code"),
        "task_status_message": task.get("status_message"),
        "task_cost": task.get("cost"),
        "result_count": task.get("result_count"),
        "results": task.get("result"),
    }


@router.post("/analyze-serp")
async def analyze_serp(body: SerpDebugRequest):
    """Get SERP data AND run threat analysis."""
    client = get_dataforseo_client()
    serp_data = await client.get_serp(body.keyword)
    
    threats = []
    if body.brand_name and body.brand_domain:
        signals = analyze_serp_data(serp_data, body.brand_name, body.brand_domain)
        threats = [
            {
                "domain": s.domain,
                "type": s.threat_type,
                "severity": s.severity_score,
                "reason": s.reason,
                "title": s.title,
                "url": s.url,
            }
            for s in signals
        ]
    
    return {
        "keyword": body.keyword,
        "paid_count": len(serp_data["paid"]),
        "organic_count": len(serp_data["organic"]),
        "shopping_count": len(serp_data["shopping"]),
        "threats_found": len(threats),
        "threats": threats,
        "raw_paid": serp_data["paid"],
        "raw_organic_top5": serp_data["organic"][:5],
        "raw_shopping": serp_data["shopping"],
    }
