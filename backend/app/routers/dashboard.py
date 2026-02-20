"""Dashboard API — aggregated metrics for the frontend."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, and_
from app.database import get_db
from app.models import (
    Brand, Threat, Keyword, ThreatStatus, ThreatType,
    Organization, Takedown, TakedownStatus,
)
from typing import Optional
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _ser(val):
    """Convert Decimal/datetime to JSON-safe types."""
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, datetime):
        return val.isoformat()
    return val


# Active statuses (not resolved/dismissed)
ACTIVE_STATUSES = [
    ThreatStatus.detected,
    ThreatStatus.investigating,
    ThreatStatus.confirmed,
    ThreatStatus.takedown_pending,
    ThreatStatus.takedown_submitted,
]


@router.get("/{brand_id}")
async def get_dashboard(brand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Returns everything the dashboard page needs in a single call:
    - Top-level metric cards
    - Critical threats list
    - Trend chart data (last 6 months)
    - Recent activity feed
    """
    # Verify brand exists
    brand_result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = brand_result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    # ── Metric Cards ──────────────────────────────────────────────
    # Active threats count
    active_count_result = await db.execute(
        select(func.count(Threat.id))
        .where(Threat.brand_id == brand_id)
        .where(Threat.status.in_(ACTIVE_STATUSES))
    )
    active_threats = active_count_result.scalar() or 0

    # Revenue at risk (sum of active threats)
    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Threat.revenue_at_risk_monthly), 0))
        .where(Threat.brand_id == brand_id)
        .where(Threat.status.in_(ACTIVE_STATUSES))
    )
    revenue_at_risk = _ser(revenue_result.scalar())

    # Resolved this month
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    resolved_result = await db.execute(
        select(func.count(Threat.id))
        .where(Threat.brand_id == brand_id)
        .where(Threat.status == ThreatStatus.resolved)
        .where(Threat.resolved_at >= month_start)
    )
    resolved_month = resolved_result.scalar() or 0

    # Pending takedowns
    pending_result = await db.execute(
        select(func.count(Threat.id))
        .where(Threat.brand_id == brand_id)
        .where(Threat.status.in_([
            ThreatStatus.takedown_pending,
            ThreatStatus.takedown_submitted,
        ]))
    )
    pending_takedowns = pending_result.scalar() or 0

    # Total keywords monitored
    keywords_result = await db.execute(
        select(func.count(Keyword.id))
        .where(Keyword.brand_id == brand_id)
        .where(Keyword.is_active == True)
    )
    total_keywords = keywords_result.scalar() or 0

    # ── Critical Threats (top 10 by severity) ─────────────────────
    threats_result = await db.execute(
        select(Threat)
        .where(Threat.brand_id == brand_id)
        .where(Threat.status.in_(ACTIVE_STATUSES))
        .order_by(Threat.severity_score.desc())
        .limit(10)
    )
    threats_list = []
    for t in threats_result.scalars().all():
        threats_list.append({
            "id": str(t.id),
            "domain": t.domain,
            "type": t.threat_type.value if t.threat_type else "other",
            "severity": _ser(t.severity_score),
            "revenue": _ser(t.revenue_at_risk_monthly),
            "status": t.status.value if t.status else "detected",
            "first_seen": _ser(t.first_seen_at),
            "last_seen": _ser(t.last_seen_at),
            "notes": t.notes,
        })

    # ── Trend Chart (last 6 months) ──────────────────────────────
    chart_data = []
    for i in range(5, -1, -1):
        # Calculate month boundaries
        d = now - timedelta(days=i * 30)
        m_start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if m_start.month == 12:
            m_end = m_start.replace(year=m_start.year + 1, month=1)
        else:
            m_end = m_start.replace(month=m_start.month + 1)

        # New threats that month
        new_result = await db.execute(
            select(func.count(Threat.id))
            .where(Threat.brand_id == brand_id)
            .where(Threat.first_seen_at >= m_start)
            .where(Threat.first_seen_at < m_end)
        )
        new_count = new_result.scalar() or 0

        # Resolved that month
        res_result = await db.execute(
            select(func.count(Threat.id))
            .where(Threat.brand_id == brand_id)
            .where(Threat.resolved_at >= m_start)
            .where(Threat.resolved_at < m_end)
        )
        res_count = res_result.scalar() or 0

        chart_data.append({
            "month": m_start.strftime("%b"),
            "threats": new_count,
            "resolved": res_count,
        })

    # ── Activity Feed (recent threat events) ──────────────────────
    # Most recent threats by last_seen
    recent_result = await db.execute(
        select(Threat)
        .where(Threat.brand_id == brand_id)
        .order_by(Threat.last_seen_at.desc())
        .limit(8)
    )
    activity = []
    for t in recent_result.scalars().all():
        if t.status == ThreatStatus.resolved:
            icon = "✅"
            text = f"Resolved: {t.domain} removed"
        elif t.status == ThreatStatus.takedown_submitted:
            icon = "📤"
            text = f"Takedown submitted for {t.domain}"
        elif t.status == ThreatStatus.takedown_pending:
            icon = "⏳"
            text = f"Takedown pending: {t.domain}"
        elif t.status == ThreatStatus.dismissed:
            icon = "🚫"
            text = f"Dismissed: {t.domain}"
        else:
            icon = "🔴"
            text = f"Threat detected: {t.domain}"

        # Time ago
        delta = now - t.last_seen_at if t.last_seen_at else timedelta(0)
        if delta.days > 0:
            time_ago = f"{delta.days} day{'s' if delta.days > 1 else ''} ago"
        elif delta.seconds > 3600:
            hours = delta.seconds // 3600
            time_ago = f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            minutes = max(1, delta.seconds // 60)
            time_ago = f"{minutes} min{'s' if minutes > 1 else ''} ago"

        activity.append({"text": text, "time": time_ago, "icon": icon})

    return {
        "brand": {
            "id": str(brand.id),
            "name": brand.name,
            "domain": brand.domain,
            "fingerprint_status": brand.fingerprint_status.value if brand.fingerprint_status else None,
        },
        "metrics": {
            "activeThreats": active_threats,
            "revenueAtRisk": revenue_at_risk,
            "resolvedMonth": resolved_month,
            "pendingTakedowns": pending_takedowns,
            "totalKeywords": total_keywords,
        },
        "threats": threats_list,
        "chartData": chart_data,
        "activity": activity,
    }


@router.get("")
async def list_brands_dashboard(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all brands with summary metrics for brand selector."""
    brands_result = await db.execute(
        select(Brand).where(Brand.org_id == org_id).where(Brand.is_active == True)
    )
    brands = []
    for b in brands_result.scalars().all():
        # Quick threat count
        tc = await db.execute(
            select(func.count(Threat.id))
            .where(Threat.brand_id == b.id)
            .where(Threat.status.in_(ACTIVE_STATUSES))
        )
        brands.append({
            "id": str(b.id),
            "name": b.name,
            "domain": b.domain,
            "active_threats": tc.scalar() or 0,
        })
    return {"brands": brands}
