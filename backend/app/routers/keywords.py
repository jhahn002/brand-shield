"""Keyword management — list, add, update."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Keyword, KeywordType
from app.schemas import KeywordCreate, KeywordResponse
from typing import List
import uuid

router = APIRouter(tags=["keywords"])


@router.get("/brands/{brand_id}/keywords", response_model=List[KeywordResponse])
async def list_keywords(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Keyword).where(Keyword.brand_id == brand_id)
        .order_by(Keyword.priority_score.desc())
    )
    return result.scalars().all()


@router.post("/brands/{brand_id}/keywords", status_code=201)
async def add_keywords(
    brand_id: uuid.UUID,
    body: KeywordCreate,
    db: AsyncSession = Depends(get_db),
):
    created = []
    for term in body.terms:
        kw = Keyword(
            brand_id=brand_id,
            term=term.strip().lower(),
            keyword_type=KeywordType.long_tail,
        )
        db.add(kw)
        created.append(term.strip().lower())

    await db.commit()

    # TODO: Trigger DataForSEO volume lookup for new keywords
    # tasks.enrich_keywords.delay(brand_id, created)

    return {"added": len(created), "terms": created}


@router.put("/keywords/{keyword_id}")
async def update_keyword(
    keyword_id: uuid.UUID,
    is_active: bool = True,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Keyword).where(Keyword.id == keyword_id))
    kw = result.scalar_one_or_none()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")

    kw.is_active = is_active
    await db.commit()
    return {"status": "updated"}
