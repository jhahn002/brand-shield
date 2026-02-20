"""
Brand onboarding pipeline.

When a brand is created, this service:
1. Generates keyword candidates from brand name + modifiers
2. Fetches search volume/CPC from DataForSEO
3. Filters out low-volume keywords
4. Stores keywords in the database
5. Runs the initial SERP sweep
6. Stores SERP snapshots and flags potential threats
"""
import logging
import math
from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import (
    Brand, Keyword, KeywordType, SerpSnapshot,
    Threat, ThreatType, ThreatStatus, FingerprintStatus
)
from app.services.keyword_generator import generate_keywords
from app.services.dataforseo import get_dataforseo_client

logger = logging.getLogger(__name__)

MIN_VOLUME_THRESHOLD = 10


def priority_to_interval(score: float) -> int:
    if score >= 90:
        return 12
    elif score >= 70:
        return 24
    elif score >= 50:
        return 48
    elif score >= 30:
        return 72
    elif score >= 10:
        return 168
    else:
        return 720


def calculate_initial_priority(volume: int, cpc: float) -> float:
    volume_score = min(100, (math.log10(max(volume, 1)) / math.log10(100000)) * 100)
    cpc_score = min(100, (cpc / 10.0) * 100)
    initial_score = (volume_score * 0.60) + (cpc_score * 0.40)
    return round(min(100, max(5, initial_score)), 2)


async def run_onboarding(brand_id: str, db: AsyncSession) -> dict:
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    if not brand:
        raise ValueError(f"Brand {brand_id} not found")

    logger.info(f"Starting onboarding for brand '{brand.name}' ({brand.domain})")

    brand.fingerprint_status = FingerprintStatus.processing
    await db.commit()

    client = get_dataforseo_client()

    try:
        # Step 1: Generate keyword candidates
        candidates = generate_keywords(brand.name, brand.domain)
        logger.info(f"Generated {len(candidates)} keyword candidates")

        # Step 2: Fetch search volume from DataForSEO
        terms = [c["term"] for c in candidates]
        volume_data = {}
        batch_size = 700
        for i in range(0, len(terms), batch_size):
            batch = terms[i:i + batch_size]
            volumes = await client.get_search_volume(batch)
            for v in volumes:
                volume_data[v["keyword"]] = v

        logger.info(f"Got volume data for {len(volume_data)} keywords")

        # Step 3: Filter and store keywords
        keywords_created = 0
        keyword_objects = []

        for candidate in candidates:
            term = candidate["term"]
            vol_info = volume_data.get(term, {})
            volume = vol_info.get("search_volume", 0)
            cpc = float(vol_info.get("cpc", 0))

            if candidate["keyword_type"] in ("long_tail", "misspelling") and volume < MIN_VOLUME_THRESHOLD:
                continue

            priority = calculate_initial_priority(volume, cpc)
            interval = priority_to_interval(priority)

            kw = Keyword(
                brand_id=brand.id,
                term=term,
                keyword_type=KeywordType(candidate["keyword_type"]),
                monthly_volume=volume,
                avg_cpc=Decimal(str(cpc)),
                priority_score=Decimal(str(priority)),
                check_interval_hours=interval,
                is_active=True,
            )
            db.add(kw)
            keyword_objects.append(kw)
            keywords_created += 1

        await db.commit()
        for kw in keyword_objects:
            await db.refresh(kw)

        logger.info(f"Stored {keywords_created} keywords (filtered from {len(candidates)})")

        # Step 4: Initial SERP sweep (top 20 by priority)
        sorted_keywords = sorted(keyword_objects, key=lambda k: float(k.priority_score), reverse=True)
        keywords_to_check = sorted_keywords[:20]

        serp_count = 0
        threats_found = 0

        for kw in keywords_to_check:
            try:
                serp_data = await client.get_serp(kw.term)

                flagged = 0
                all_results = serp_data["paid"] + serp_data["organic"] + serp_data["shopping"]
                for r in all_results:
                    result_domain = r.get("domain", "")
                    if result_domain and brand.domain not in result_domain:
                        flagged += 1

                snapshot = SerpSnapshot(
                    keyword_id=kw.id,
                    geo_target="US",
                    paid_results=serp_data["paid"],
                    organic_results=serp_data["organic"],
                    shopping_results=serp_data["shopping"],
                    flagged_count=flagged,
                )
                db.add(snapshot)

                kw.last_checked_at = datetime.utcnow()
                serp_count += 1

                # Flag paid ads from non-brand domains as potential threats
                for ad in serp_data["paid"]:
                    ad_domain = ad.get("domain", "")
                    if ad_domain and brand.domain not in ad_domain:
                        existing = await db.execute(
                            select(Threat).where(
                                Threat.brand_id == brand.id,
                                Threat.domain == ad_domain,
                            )
                        )
                        if not existing.scalar_one_or_none():
                            threat = Threat(
                                brand_id=brand.id,
                                domain=ad_domain,
                                threat_type=ThreatType.paid_ad,
                                severity_score=Decimal("50"),
                                status=ThreatStatus.detected,
                                revenue_at_risk_monthly=Decimal("0"),
                                first_seen_at=datetime.utcnow(),
                                last_seen_at=datetime.utcnow(),
                            )
                            db.add(threat)
                            threats_found += 1

            except Exception as e:
                logger.error(f"SERP check failed for '{kw.term}': {e}")
                continue

        await db.commit()

        # Step 5: Update brand status
        brand.fingerprint_status = FingerprintStatus.complete
        brand.last_crawl_at = datetime.utcnow()
        await db.commit()

        summary = {
            "brand_id": str(brand.id),
            "brand_name": brand.name,
            "keywords_generated": len(candidates),
            "keywords_stored": keywords_created,
            "serp_checks_completed": serp_count,
            "threats_found": threats_found,
            "status": "complete",
        }
        logger.info(f"Onboarding complete: {summary}")
        return summary

    except Exception as e:
        logger.error(f"Onboarding failed for brand {brand_id}: {e}")
        brand.fingerprint_status = FingerprintStatus.failed
        await db.commit()
        raise
