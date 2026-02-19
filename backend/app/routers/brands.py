"""Brand CRUD + onboarding trigger."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Brand, Organization, BrandFingerprint, FingerprintStatus
from app.schemas import BrandCreate, BrandUpdate, BrandResponse
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

    # TODO: Trigger onboarding pipeline (Celery task)
    # tasks.onboard_brand.delay(str(brand.id))

    return brand


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


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
    # tasks.recrawl_brand.delay(str(brand.id))

    return {"status": "fingerprint refresh queued"}
