import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, Text, ForeignKey,
    DECIMAL, TIMESTAMP, Enum as SAEnum, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ── Enums ──────────────────────────────────────────────

class PlanTier(str, enum.Enum):
    starter = "starter"
    growth = "growth"
    enterprise = "enterprise"


class FingerprintStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    complete = "complete"
    failed = "failed"


class KeywordType(str, enum.Enum):
    exact_brand = "exact_brand"
    brand_modifier = "brand_modifier"
    product = "product"
    misspelling = "misspelling"
    long_tail = "long_tail"


class ThreatType(str, enum.Enum):
    paid_ad = "paid_ad"
    organic_clone = "organic_clone"
    organic_misleading = "organic_misleading"
    shopping_listing = "shopping_listing"
    other = "other"


class ThreatStatus(str, enum.Enum):
    detected = "detected"
    investigating = "investigating"
    confirmed = "confirmed"
    takedown_pending = "takedown_pending"
    takedown_submitted = "takedown_submitted"
    resolved = "resolved"
    dismissed = "dismissed"


class TakedownChannel(str, enum.Enum):
    google_ads = "google_ads"
    google_search = "google_search"
    google_shopping = "google_shopping"
    registrar = "registrar"
    hosting_provider = "hosting_provider"
    dmca_direct = "dmca_direct"


class TakedownStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    submitted = "submitted"
    acknowledged = "acknowledged"
    resolved = "resolved"
    failed = "failed"


class EvidenceType(str, enum.Enum):
    screenshot = "screenshot"
    whois = "whois"
    content_similarity = "content_similarity"
    visual_similarity = "visual_similarity"
    ad_copy = "ad_copy"
    hosting_info = "hosting_info"
    tech_stack = "tech_stack"
    payment_processor = "payment_processor"
    shopping_listing = "shopping_listing"


class AuditType(str, enum.Enum):
    managed = "managed"
    self_serve = "self_serve"


class AuditStatus(str, enum.Enum):
    running = "running"
    complete = "complete"
    expired = "expired"


class BillingEventType(str, enum.Enum):
    takedown_bounty = "takedown_bounty"


class UserRole(str, enum.Enum):
    account_owner = "account_owner"
    brand_manager = "brand_manager"
    brand_viewer = "brand_viewer"


# ── Models ─────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    stripe_customer_id = Column(String(255), nullable=True)
    plan_tier = Column(SAEnum(PlanTier), default=PlanTier.starter)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    brands = relationship("Brand", back_populates="organization", cascade="all, delete-orphan")
    billing_events = relationship("BillingEvent", back_populates="organization")
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    email = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    role = Column(SAEnum(UserRole), default=UserRole.account_owner)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="users")


class Brand(Base):
    __tablename__ = "brands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=False)
    aov = Column(DECIMAL(10, 2), nullable=True)
    conversion_rate = Column(DECIMAL(5, 4), nullable=True)
    default_ctr = Column(DECIMAL(5, 4), nullable=True)
    fingerprint_status = Column(SAEnum(FingerprintStatus), default=FingerprintStatus.pending)
    fingerprint_refreshed_at = Column(TIMESTAMP, nullable=True)
    next_fingerprint_refresh = Column(TIMESTAMP, nullable=True)
    last_crawl_at = Column(TIMESTAMP, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="brands")
    fingerprint = relationship("BrandFingerprint", back_populates="brand", uselist=False)
    keywords = relationship("Keyword", back_populates="brand", cascade="all, delete-orphan")
    threats = relationship("Threat", back_populates="brand", cascade="all, delete-orphan")
    whitelisted_domains = relationship("WhitelistedDomain", back_populates="brand", cascade="all, delete-orphan")
    audit_reports = relationship("AuditReport", back_populates="brand")


class BrandFingerprint(Base):
    __tablename__ = "brand_fingerprints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False, unique=True)
    version = Column(Integer, default=1)
    content_terms = Column(JSONB, default=dict)
    visual_hashes = Column(JSONB, default=dict)
    logo_hash = Column(String(255), nullable=True)
    color_palette = Column(JSONB, default=list)
    page_structure = Column(JSONB, default=dict)
    product_catalog = Column(JSONB, default=list)
    detected_category = Column(String(255), nullable=True)
    homepage_hash = Column(String(255), nullable=True)
    screenshots_path = Column(String(500), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    brand = relationship("Brand", back_populates="fingerprint")


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False)
    term = Column(String(500), nullable=False)
    keyword_type = Column(SAEnum(KeywordType), default=KeywordType.exact_brand)
    monthly_volume = Column(Integer, default=0)
    avg_cpc = Column(DECIMAL(10, 2), default=0)
    priority_score = Column(DECIMAL(5, 2), default=50)
    check_interval_hours = Column(Integer, default=24)
    last_checked_at = Column(TIMESTAMP, nullable=True)
    last_threat_at = Column(TIMESTAMP, nullable=True)
    consecutive_clean = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    brand = relationship("Brand", back_populates="keywords")
    serp_snapshots = relationship("SerpSnapshot", back_populates="keyword", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_keywords_scheduling", "brand_id", "is_active", "last_checked_at"),
        Index("ix_keywords_priority", "brand_id", "priority_score"),
    )


class SerpSnapshot(Base):
    __tablename__ = "serp_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    keyword_id = Column(UUID(as_uuid=True), ForeignKey("keywords.id"), nullable=False)
    checked_at = Column(TIMESTAMP, default=datetime.utcnow)
    geo_target = Column(String(50), default="US")
    paid_results = Column(JSONB, default=list)
    organic_results = Column(JSONB, default=list)
    shopping_results = Column(JSONB, default=list)
    serp_screenshot_path = Column(String(500), nullable=True)
    flagged_count = Column(Integer, default=0)

    # Relationships
    keyword = relationship("Keyword", back_populates="serp_snapshots")

    __table_args__ = (
        Index("ix_serp_latest", "keyword_id", "checked_at"),
    )


class Threat(Base):
    __tablename__ = "threats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False)
    domain = Column(String(255), nullable=False)
    threat_type = Column(SAEnum(ThreatType), default=ThreatType.other)
    severity_score = Column(DECIMAL(5, 2), default=0)
    status = Column(SAEnum(ThreatStatus), default=ThreatStatus.detected)
    revenue_at_risk_monthly = Column(DECIMAL(12, 2), default=0)
    first_seen_at = Column(TIMESTAMP, default=datetime.utcnow)
    last_seen_at = Column(TIMESTAMP, default=datetime.utcnow)
    resolved_at = Column(TIMESTAMP, nullable=True)
    dismissed_reason = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    brand = relationship("Brand", back_populates="threats")
    evidence = relationship("ThreatEvidence", back_populates="threat", cascade="all, delete-orphan")
    takedowns = relationship("Takedown", back_populates="threat", cascade="all, delete-orphan")
    billing_event = relationship("BillingEvent", back_populates="threat", uselist=False)

    __table_args__ = (
        Index("ix_threats_dashboard", "brand_id", "status", "severity_score"),
        Index("ix_threats_trend", "brand_id", "first_seen_at"),
    )


class ThreatEvidence(Base):
    __tablename__ = "threat_evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threats.id"), nullable=False)
    evidence_type = Column(SAEnum(EvidenceType), nullable=False)
    data = Column(JSONB, default=dict)
    file_path = Column(String(500), nullable=True)
    captured_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    threat = relationship("Threat", back_populates="evidence")

    __table_args__ = (
        Index("ix_evidence_dossier", "threat_id", "evidence_type"),
    )


class Takedown(Base):
    __tablename__ = "takedowns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threats.id"), nullable=False)
    channel = Column(SAEnum(TakedownChannel), nullable=False)
    status = Column(SAEnum(TakedownStatus), default=TakedownStatus.draft)
    complaint_data = Column(JSONB, default=dict)
    submitted_at = Column(TIMESTAMP, nullable=True)
    response_data = Column(JSONB, nullable=True)
    resolved_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    threat = relationship("Threat", back_populates="takedowns")


class WhitelistedDomain(Base):
    __tablename__ = "whitelisted_domains"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False)
    domain = Column(String(255), nullable=False)
    reason = Column(String(500), nullable=True)
    added_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    brand = relationship("Brand", back_populates="whitelisted_domains")

    __table_args__ = (
        Index("ix_whitelist_lookup", "brand_id", "domain"),
    )


class BillingEvent(Base):
    __tablename__ = "billing_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threats.id"), nullable=False, unique=True)
    event_type = Column(SAEnum(BillingEventType), default=BillingEventType.takedown_bounty)
    amount = Column(DECIMAL(10, 2), nullable=False)
    stripe_usage_record_id = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="billing_events")
    threat = relationship("Threat", back_populates="billing_event")


class AuditReport(Base):
    __tablename__ = "audit_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False)
    audit_type = Column(SAEnum(AuditType), default=AuditType.managed)
    status = Column(SAEnum(AuditStatus), default=AuditStatus.running)
    started_at = Column(TIMESTAMP, default=datetime.utcnow)
    ends_at = Column(TIMESTAMP, nullable=True)
    pdf_path = Column(String(500), nullable=True)
    portal_token = Column(String(255), nullable=True, unique=True)
    portal_expires_at = Column(TIMESTAMP, nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    brand = relationship("Brand", back_populates="audit_reports")

    __table_args__ = (
        Index("ix_audit_portal", "portal_token"),
    )
