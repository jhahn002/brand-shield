"""Brand onboarding pipeline — keyword generation + initial SERP sweep."""
import re
from typing import List, Tuple
from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import (
    Brand, Keyword, KeywordType, SerpSnapshot,
    FingerprintStatus,
)
from app.services.dataforseo import get_dataforseo_client


# ── Keyword Generation ────────────────────────────────

# Common modifiers to combine with brand name
BRAND_MODIFIERS = [
    "buy {brand}",
    "{brand} official",
    "{brand} official site",
    "{brand} website",
    "{brand} discount",
    "{brand} discount code",
    "{brand} coupon",
    "{brand} coupon code",
    "{brand} promo code",
    "{brand} reviews",
    "{brand} review",
    "{brand} legit",
    "{brand} scam",
    "{brand} alternative",
    "{brand} vs",
    "is {brand} legit",
    "{brand} sale",
    "{brand} deals",
    "{brand} free shipping",
    "{brand} shop",
    "{brand} store",
    "{brand} online",
]

# Common misspellings generated via simple character swaps
def generate_misspellings(brand: str) -> List[str]:
    """Generate common misspellings using character substitutions."""
    misspellings = set()
    brand_lower = brand.lower()

    # Adjacent key swaps
    for i in range(len(brand_lower) - 1):
        swapped = list(brand_lower)
        swapped[i], swapped[i + 1] = swapped[i + 1], swapped[i]
        result = "".join(swapped)
        if result != brand_lower:
            misspellings.add(result)

    # Missing characters
    for i in range(len(brand_lower)):
        result = brand_lower[:i] + brand_lower[i + 1:]
        if len(result) >= 3:
            misspellings.add(result)

    # Double characters
    for i in range(len(brand_lower)):
        result = brand_lower[:i] + brand_lower[i] + brand_lower[i:]
        misspellings.add(result)

    return list(misspellings)[:10]  # Cap at 10


def classify_keyword(term: str, brand_name: str) -> KeywordType:
    """Classify a keyword into its type."""
    brand_lower = brand_name.lower()
    term_lower = term.lower()

    if term_lower == brand_lower:
        return KeywordType.exact_brand
    elif brand_lower in term_lower and len(term_lower) > len(brand_lower):
        return KeywordType.brand_modifier
    else:
        return KeywordType.misspelling


def generate_keyword_candidates(brand_name: str) -> List[Tuple[str, KeywordType]]:
    """Generate keyword candidates from brand name + modifiers."""
    candidates = []

    # Exact brand
    candidates.append((brand_name.lower(), KeywordType.exact_brand))

    # Brand modifiers
    for template in BRAND_MODIFIERS:
        term = template.format(brand=brand_name.lower())
        candidates.append((term, KeywordType.brand_modifier))

    # Misspellings
    for misspelling in generate_misspellings(brand_name):
        candidates.append((misspelling, KeywordType.misspelling))

    # Deduplicate
    seen = set()
    unique = []
    for term, ktype in candidates:
        if term not in seen:
            seen.add(term)
            unique.append((term, ktype))

    return unique


# ── Full Onboarding Pipeline ──────────────────────────

async def run_onboarding(brand_id: str, db: AsyncSession) -> dict:
    """
    Full onboarding pipeline for a new brand:
    1. Generate keyword candidates
    2. Query DataForSEO for search volume + CPC
    3. Store keywords in database
    4. Run initial SERP sweep for top keywords
    5. Store SERP snapshots
    """
    from sqlalchemy import select

    # Load brand
    result = await db.execute(
        select(Brand).where(Brand.id == brand_id)
    )
    brand = result.scalar_one_or_none()
    if not brand:
        return {"error": "Brand not found"}

    brand.fingerprint_status = FingerprintStatus.processing
    await db.commit()

    client = get_dataforseo_client()

    # Step 1: Generate keyword candidates
    candidates = generate_keyword_candidates(brand.name)
    all_terms = [term for term, _ in candidates]
    type_map = {term: ktype for term, ktype in candidates}

    # Step 2: Get search volume from DataForSEO
    try:
        volume_data = await client.get_search_volume(all_terms)
    except Exception as e:
        brand.fingerprint_status = FingerprintStatus.failed
        await db.commit()
        return {"error": f"DataForSEO volume lookup failed: {str(e)}"}

    # Build lookup
    volume_lookup = {v["keyword"]: v for v in volume_data}

    # Step 3: Create keyword records
    keywords_created = 0
    keywords_with_volume = []

    for term, ktype in candidates:
        vol_info = volume_lookup.get(term, {})
        monthly_volume = vol_info.get("search_volume", 0)
        cpc = vol_info.get("cpc", 0)

        # Skip keywords with zero volume (except exact brand)
        if monthly_volume == 0 and ktype != KeywordType.exact_brand:
            continue

        # Calculate initial priority score
        priority = calculate_initial_priority(monthly_volume, ktype)

        kw = Keyword(
            brand_id=brand.id,
            term=term,
            keyword_type=ktype,
            monthly_volume=monthly_volume,
            avg_cpc=Decimal(str(round(cpc, 2))),
            priority_score=Decimal(str(round(priority, 2))),
            check_interval_hours=priority_to_interval(priority),
            is_active=True,
        )
        db.add(kw)
        keywords_created += 1

        if monthly_volume > 0:
            keywords_with_volume.append(term)

    await db.commit()

    # Step 4: Initial SERP sweep (top 5 keywords by volume)
    serp_keywords = sorted(
        [(t, volume_lookup.get(t, {}).get("search_volume", 0)) for t in keywords_with_volume],
        key=lambda x: x[1],
        reverse=True,
    )[:5]

    serp_results = []
    for term, _ in serp_keywords:
        try:
            serp_data = await client.get_serp(term)
            # Find the keyword record
            kw_result = await db.execute(
                select(Keyword).where(
                    Keyword.brand_id == brand.id,
                    Keyword.term == term,
                )
            )
            kw = kw_result.scalar_one_or_none()
            if kw:
                snapshot = SerpSnapshot(
                    keyword_id=kw.id,
                    checked_at=datetime.utcnow(),
                    geo_target="US",
                    paid_results=serp_data.get("paid", []),
                    organic_results=serp_data.get("organic", []),
                    shopping_results=serp_data.get("shopping", []),
                    flagged_count=0,  # TODO: implement flagging logic
                )
                db.add(snapshot)
                kw.last_checked_at = datetime.utcnow()
                serp_results.append({
                    "keyword": term,
                    "paid_count": len(serp_data.get("paid", [])),
                    "organic_count": len(serp_data.get("organic", [])),
                    "shopping_count": len(serp_data.get("shopping", [])),
                })
        except Exception as e:
            serp_results.append({"keyword": term, "error": str(e)})

    await db.commit()

    # Step 5: Update brand status
    brand.fingerprint_status = FingerprintStatus.complete
    brand.last_crawl_at = datetime.utcnow()
    await db.commit()

    return {
        "brand_id": str(brand.id),
        "brand_name": brand.name,
        "keywords_generated": len(candidates),
        "keywords_with_volume": len(keywords_with_volume),
        "keywords_stored": keywords_created,
        "serp_results": serp_results,
    }


def calculate_initial_priority(volume: int, ktype: KeywordType) -> float:
    """Calculate initial priority score (0-100) based on volume and type."""
    import math

    # Base score from volume (log-scaled, 0-60)
    if volume > 0:
        volume_score = min(60, math.log10(volume + 1) * 15)
    else:
        volume_score = 5  # Small base for exact brand with no volume data

    # Type bonus (0-40)
    type_bonus = {
        KeywordType.exact_brand: 40,
        KeywordType.brand_modifier: 20,
        KeywordType.product: 15,
        KeywordType.misspelling: 10,
        KeywordType.long_tail: 5,
    }

    return min(100, volume_score + type_bonus.get(ktype, 10))


def priority_to_interval(priority: float) -> int:
    """Map priority score to check interval in hours."""
    if priority >= 90:
        return 12
    elif priority >= 70:
        return 24
    elif priority >= 50:
        return 48
    elif priority >= 30:
        return 72
    elif priority >= 10:
        return 168  # weekly
    else:
        return 720  # monthly
