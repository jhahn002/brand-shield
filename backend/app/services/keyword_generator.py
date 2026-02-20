"""Generate keyword candidates from a brand name and domain."""
import itertools
import logging

logger = logging.getLogger(__name__)

# Common modifiers that bad actors use when targeting brands
MODIFIERS = {
    "purchase_intent": [
        "buy", "order", "shop", "purchase", "get",
    ],
    "trust_signals": [
        "official", "official site", "official website", "legit", "real", "authorized",
    ],
    "deal_seeking": [
        "discount", "coupon", "promo", "promo code", "sale", "deal", "cheap",
    ],
    "research": [
        "reviews", "review", "vs", "alternative", "alternatives",
    ],
    "navigation": [
        "login", "sign in", "website", "site", ".com",
    ],
}

# Common misspelling patterns
def generate_misspellings(brand: str) -> list[str]:
    """Generate common misspellings using character swaps, doubles, drops."""
    misspellings = set()
    brand_lower = brand.lower()
    
    # Adjacent character swaps
    for i in range(len(brand_lower) - 1):
        swapped = list(brand_lower)
        swapped[i], swapped[i + 1] = swapped[i + 1], swapped[i]
        result = "".join(swapped)
        if result != brand_lower:
            misspellings.add(result)
    
    # Character drops (only for brands > 3 chars)
    if len(brand_lower) > 3:
        for i in range(len(brand_lower)):
            result = brand_lower[:i] + brand_lower[i + 1:]
            if result != brand_lower:
                misspellings.add(result)
    
    # Character doubles
    for i in range(len(brand_lower)):
        result = brand_lower[:i] + brand_lower[i] + brand_lower[i:]
        if result != brand_lower:
            misspellings.add(result)
    
    return list(misspellings)[:10]  # Cap at 10 misspellings


def generate_keywords(brand_name: str, domain: str, products: list[str] = None) -> list[dict]:
    """
    Generate keyword candidates for monitoring.
    
    Returns list of dicts: {term, keyword_type}
    """
    keywords = []
    brand = brand_name.strip()
    brand_lower = brand.lower()
    
    # 1. Exact brand name
    keywords.append({"term": brand_lower, "keyword_type": "exact_brand"})
    
    # 2. Brand + modifiers
    for category, mods in MODIFIERS.items():
        for mod in mods:
            keywords.append({
                "term": f"{brand_lower} {mod}",
                "keyword_type": "brand_modifier",
            })
            # Also try modifier first for some
            if category in ("purchase_intent", "deal_seeking"):
                keywords.append({
                    "term": f"{mod} {brand_lower}",
                    "keyword_type": "brand_modifier",
                })
    
    # 3. Brand + domain variations
    domain_name = domain.replace("www.", "").split(".")[0]
    if domain_name.lower() != brand_lower:
        keywords.append({"term": domain_name.lower(), "keyword_type": "exact_brand"})
    
    # 4. Product keywords (if provided)
    if products:
        for product in products[:10]:  # Cap at 10 products
            product_lower = product.strip().lower()
            keywords.append({
                "term": f"{brand_lower} {product_lower}",
                "keyword_type": "product",
            })
    
    # 5. Misspellings
    for misspelling in generate_misspellings(brand):
        keywords.append({
            "term": misspelling,
            "keyword_type": "misspelling",
        })
    
    # Deduplicate by term
    seen = set()
    unique = []
    for kw in keywords:
        if kw["term"] not in seen:
            seen.add(kw["term"])
            unique.append(kw)
    
    logger.info(f"Generated {len(unique)} keyword candidates for '{brand_name}'")
    return unique
