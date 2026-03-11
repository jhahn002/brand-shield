"""Threat listing, detail, dismiss, and takedown initiation."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Threat, ThreatEvidence, Takedown, ThreatStatus, Keyword, SerpSnapshot
from app.schemas import ThreatResponse, ThreatDismiss, TakedownResponse
from typing import List, Optional
import uuid

router = APIRouter(prefix="/threats", tags=["threats"])


def _enrich_threat(threat: Threat, keyword_volume: Optional[int], ad_position: Optional[int]) -> dict:
    """Convert a Threat ORM object to a dict with enriched keyword data."""
    return {
        "id": threat.id,
        "domain": threat.domain,
        "threat_type": threat.threat_type,
        "severity_score": threat.severity_score,
        "status": threat.status,
        "revenue_at_risk_monthly": threat.revenue_at_risk_monthly,
        "first_seen_at": threat.first_seen_at,
        "last_seen_at": threat.last_seen_at,
        "keyword_volume": keyword_volume,
        "ad_position": ad_position,
    }


async def _get_keyword_data(db: AsyncSession, brand_id: uuid.UUID, threat_domain: str):
    """Look up the best keyword volume and ad position for a threat domain."""
    # Find the most recent SERP snapshot that flagged this domain
    # and return the keyword volume from the associated keyword
    keywords_result = await db.execute(
        select(Keyword).where(
            Keyword.brand_id == brand_id,
            Keyword.is_active == True
        ).order_by(Keyword.monthly_volume.desc())
    )
    keywords = keywords_result.scalars().all()

    best_volume = None
    best_position = None

    for kw in keywords:
        # Check if any SERP snapshot for this keyword contains the threat domain
        snap_result = await db.execute(
            select(SerpSnapshot).where(
                SerpSnapshot.keyword_id == kw.id
            ).order_by(SerpSnapshot.checked_at.desc()).limit(5)
        )
        snaps = snap_result.scalars().all()
        for snap in snaps:
            # Check paid results
            for r in (snap.paid_results or []):
                url = str(r.get("url", "") or r.get("display_url", "")).lower()
                if threat_domain.lower() in url:
                    if best_volume is None or kw.monthly_volume > best_volume:
                        best_volume = kw.monthly_volume
                        best_position = r.get("position", 2)
            # Check organic results
            for r in (snap.organic_results or []):
                url = str(r.get("url", "")).lower()
                if threat_domain.lower() in url:
                    if best_volume is None or kw.monthly_volume > best_volume:
                        best_volume = kw.monthly_volume
                        best_position = r.get("position", 3)

    # Fallback: use highest volume keyword for the brand if no match found
    if best_volume is None and keywords:
        best_volume = keywords[0].monthly_volume
        best_position = 3

    return best_volume, best_position


@router.get("/by-brand/{brand_id}")
async def list_threats(
    brand_id: uuid.UUID,
    status: Optional[str] = None,
    min_severity: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Threat).where(Threat.brand_id == brand_id)
    if status:
        query = query.where(Threat.status == status)
    if min_severity:
        query = query.where(Threat.severity_score >= min_severity)
    query = query.order_by(Threat.severity_score.desc())
    result = await db.execute(query)
    threats = result.scalars().all()

    enriched = []
    for threat in threats:
        vol, pos = await _get_keyword_data(db, brand_id, threat.domain)
        enriched.append(_enrich_threat(threat, vol, pos))

    return enriched


@router.get("/{threat_id}")
async def get_threat(threat_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Threat).where(Threat.id == threat_id))
    threat = result.scalar_one_or_none()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")

    vol, pos = await _get_keyword_data(db, threat.brand_id, threat.domain)
    return _enrich_threat(threat, vol, pos)


@router.get("/{threat_id}/evidence")
async def get_evidence(threat_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ThreatEvidence).where(ThreatEvidence.threat_id == threat_id)
        .order_by(ThreatEvidence.captured_at.desc())
    )
    return result.scalars().all()


@router.post("/{threat_id}/dismiss")
async def dismiss_threat(
    threat_id: uuid.UUID,
    body: ThreatDismiss,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Threat).where(Threat.id == threat_id))
    threat = result.scalar_one_or_none()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    threat.status = ThreatStatus.dismissed
    threat.dismissed_reason = body.reason
    await db.commit()
    return {"status": "dismissed"}


@router.post("/{threat_id}/takedown")
async def initiate_takedown(threat_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Threat).where(Threat.id == threat_id))
    threat = result.scalar_one_or_none()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    threat.status = ThreatStatus.takedown_pending
    await db.commit()
    return {"status": "takedown initiated", "threat_id": str(threat_id)}


@router.get("/{threat_id}/takedowns", response_model=List[TakedownResponse])
async def list_takedowns(threat_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Takedown).where(Takedown.threat_id == threat_id)
        .order_by(Takedown.created_at.desc())
    )
    return result.scalars().all()
