"""Brand CRUD + onboarding trigger."""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Brand, Keyword, SerpSnapshot, Threat, FingerprintStatus
from app.schemas import BrandCreate, BrandUpdate, BrandResponse
from app.services.onboarding import run_onboarding
from typing import List
import uuid

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("", response_model=List[BrandResponse])
async def list_brands(
    org_id: uuid.UUID,  # TODO: extract from JWT
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Brand).where(Brand.org_id == org_id).order_by(Brand.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=BrandResponse, status_code=201)
async def create_brand(
    body: BrandCreate,
    org_id: uuid.UUID,  # TODO: extract from JWT
    db: AsyncSession = Depends(get_db),
):
    brand = Brand(
        org_id=org_id,
        name=body.name,
        domain=body.domain.lower().strip(),
        aov=body.aov,
        conversion_rate=body.conversion_rate,
        fingerprint_status=FingerprintStatus.pending,
    )
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return brand


@router.post("/{brand_id}/onboard")
async def onboard_brand(
    brand_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger the full onboarding pipeline:
    1. Generate keyword candidates from brand name
    2. Query DataForSEO for search volume + CPC
    3. Store enriched keywords
    4. Run initial SERP sweep on top keywords
    5. Store SERP snapshots

    This runs synchronously for now — will move to Celery in production.
    """
    result = await run_onboarding(str(brand_id), db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.get("/{brand_id}/stats")
async def get_brand_stats(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get summary stats for a brand — keyword count, SERP snapshots, threats."""
    brand_result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = brand_result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    kw_count = await db.execute(
        select(func.count(Keyword.id)).where(Keyword.brand_id == brand_id, Keyword.is_active == True)
    )
    snap_count = await db.execute(
        select(func.count(SerpSnapshot.id))
        .join(Keyword, SerpSnapshot.keyword_id == Keyword.id)
        .where(Keyword.brand_id == brand_id)
    )
    threat_count = await db.execute(
        select(func.count(Threat.id)).where(Threat.brand_id == brand_id)
    )

    return {
        "brand_id": str(brand.id),
        "brand_name": brand.name,
        "domain": brand.domain,
        "fingerprint_status": brand.fingerprint_status.value if brand.fingerprint_status else "unknown",
        "keywords_active": kw_count.scalar() or 0,
        "serp_snapshots": snap_count.scalar() or 0,
        "threats": threat_count.scalar() or 0,
    }


@router.put("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: uuid.UUID,
    body: BrandUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    if body.aov is not None:
        brand.aov = body.aov
    if body.conversion_rate is not None:
        brand.conversion_rate = body.conversion_rate
    if body.default_ctr is not None:
        brand.default_ctr = body.default_ctr

    await db.commit()
    await db.refresh(brand)
    return brand


@router.post("/{brand_id}/refresh-fingerprint")
async def refresh_fingerprint(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    brand.fingerprint_status = FingerprintStatus.pending
    await db.commit()

    # TODO: Trigger re-crawl pipeline
    return {"status": "fingerprint refresh queued"}
