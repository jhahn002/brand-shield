"""Threat listing, detail, dismiss, and takedown initiation."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Threat, ThreatEvidence, Takedown, ThreatStatus
from app.schemas import ThreatResponse, ThreatDismiss, TakedownResponse
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/threats", tags=["threats"])


@router.get("/by-brand/{brand_id}", response_model=List[ThreatResponse])
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
    return result.scalars().all()


@router.get("/{threat_id}", response_model=ThreatResponse)
async def get_threat(threat_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Threat).where(Threat.id == threat_id))
    threat = result.scalar_one_or_none()
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    return threat


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

    # TODO: Auto-determine applicable channels and create Takedown records
    # TODO: Generate complaint templates per channel

    return {"status": "takedown initiated", "threat_id": str(threat_id)}


@router.get("/{threat_id}/takedowns", response_model=List[TakedownResponse])
async def list_takedowns(threat_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Takedown).where(Takedown.threat_id == threat_id)
        .order_by(Takedown.created_at.desc())
    )
    return result.scalars().all()
