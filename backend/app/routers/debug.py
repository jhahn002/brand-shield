"""Debug endpoints to inspect raw DataForSEO data and threat analysis."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.services.dataforseo import get_dataforseo_client
from app.services.threat_analyzer import analyze_serp_data
from pydantic import BaseModel

router = APIRouter(prefix="/debug", tags=["debug"])


class SerpDebugRequest(BaseModel):
    keyword: str
    brand_name: str = ""
    brand_domain: str = ""


@router.post("/raw-serp")
async def raw_serp(body: SerpDebugRequest):
    """Get raw SERP data from DataForSEO for a keyword. Shows exactly what the API returns."""
    client = get_dataforseo_client()
    serp_data = await client.get_serp(body.keyword)
    
    return {
        "keyword": body.keyword,
        "paid_count": len(serp_data["paid"]),
        "organic_count": len(serp_data["organic"]),
        "shopping_count": len(serp_data["shopping"]),
        "paid": serp_data["paid"],
        "organic": serp_data["organic"][:10],  # First 10 organic
        "shopping": serp_data["shopping"],
    }


@router.post("/analyze-serp")
async def analyze_serp(body: SerpDebugRequest):
    """Get SERP data AND run threat analysis. Shows what gets flagged and why."""
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
