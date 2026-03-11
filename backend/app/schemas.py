"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import uuid


# ── Auth ───────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Organization ───────────────────────────────────────

class OrgResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    plan_tier: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Brand ──────────────────────────────────────────────

class BrandCreate(BaseModel):
    name: str
    domain: str
    aov: Optional[Decimal] = None
    conversion_rate: Optional[Decimal] = None

class BrandUpdate(BaseModel):
    aov: Optional[Decimal] = None
    conversion_rate: Optional[Decimal] = None
    default_ctr: Optional[Decimal] = None

class BrandResponse(BaseModel):
    id: uuid.UUID
    name: str
    domain: str
    aov: Optional[Decimal]
    conversion_rate: Optional[Decimal]
    fingerprint_status: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Keyword ────────────────────────────────────────────

class KeywordCreate(BaseModel):
    terms: List[str]  # bulk add

class KeywordResponse(BaseModel):
    id: uuid.UUID
    term: str
    keyword_type: str
    monthly_volume: int
    avg_cpc: Decimal
    priority_score: Decimal
    check_interval_hours: int
    last_checked_at: Optional[datetime]
    consecutive_clean: int
    is_active: bool

    model_config = {"from_attributes": True}


# ── Threat ─────────────────────────────────────────────

class ThreatResponse(BaseModel):
    id: uuid.UUID
    domain: str
    threat_type: str
    severity_score: Decimal
    status: str
    revenue_at_risk_monthly: Decimal
    first_seen_at: datetime
    last_seen_at: datetime
    keyword_volume: Optional[int] = None
    ad_position: Optional[int] = None

    model_config = {"from_attributes": True}

class ThreatDismiss(BaseModel):
    reason: str


# ── Takedown ───────────────────────────────────────────

class TakedownResponse(BaseModel):
    id: uuid.UUID
    channel: str
    status: str
    submitted_at: Optional[datetime]
    resolved_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Whitelist ──────────────────────────────────────────

class WhitelistCreate(BaseModel):
    domain: str
    reason: Optional[str] = None

class WhitelistResponse(BaseModel):
    id: uuid.UUID
    domain: str
    reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard ──────────────────────────────────────────

class DashboardResponse(BaseModel):
    active_threats: int
    revenue_at_risk: Decimal
    resolved_this_month: int
    pending_takedowns: int


# ── Audit ──────────────────────────────────────────────

class AuditCreate(BaseModel):
    brand_name: str
    domain: str
    email: Optional[EmailStr] = None
    audit_type: str = "managed"

class AuditResponse(BaseModel):
    id: uuid.UUID
    audit_type: str
    status: str
    started_at: datetime
    ends_at: Optional[datetime]
    portal_token: Optional[str]

    model_config = {"from_attributes": True}


# ── Health ─────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    version: str
