"""Quick setup endpoint for testing — creates an org and triggers onboarding."""
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db, async_session
from app.models import Organization, Brand, PlanTier, FingerprintStatus
from app.services.onboarding import run_onboarding
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/setup", tags=["setup"])


class QuickSetupRequest(BaseModel):
    org_name: str = "Brand Shield Demo"
    org_email: str = "demo@brandshield.io"
    brand_name: str
    brand_domain: str
    aov: Optional[float] = None
    conversion_rate: Optional[float] = None


async def _run_onboarding_bg(brand_id: str):
    async with async_session() as db:
        try:
            result = await run_onboarding(brand_id, db)
            logger.info(f"Onboarding complete: {result}")
        except Exception as e:
            logger.error(f"Onboarding failed: {e}")


@router.post("/quick-start")
async def quick_start(
    body: QuickSetupRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    One-shot setup: creates an org + brand and triggers the full onboarding pipeline.
    Use this to test the system end-to-end.
    """
    # Check if org exists
    result = await db.execute(
        select(Organization).where(Organization.email == body.org_email)
    )
    org = result.scalar_one_or_none()

    if not org:
        org = Organization(
            name=body.org_name,
            email=body.org_email,
            plan_tier=PlanTier.starter,
        )
        db.add(org)
        await db.commit()
        await db.refresh(org)

    # Create brand
    brand = Brand(
        org_id=org.id,
        name=body.brand_name,
        domain=body.brand_domain.lower().strip(),
        aov=Decimal(str(body.aov)) if body.aov else None,
        conversion_rate=Decimal(str(body.conversion_rate)) if body.conversion_rate else None,
        fingerprint_status=FingerprintStatus.pending,
    )
    db.add(brand)
    await db.commit()
    await db.refresh(brand)

    # Trigger onboarding in background
    background_tasks.add_task(_run_onboarding_bg, str(brand.id))

    return {
        "org_id": str(org.id),
        "brand_id": str(brand.id),
        "brand_name": brand.name,
        "brand_domain": brand.domain,
        "status": "onboarding_started",
        "message": f"Onboarding pipeline started for '{brand.name}'. Check GET /api/v1/brands/{brand.id} for status.",
    }


@router.post("/quick-start-sync")
async def quick_start_sync(
    body: QuickSetupRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Same as quick-start but waits for onboarding to complete.
    Takes 30-60 seconds. Returns full results.
    """
    result = await db.execute(
        select(Organization).where(Organization.email == body.org_email)
    )
    org = result.scalar_one_or_none()

    if not org:
        org = Organization(
            name=body.org_name,
            email=body.org_email,
            plan_tier=PlanTier.starter,
        )
        db.add(org)
        await db.commit()
        await db.refresh(org)

    brand = Brand(
        org_id=org.id,
        name=body.brand_name,
        domain=body.brand_domain.lower().strip(),
        aov=Decimal(str(body.aov)) if body.aov else None,
        conversion_rate=Decimal(str(body.conversion_rate)) if body.conversion_rate else None,
        fingerprint_status=FingerprintStatus.pending,
    )
    db.add(brand)
    await db.commit()
    await db.refresh(brand)

    # Run synchronously — waits for completion
    summary = await run_onboarding(str(brand.id), db)

    return {
        "org_id": str(org.id),
        **summary,
    }
