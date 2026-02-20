"""
Threat analysis for SERP results.

Analyzes each SERP result to determine if it's a genuine threat to the brand.
Goes beyond simple domain matching to detect:
- Deceptive domains (brand name in domain they don't own)
- Paid ad hijacking (non-brand sites bidding on brand keywords)  
- Suspicious organic results (sites using brand name deceptively)
- Known safe domains are auto-whitelisted
"""
import re
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

# Major retailers / platforms that are almost never threats
SAFE_DOMAINS = {
    "amazon.com", "www.amazon.com",
    "walmart.com", "www.walmart.com",
    "target.com", "www.target.com",
    "ebay.com", "www.ebay.com",
    "costco.com", "www.costco.com",
    "cvs.com", "www.cvs.com",
    "walgreens.com", "www.walgreens.com",
    "gnc.com", "www.gnc.com",
    "vitaminworld.com", "www.vitaminworld.com",
    "iherb.com", "www.iherb.com",
    "vitaminshoppe.com", "www.vitaminshoppe.com",
    # Social / content platforms
    "youtube.com", "www.youtube.com",
    "reddit.com", "www.reddit.com",
    "instagram.com", "www.instagram.com",
    "facebook.com", "www.facebook.com",
    "tiktok.com", "www.tiktok.com",
    "twitter.com", "x.com",
    "linkedin.com", "www.linkedin.com",
    "pinterest.com", "www.pinterest.com",
    # Review / media sites
    "healthline.com", "www.healthline.com",
    "webmd.com", "www.webmd.com",
    "forbes.com", "www.forbes.com",
    "nytimes.com", "www.nytimes.com",
    "wsj.com", "www.wsj.com",
    "bbb.org", "www.bbb.org",
    "trustpilot.com", "www.trustpilot.com",
    "yelp.com", "www.yelp.com",
    "consumerreports.org", "www.consumerreports.org",
    # Google properties
    "google.com", "www.google.com",
    "support.google.com",
    "news.google.com",
    # Wikipedia
    "wikipedia.org", "en.wikipedia.org",
    # General ecommerce
    "shopify.com", "www.shopify.com",
}

# Patterns that indicate a deceptive domain
DECEPTIVE_PATTERNS = [
    "official", "store", "shop", "buy", "order", "get",
    "discount", "coupon", "deal", "sale", "cheap",
    "real", "legit", "authentic", "genuine", "authorized",
    "review", "reviews",
]


@dataclass
class ThreatSignal:
    domain: str
    threat_type: str  # paid_ad, organic_clone, organic_misleading, shopping_listing
    severity_score: float
    reason: str
    source_type: str  # paid, organic, shopping
    position: Optional[int] = None
    title: Optional[str] = None
    url: Optional[str] = None


def _normalize_domain(domain: str) -> str:
    """Strip www. and lowercase."""
    return domain.lower().replace("www.", "").strip(".")


def _is_safe_domain(domain: str) -> bool:
    """Check if domain is a known safe platform."""
    normalized = _normalize_domain(domain)
    # Check exact match
    if normalized in SAFE_DOMAINS or f"www.{normalized}" in SAFE_DOMAINS:
        return True
    # Check if it's a subdomain of a safe domain
    for safe in SAFE_DOMAINS:
        safe_norm = _normalize_domain(safe)
        if normalized.endswith(f".{safe_norm}"):
            return True
    return False


def _domain_contains_brand(domain: str, brand_name: str) -> bool:
    """Check if the brand name appears in the domain."""
    normalized = _normalize_domain(domain)
    brand_parts = brand_name.lower().split()
    
    # Check full brand name (with various separators)
    brand_joined = brand_name.lower().replace(" ", "")
    brand_dashed = brand_name.lower().replace(" ", "-")
    
    if brand_joined in normalized or brand_dashed in normalized:
        return True
    
    # Check individual words (only for multi-word brands, require at least 2 words)
    if len(brand_parts) >= 2:
        matches = sum(1 for part in brand_parts if part in normalized and len(part) > 2)
        if matches >= 2:
            return True
    elif len(brand_parts) == 1 and len(brand_parts[0]) > 3:
        # Single word brand — must appear in domain
        if brand_parts[0] in normalized:
            return True
    
    return False


def _has_deceptive_pattern(domain: str) -> bool:
    """Check if domain uses deceptive patterns like 'official', 'store', etc."""
    normalized = _normalize_domain(domain)
    for pattern in DECEPTIVE_PATTERNS:
        if pattern in normalized:
            return True
    return False


def _domain_deceptiveness_score(domain: str, brand_name: str) -> float:
    """
    Score how deceptive a domain is (0-100).
    High score = domain is clearly trying to impersonate the brand.
    """
    score = 0.0
    normalized = _normalize_domain(domain)
    
    # Brand name in domain (big signal)
    if _domain_contains_brand(domain, brand_name):
        score += 50
        
        # Plus deceptive modifiers
        if _has_deceptive_pattern(domain):
            score += 30
        
        # Lots of hyphens (common in impersonation domains)
        if normalized.count("-") >= 2:
            score += 10
        
        # Long domain (impersonation domains tend to be long)
        if len(normalized) > 25:
            score += 10
    
    return min(100, score)


def _title_mentions_brand(title: str, brand_name: str) -> bool:
    """Check if the SERP result title mentions the brand."""
    title_lower = title.lower()
    brand_lower = brand_name.lower()
    
    if brand_lower in title_lower:
        return True
    
    # Check without spaces
    if brand_lower.replace(" ", "") in title_lower.replace(" ", ""):
        return True
    
    return False


def analyze_serp_result(
    result: dict,
    source_type: str,  # "paid", "organic", "shopping"
    brand_name: str,
    brand_domain: str,
) -> Optional[ThreatSignal]:
    """
    Analyze a single SERP result and return a ThreatSignal if it's suspicious.
    Returns None if the result is safe.
    """
    domain = result.get("domain", "")
    if not domain:
        return None
    
    normalized = _normalize_domain(domain)
    brand_norm = _normalize_domain(brand_domain)
    
    # Skip if it's the brand's own domain
    if brand_norm in normalized or normalized in brand_norm:
        return None
    
    # Skip known safe domains
    if _is_safe_domain(domain):
        return None
    
    title = result.get("title", "")
    url = result.get("url", "")
    position = result.get("position")
    
    # ── Paid Ads: Always suspicious if bidding on brand keywords ──
    if source_type == "paid":
        severity = 60.0  # Base severity for paid ads on brand terms
        reason_parts = ["Non-brand paid ad on brand keyword"]
        
        # Domain contains brand name = very suspicious
        deceptiveness = _domain_deceptiveness_score(domain, brand_name)
        if deceptiveness > 40:
            severity += 20
            reason_parts.append(f"deceptive domain (score: {deceptiveness})")
        
        # Title mentions brand = more suspicious
        if _title_mentions_brand(title, brand_name):
            severity += 10
            reason_parts.append("ad title mentions brand name")
        
        # Higher position = more impact
        if position and position <= 2:
            severity += 10
            reason_parts.append(f"top ad position ({position})")
        
        return ThreatSignal(
            domain=normalized,
            threat_type="paid_ad",
            severity_score=min(100, severity),
            reason="; ".join(reason_parts),
            source_type=source_type,
            position=position,
            title=title,
            url=url,
        )
    
    # ── Organic Results: Only flag if domain is deceptive ──
    if source_type == "organic":
        deceptiveness = _domain_deceptiveness_score(domain, brand_name)
        
        if deceptiveness >= 50:
            severity = 40.0 + (deceptiveness * 0.3)
            reason_parts = [f"Deceptive domain in organic results (score: {deceptiveness})"]
            
            if _title_mentions_brand(title, brand_name):
                severity += 10
                reason_parts.append("title mentions brand")
            
            if position and position <= 5:
                severity += 10
                reason_parts.append(f"high organic position ({position})")
            
            return ThreatSignal(
                domain=normalized,
                threat_type="organic_misleading",
                severity_score=min(100, severity),
                reason="; ".join(reason_parts),
                source_type=source_type,
                position=position,
                title=title,
                url=url,
            )
    
    # ── Shopping Results: Flag if using brand name ──
    if source_type == "shopping":
        if _title_mentions_brand(title, brand_name):
            deceptiveness = _domain_deceptiveness_score(domain, brand_name)
            severity = 45.0
            reason_parts = ["Shopping listing using brand name from non-brand merchant"]
            
            if deceptiveness > 30:
                severity += 15
                reason_parts.append(f"deceptive merchant domain ({deceptiveness})")
            
            return ThreatSignal(
                domain=normalized,
                threat_type="shopping_listing",
                severity_score=min(100, severity),
                reason="; ".join(reason_parts),
                source_type=source_type,
                title=title,
                url=url,
            )
    
    return None


def analyze_serp_data(
    serp_data: dict,
    brand_name: str,
    brand_domain: str,
) -> list[ThreatSignal]:
    """
    Analyze all results from a SERP check and return threat signals.
    """
    threats = []
    
    for ad in serp_data.get("paid", []):
        signal = analyze_serp_result(ad, "paid", brand_name, brand_domain)
        if signal:
            threats.append(signal)
    
    for result in serp_data.get("organic", []):
        signal = analyze_serp_result(result, "organic", brand_name, brand_domain)
        if signal:
            threats.append(signal)
    
    for item in serp_data.get("shopping", []):
        signal = analyze_serp_result(item, "shopping", brand_name, brand_domain)
        if signal:
            threats.append(signal)
    
    return threats
