// ═══════════════════════════════════════════════
// MOCK DATA — simulates FastAPI /api/v1/ responses
// Replace with real API calls via hooks/useApi.js
// ═══════════════════════════════════════════════

export const BRAND = {
  id: "b-001",
  name: "Beam Supplements",
  domain: "beamsupplements.com",
  aov: 67.50,
  conversionRate: 0.028,
  defaultCtr: 0.035,
  fingerprintStatus: "complete",
  fingerprintRefreshedAt: "Jan 15, 2026",
  nextFingerprintRefresh: "Apr 15, 2026",
  detectedCategory: "Health & Supplements",
  isActive: true,
  keywordsCount: 47,
  planTier: "starter",
};

export const DASHBOARD = {
  activeThreats: 14,
  revenueAtRisk: 28750,
  resolvedMonth: 8,
  pendingTakedowns: 3,
  threats: [
    { id: 1, domain: "beam-supplements-official.com", type: "Paid Ad", severity: 94, revenue: 8200, status: "confirmed", date: "Feb 12" },
    { id: 2, domain: "getbeamhealth.store", type: "Clone", severity: 87, revenue: 5400, status: "detected", date: "Feb 14" },
    { id: 3, domain: "beamwellness-shop.com", type: "Shopping", severity: 82, revenue: 4100, status: "takedown_pending", date: "Feb 10" },
    { id: 4, domain: "official-beam.co", type: "Paid Ad", severity: 76, revenue: 3800, status: "detected", date: "Feb 15" },
    { id: 5, domain: "beam-discount-store.net", type: "Misleading", severity: 71, revenue: 2900, status: "investigating", date: "Feb 16" },
  ],
  chartData: [
    { month: "Sep", threats: 3, resolved: 2 },
    { month: "Oct", threats: 5, resolved: 3 },
    { month: "Nov", threats: 4, resolved: 4 },
    { month: "Dec", threats: 7, resolved: 5 },
    { month: "Jan", threats: 9, resolved: 6 },
    { month: "Feb", threats: 14, resolved: 8 },
  ],
  activity: [
    { text: "New threat detected: beam-supplements-official.com", time: "2 hours ago", icon: "🔴" },
    { text: "Takedown submitted for getbeamhealth.store", time: "5 hours ago", icon: "📤" },
    { text: "Resolved: fakebeam-deals.com removed from Google", time: "1 day ago", icon: "✅" },
    { text: "Severity increased for beamwellness-shop.com", time: "1 day ago", icon: "⬆️" },
    { text: "DMCA successful: beam-copycats.com taken down", time: "2 days ago", icon: "🎉" },
  ],
};

export const THREATS = [
  { id: 1, domain: "beam-supplements-official.com", type: "paid_ad", severity: 94, revenue: 8200, status: "confirmed", firstSeen: "Feb 12", keywords: ["beam supplements", "beam official"] },
  { id: 2, domain: "getbeamhealth.store", type: "organic_clone", severity: 87, revenue: 5400, status: "detected", firstSeen: "Feb 14", keywords: ["beam health", "buy beam"] },
  { id: 3, domain: "beamwellness-shop.com", type: "shopping_listing", severity: 82, revenue: 4100, status: "takedown_pending", firstSeen: "Feb 10", keywords: ["beam wellness"] },
  { id: 4, domain: "official-beam.co", type: "paid_ad", severity: 76, revenue: 3800, status: "detected", firstSeen: "Feb 15", keywords: ["beam", "beam supplements official"] },
  { id: 5, domain: "beam-discount-store.net", type: "organic_misleading", severity: 71, revenue: 2900, status: "investigating", firstSeen: "Feb 16", keywords: ["beam coupon"] },
  { id: 6, domain: "trybeamsupps.com", type: "paid_ad", severity: 68, revenue: 2200, status: "detected", firstSeen: "Feb 17", keywords: ["beam supps"] },
  { id: 7, domain: "beamsupplements-reviews.org", type: "organic_misleading", severity: 55, revenue: 1800, status: "investigating", firstSeen: "Feb 8", keywords: ["beam reviews"] },
  { id: 8, domain: "cheapbeam.shop", type: "shopping_listing", severity: 52, revenue: 1400, status: "detected", firstSeen: "Feb 13", keywords: ["cheap beam"] },
  { id: 9, domain: "beamhealth-offers.com", type: "organic_clone", severity: 48, revenue: 1100, status: "takedown_submitted", firstSeen: "Feb 5", keywords: ["beam offers"] },
  { id: 10, domain: "mybeamsupps.net", type: "paid_ad", severity: 44, revenue: 900, status: "detected", firstSeen: "Feb 18", keywords: ["my beam"] },
  { id: 11, domain: "beam-nutrition-deals.com", type: "organic_misleading", severity: 38, revenue: 650, status: "detected", firstSeen: "Feb 11", keywords: ["beam nutrition"] },
  { id: 12, domain: "realbeamshop.co", type: "shopping_listing", severity: 35, revenue: 480, status: "resolved", firstSeen: "Jan 28", keywords: ["real beam"] },
];

export const THREAT_DETAIL = {
  domain: "beam-supplements-official.com", type: "Paid Ad", severity: 94,
  status: "confirmed", revenue: 8200, firstSeen: "Feb 12, 2026", lastSeen: "Feb 19, 2026",
  keywords: ["beam supplements", "beam official", "buy beam supplements", "beam supplements official site"],
  similarity: { text: 0.78, visual: 0.64, domain: 0.85 },
  whois: { registrar: "NameCheap, Inc.", created: "Jan 28, 2026", expires: "Jan 28, 2027", registrant: "Withheld for Privacy ehf", country: "IS", nameServers: ["dns1.registrar-servers.com", "dns2.registrar-servers.com"] },
  tech: ["Shopify", "Google Analytics", "Facebook Pixel"], payments: ["Shopify Payments", "PayPal"],
  ad: { title: "Beam Supplements™ - Official Store | 60% Off Today", desc: "Shop the official Beam Supplements collection. Premium health & wellness products. Free shipping on orders over $50.", display: "beam-supplements-official.com/shop", position: 2, keyword: "beam supplements" },
  takedowns: [
    { channel: "Google Ads Trademark", status: "draft" },
    { channel: "Registrar Abuse Report", status: "draft" },
    { channel: "Hosting Provider DMCA", status: "draft" },
  ],
};

export const KEYWORDS = [
  { id: 1, term: "beam supplements", type: "exact_brand", volume: 8100, cpc: 2.45, priority: 95, interval: 12, lastChecked: "19 min ago", threats: 4, consecutive: 0, active: true },
  { id: 2, term: "beam official", type: "exact_brand", volume: 2900, cpc: 3.10, priority: 88, interval: 12, lastChecked: "22 min ago", threats: 3, consecutive: 0, active: true },
  { id: 3, term: "buy beam supplements", type: "brand_modifier", volume: 3200, cpc: 2.80, priority: 82, interval: 12, lastChecked: "35 min ago", threats: 2, consecutive: 0, active: true },
  { id: 4, term: "beam supplements official site", type: "brand_modifier", volume: 1400, cpc: 3.50, priority: 78, interval: 24, lastChecked: "2 hrs ago", threats: 2, consecutive: 0, active: true },
  { id: 5, term: "beam health", type: "brand_modifier", volume: 1200, cpc: 1.90, priority: 72, interval: 24, lastChecked: "3 hrs ago", threats: 2, consecutive: 0, active: true },
  { id: 6, term: "beam supplements reviews", type: "brand_modifier", volume: 1500, cpc: 1.20, priority: 65, interval: 48, lastChecked: "6 hrs ago", threats: 1, consecutive: 2, active: true },
  { id: 7, term: "beam supplement discount", type: "brand_modifier", volume: 1800, cpc: 2.10, priority: 61, interval: 48, lastChecked: "8 hrs ago", threats: 2, consecutive: 0, active: true },
  { id: 8, term: "beam wellness", type: "product", volume: 900, cpc: 1.60, priority: 58, interval: 48, lastChecked: "10 hrs ago", threats: 1, consecutive: 1, active: true },
  { id: 9, term: "beam coupon", type: "brand_modifier", volume: 800, cpc: 1.40, priority: 52, interval: 48, lastChecked: "12 hrs ago", threats: 1, consecutive: 3, active: true },
  { id: 10, term: "beam supps", type: "misspelling", volume: 600, cpc: 1.80, priority: 48, interval: 72, lastChecked: "1 day ago", threats: 1, consecutive: 4, active: true },
  { id: 11, term: "beam dream powder", type: "product", volume: 2200, cpc: 2.30, priority: 44, interval: 72, lastChecked: "1 day ago", threats: 0, consecutive: 8, active: true },
  { id: 12, term: "beam super greens", type: "product", volume: 1900, cpc: 2.00, priority: 42, interval: 72, lastChecked: "1 day ago", threats: 0, consecutive: 10, active: true },
  { id: 13, term: "beam nutrition", type: "brand_modifier", volume: 500, cpc: 0.90, priority: 35, interval: 72, lastChecked: "2 days ago", threats: 1, consecutive: 6, active: true },
  { id: 14, term: "beam focus supplement", type: "product", volume: 1100, cpc: 1.70, priority: 32, interval: 72, lastChecked: "2 days ago", threats: 0, consecutive: 12, active: true },
  { id: 15, term: "beamsupplements.com", type: "exact_brand", volume: 400, cpc: 3.80, priority: 28, interval: 168, lastChecked: "4 days ago", threats: 0, consecutive: 15, active: true },
  { id: 16, term: "beam supplement sale", type: "long_tail", volume: 300, cpc: 1.10, priority: 18, interval: 168, lastChecked: "5 days ago", threats: 0, consecutive: 20, active: true },
  { id: 17, term: "beem supplements", type: "misspelling", volume: 200, cpc: 0.60, priority: 12, interval: 168, lastChecked: "6 days ago", threats: 0, consecutive: 25, active: true },
  { id: 18, term: "beam supplements near me", type: "long_tail", volume: 150, cpc: 0.40, priority: 8, interval: 720, lastChecked: "3 weeks ago", threats: 0, consecutive: 30, active: false },
];

export const WHITELISTED = [
  { id: 1, domain: "amazon.com", reason: "Authorized marketplace", addedBy: "John S.", date: "Jan 15, 2026" },
  { id: 2, domain: "supplementreviews.com", reason: "Review site (legitimate)", addedBy: "John S.", date: "Feb 2, 2026" },
  { id: 3, domain: "reddit.com", reason: "Community discussion", addedBy: "John S.", date: "Feb 5, 2026" },
];

export const TEAM = [
  { id: 1, name: "John Smith", email: "john@beamsupplements.com", role: "Account Owner", active: true },
  { id: 2, name: "Sarah Chen", email: "sarah@beamsupplements.com", role: "Brand Manager", active: true, perms: { takedowns: true, dismiss: true, whitelist: true, keywords: true } },
  { id: 3, name: "Mike Torres", email: "mike@agencypartner.com", role: "Brand Viewer", active: true, perms: {} },
];

export const AUDIT = {
  brandName: "Beam Supplements",
  domain: "beamsupplements.com",
  auditPeriod: "Feb 5 – Feb 19, 2026",
  totalThreats: 14,
  criticalThreats: 6,
  revenueAtRisk: 28750,
  topThreats: [
    { domain: "beam-supplements-official.com", type: "Paid Ad", severity: 94, revenue: 8200, blurred: false },
    { domain: "getbeamhealth.store", type: "Organic Clone", severity: 87, revenue: 5400, blurred: false },
    { domain: "beamwellness-shop.com", type: "Shopping", severity: 82, revenue: 4100, blurred: false },
    { domain: "•••••••-beam.co", type: "Paid Ad", severity: 76, revenue: 3800, blurred: true },
    { domain: "beam-•••••••-store.net", type: "Clone", severity: 71, revenue: 2900, blurred: true },
  ],
  keywordBreakdown: [
    { keyword: "beam supplements", volume: 8100, badActors: 4, revenue: 9800 },
    { keyword: "buy beam", volume: 3200, badActors: 2, revenue: 4200 },
    { keyword: "beam official", volume: 2900, badActors: 3, revenue: 3800 },
    { keyword: "beam supplement discount", volume: 1800, badActors: 2, revenue: 2100 },
    { keyword: "••••••••", volume: null, badActors: null, revenue: null },
    { keyword: "••••••••", volume: null, badActors: null, revenue: null },
  ],
  threatTypes: { paid_ad: 5, organic_clone: 4, organic_misleading: 3, shopping: 2 },
};

// ═══════════════════════════════════════════════
// SHARED CONSTANTS
// ═══════════════════════════════════════════════

export const STATUS_MAP = {
  detected: { label: "Detected", bg: "#FEF2F2", color: "#DC2626" },
  confirmed: { label: "Confirmed", bg: "#FEF2F2", color: "#DC2626" },
  investigating: { label: "Investigating", bg: "#FFFBEB", color: "#D97706" },
  takedown_pending: { label: "Pending", bg: "#EFF6FF", color: "#2563EB" },
  takedown_submitted: { label: "Submitted", bg: "#F5F3FF", color: "#7C3AED" },
  resolved: { label: "Resolved", bg: "#F0FDF4", color: "#16A34A" },
  dismissed: { label: "Dismissed", bg: "#F1F5F9", color: "#94A3B8" },
};

export const TYPE_LABEL = { paid_ad: "Paid Ad", organic_clone: "Clone", organic_misleading: "Misleading", shopping_listing: "Shopping" };
export const TYPE_COLOR = { exact_brand: "#2563EB", brand_modifier: "#7C3AED", product: "#0891B2", misspelling: "#D97706", long_tail: "#64748B" };

export const severityColor = (s) => s >= 70 ? "#EF4444" : s >= 40 ? "#F59E0B" : "#22C55E";
export const priorityColor = (p) => p >= 70 ? "#EF4444" : p >= 40 ? "#F59E0B" : "#22C55E";
export const intervalLabel = (h) => {
  if (h <= 12) return "12h"; if (h <= 24) return "Daily"; if (h <= 48) return "2 days";
  if (h <= 72) return "3 days"; if (h <= 168) return "Weekly"; return "Monthly";
};
