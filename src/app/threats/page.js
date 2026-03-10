"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────
// REVENUE CALCULATION (mirrors detail page logic)
// ─────────────────────────────────────────────
const CTR_BY_POSITION = {
  paid: { 1: 0.070, 2: 0.035, 3: 0.025, 4: 0.018, 5: 0.012 },
  organic: { 1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.06, 6: 0.05, 7: 0.04, 8: 0.03 },
  shopping: { 1: 0.05, 2: 0.038, 3: 0.028, 4: 0.020 },
};

const DEFAULT_AOV = 70;
const DEFAULT_CONVERSION_RATE = 0.028; // matches detail page default

function getDefaultCTR(threatType, position = 2) {
  if (threatType === "paid_ad") return CTR_BY_POSITION.paid[position] ?? 0.018;
  if (threatType === "shopping_listing") return CTR_BY_POSITION.shopping[position] ?? 0.020;
  return CTR_BY_POSITION.organic[position] ?? 0.05;
}

function calcRevenue(threat, assumptions) {
  // If backend already calculated a non-zero value, trust it
  if (threat.revenue_at_risk_monthly && threat.revenue_at_risk_monthly > 0) {
    return threat.revenue_at_risk_monthly;
  }
  // Otherwise calculate client-side from available data
  const volume = threat.keyword_volume || threat.monthly_volume || threat.search_volume || 0;
  if (!volume) return 0;
  const ctr = getDefaultCTR(threat.threat_type, threat.ad_position || 2);
  const convRate = assumptions.conversionRate ?? DEFAULT_CONVERSION_RATE;
  const aov = assumptions.aov ?? DEFAULT_AOV;
  return Math.round(volume * ctr * convRate * aov);
}

function calcEstimatedClicks(threat) {
  const volume = threat.keyword_volume || threat.monthly_volume || threat.search_volume || 0;
  const ctr = getDefaultCTR(threat.threat_type, threat.ad_position || 2);
  return Math.round(volume * ctr);
}

function calcEstimatedSales(threat, assumptions) {
  const clicks = calcEstimatedClicks(threat);
  const convRate = assumptions.conversionRate ?? DEFAULT_CONVERSION_RATE;
  return Math.round(clicks * convRate);
}

// ─────────────────────────────────────────────
// MOCK DATA (used when API unavailable)
// ─────────────────────────────────────────────
const MOCK_THREATS = [
  {
    id: "t-01",
    domain: "beam-supplements-official.com",
    threat_type: "paid_ad",
    severity_score: 94,
    status: "detected",
    keyword_volume: 12400,
    ad_position: 2,
    revenue_at_risk_monthly: 0, // intentionally 0 to test client-side calc
    first_seen_at: "2026-02-12T09:00:00Z",
    last_seen_at: "2026-03-10T14:00:00Z",
  },
  {
    id: "t-02",
    domain: "beamsupplements-store.com",
    threat_type: "organic_clone",
    severity_score: 87,
    status: "confirmed",
    keyword_volume: 8100,
    ad_position: 3,
    revenue_at_risk_monthly: 0,
    first_seen_at: "2026-02-14T11:00:00Z",
    last_seen_at: "2026-03-09T16:00:00Z",
  },
  {
    id: "t-03",
    domain: "buy-beam-cheap.com",
    threat_type: "paid_ad",
    severity_score: 76,
    status: "takedown_pending",
    keyword_volume: 5400,
    ad_position: 1,
    revenue_at_risk_monthly: 0,
    first_seen_at: "2026-02-18T08:00:00Z",
    last_seen_at: "2026-03-08T12:00:00Z",
  },
  {
    id: "t-04",
    domain: "beamwellness-deals.shop",
    threat_type: "shopping_listing",
    severity_score: 71,
    status: "detected",
    keyword_volume: 4200,
    ad_position: 2,
    revenue_at_risk_monthly: 0,
    first_seen_at: "2026-02-20T10:00:00Z",
    last_seen_at: "2026-03-10T09:00:00Z",
  },
  {
    id: "t-05",
    domain: "official-beam-supplements.net",
    threat_type: "organic_misleading",
    severity_score: 62,
    status: "detected",
    keyword_volume: 3200,
    ad_position: 4,
    revenue_at_risk_monthly: 0,
    first_seen_at: "2026-02-22T14:00:00Z",
    last_seen_at: "2026-03-07T11:00:00Z",
  },
  {
    id: "t-06",
    domain: "supplement-beam.shop",
    threat_type: "paid_ad",
    severity_score: 55,
    status: "takedown_submitted",
    keyword_volume: 2800,
    ad_position: 3,
    revenue_at_risk_monthly: 0,
    first_seen_at: "2026-02-08T10:00:00Z",
    last_seen_at: "2026-03-05T16:00:00Z",
  },
  {
    id: "t-07",
    domain: "beamhealth.store",
    threat_type: "organic_clone",
    severity_score: 48,
    status: "detected",
    keyword_volume: 1900,
    ad_position: 5,
    revenue_at_risk_monthly: 0,
    first_seen_at: "2026-02-25T09:00:00Z",
    last_seen_at: "2026-03-09T13:00:00Z",
  },
  {
    id: "t-08",
    domain: "beam-supplements.info",
    threat_type: "organic_clone",
    severity_score: 44,
    status: "resolved",
    keyword_volume: 1400,
    ad_position: 6,
    revenue_at_risk_monthly: 0,
    first_seen_at: "2026-01-20T08:00:00Z",
    last_seen_at: "2026-02-28T10:00:00Z",
  },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const STATUS_MAP = {
  detected:           { label: "Detected",   bg: "#FEF2F2", color: "#DC2626" },
  confirmed:          { label: "Confirmed",  bg: "#FEF2F2", color: "#DC2626" },
  investigating:      { label: "Investigating", bg: "#FFFBEB", color: "#D97706" },
  takedown_pending:   { label: "Pending",    bg: "#EFF6FF", color: "#2563EB" },
  takedown_submitted: { label: "Submitted",  bg: "#F5F3FF", color: "#7C3AED" },
  resolved:           { label: "Resolved",   bg: "#F0FDF4", color: "#16A34A" },
  dismissed:          { label: "Dismissed",  bg: "#F1F5F9", color: "#94A3B8" },
};

const TYPE_LABEL = {
  paid_ad:             "Paid Ad",
  organic_clone:       "Clone",
  organic_misleading:  "Misleading",
  shopping_listing:    "Shopping",
};

const TYPE_ICON = {
  paid_ad:             "💰",
  organic_clone:       "👥",
  organic_misleading:  "⚠️",
  shopping_listing:    "🛒",
};

function severityColor(s) {
  if (s >= 70) return "#EF4444";
  if (s >= 40) return "#F59E0B";
  return "#22C55E";
}

function severityBg(s) {
  if (s >= 70) return "#FEF2F2";
  if (s >= 40) return "#FFFBEB";
  return "#F0FDF4";
}

function severityLabel(s) {
  if (s >= 70) return "Critical";
  if (s >= 40) return "Moderate";
  return "Low";
}

function fmt$(n) {
  if (!n || n === 0) return "$0";
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

function fmtNum(n) {
  if (!n || n === 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ThreatsPage() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("severity");
  const [sortDir, setSortDir] = useState("desc");
  const [assumptions, setAssumptions] = useState({ aov: DEFAULT_AOV, conversionRate: DEFAULT_CONVERSION_RATE });
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Load saved assumptions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("brandshield_assumptions");
      if (saved) setAssumptions(JSON.parse(saved));
    } catch (e) {}
  }, []);

  // Fetch threats
  useEffect(() => {
    const brandId = localStorage.getItem("brandshield_brand_id") || "";
    const orgId = localStorage.getItem("brandshield_org_id") || "";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://brave-embrace-production-f71d.up.railway.app";

    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/brands/${brandId}/threats`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setThreats(data.threats || data);
      } catch {
        setThreats(MOCK_THREATS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter + sort
  const filtered = threats
    .filter(t => statusFilter === "all" || t.status === statusFilter)
    .filter(t => typeFilter === "all" || t.threat_type === typeFilter)
    .sort((a, b) => {
      let av, bv;
      if (sortBy === "severity") { av = a.severity_score; bv = b.severity_score; }
      else if (sortBy === "revenue") { av = calcRevenue(a, assumptions); bv = calcRevenue(b, assumptions); }
      else if (sortBy === "traffic") { av = a.keyword_volume || 0; bv = b.keyword_volume || 0; }
      else if (sortBy === "first_seen") { av = new Date(a.first_seen_at); bv = new Date(b.first_seen_at); }
      else { av = new Date(a.last_seen_at); bv = new Date(b.last_seen_at); }
      return sortDir === "desc" ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
    });

  const activeThreats = threats.filter(t => !["resolved", "dismissed"].includes(t.status));
  const totalRevAtRisk = activeThreats.reduce((sum, t) => sum + calcRevenue(t, assumptions), 0);
  const totalTraffic = activeThreats.reduce((sum, t) => sum + calcEstimatedClicks(t), 0);
  const totalSales = activeThreats.reduce((sum, t) => sum + calcEstimatedSales(t, assumptions), 0);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span style={{ opacity: 0.3, fontSize: 10 }}>↕</span>;
    return <span style={{ fontSize: 10 }}>{sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  if (loading) {
    return (
      <div style={{ padding: "32px" }}>
        <div style={{ height: 28, width: 200, background: "#E2E8F0", borderRadius: 6, marginBottom: 24 }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: 56, background: "#F8FAFC", borderRadius: 8, marginBottom: 8, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: 0 }}>Threat Queue</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            {activeThreats.length} active threat{activeThreats.length !== 1 ? "s" : ""} detected
          </p>
        </div>
        <button
          onClick={() => setShowAssumptions(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0",
            background: showAssumptions ? "#F8FAFC" : "white",
            fontSize: 13, color: "#475569", cursor: "pointer", fontWeight: 500,
          }}
        >
          ⚙️ Revenue Assumptions
        </button>
      </div>

      {/* ── Revenue Assumptions Panel ── */}
      {showAssumptions && (
        <div style={{
          background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12,
          padding: "16px 20px", marginBottom: 20,
          display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>📐 Revenue calculation assumptions</span>
          <label style={{ fontSize: 13, color: "#78350F", display: "flex", alignItems: "center", gap: 8 }}>
            AOV
            <input
              type="number"
              value={assumptions.aov}
              onChange={e => {
                const v = { ...assumptions, aov: parseFloat(e.target.value) || DEFAULT_AOV };
                setAssumptions(v);
                localStorage.setItem("brandshield_assumptions", JSON.stringify(v));
              }}
              style={{ width: 80, padding: "4px 8px", borderRadius: 6, border: "1px solid #FCD34D", fontSize: 13 }}
            />
          </label>
          <label style={{ fontSize: 13, color: "#78350F", display: "flex", alignItems: "center", gap: 8 }}>
            Conv. Rate
            <input
              type="number"
              step="0.001"
              value={assumptions.conversionRate}
              onChange={e => {
                const v = { ...assumptions, conversionRate: parseFloat(e.target.value) || DEFAULT_CONVERSION_RATE };
                setAssumptions(v);
                localStorage.setItem("brandshield_assumptions", JSON.stringify(v));
              }}
              style={{ width: 80, padding: "4px 8px", borderRadius: 6, border: "1px solid #FCD34D", fontSize: 13 }}
            />
          </label>
          <span style={{ fontSize: 12, color: "#A16207" }}>
            Formula: Volume × CTR × Conv.Rate × AOV — changes apply instantly
          </span>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Monthly Revenue at Risk", value: `$${totalRevAtRisk.toLocaleString()}`, sub: "across all active threats", accent: "#DC2626", bg: "#FEF2F2" },
          { label: "Est. Monthly Stolen Traffic", value: fmtNum(totalTraffic), sub: "diverted clicks/month", accent: "#D97706", bg: "#FFFBEB" },
          { label: "Est. Lost Sales / Month", value: fmtNum(totalSales), sub: "estimated lost conversions", accent: "#7C3AED", bg: "#F5F3FF" },
        ].map(card => (
          <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.accent}22`, borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: card.accent, fontVariantNumeric: "tabular-nums" }}>{card.value}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{card.label}</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, color: "#374151", background: "white" }}
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, color: "#374151", background: "white" }}
        >
          <option value="all">All Types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div style={{ marginLeft: "auto", fontSize: 13, color: "#94A3B8", display: "flex", alignItems: "center" }}>
          {filtered.length} of {threats.length} threats
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              {[
                { label: "Domain", key: null, width: "22%" },
                { label: "Type", key: null, width: "9%" },
                { label: "Severity", key: "severity", width: "9%" },
                { label: "Monthly Traffic", key: "traffic", width: "12%" },
                { label: "Est. Sales / mo", key: null, width: "11%" },
                { label: "Revenue at Risk", key: "revenue", width: "13%" },
                { label: "Status", key: null, width: "10%" },
                { label: "First Seen", key: "first_seen", width: "9%" },
                { label: "Last Seen", key: "last_seen", width: "9%" },
              ].map(col => (
                <th
                  key={col.label}
                  onClick={() => col.key && handleSort(col.key)}
                  style={{
                    padding: "10px 14px", textAlign: "left", fontSize: 11,
                    fontWeight: 600, color: "#64748B", letterSpacing: "0.05em",
                    textTransform: "uppercase", width: col.width,
                    cursor: col.key ? "pointer" : "default",
                    userSelect: "none",
                  }}
                >
                  {col.label} {col.key && <SortIcon col={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((threat, i) => {
              const revenue = calcRevenue(threat, assumptions);
              const traffic = calcEstimatedClicks(threat);
              const sales = calcEstimatedSales(threat, assumptions);
              const isResolved = ["resolved", "dismissed"].includes(threat.status);
              const sColor = severityColor(threat.severity_score);
              const status = STATUS_MAP[threat.status] || STATUS_MAP.detected;

              return (
                <tr
                  key={threat.id}
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                    background: i % 2 === 0 ? "white" : "#FAFAFA",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F0F9FF"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "white" : "#FAFAFA"}
                >
                  {/* Domain */}
                  <td style={{ padding: "12px 14px" }}>
                    <Link
                      href={`/threats/${threat.id}`}
                      style={{ color: "#1E40AF", fontWeight: 600, fontSize: 13, textDecoration: "none", fontFamily: "monospace" }}
                    >
                      {threat.domain}
                    </Link>
                  </td>

                  {/* Type */}
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 12, color: "#374151" }}>
                      {TYPE_ICON[threat.threat_type] || "🔍"} {TYPE_LABEL[threat.threat_type] || threat.threat_type}
                    </span>
                  </td>

                  {/* Severity */}
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        display: "inline-block", minWidth: 32, padding: "2px 8px",
                        borderRadius: 6, background: severityBg(threat.severity_score),
                        color: sColor, fontSize: 13, fontWeight: 700, textAlign: "center",
                      }}>
                        {threat.severity_score}
                      </span>
                    </div>
                  </td>

                  {/* Monthly Traffic */}
                  <td style={{ padding: "12px 14px" }}>
                    {isResolved ? (
                      <span style={{ color: "#94A3B8", fontSize: 13 }}>—</span>
                    ) : (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>
                          {fmtNum(traffic)}
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>
                          clicks/mo
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Est. Sales */}
                  <td style={{ padding: "12px 14px" }}>
                    {isResolved ? (
                      <span style={{ color: "#94A3B8", fontSize: 13 }}>—</span>
                    ) : (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#7C3AED", fontVariantNumeric: "tabular-nums" }}>
                          {fmtNum(sales)}
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>
                          conversions/mo
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Revenue at Risk */}
                  <td style={{ padding: "12px 14px" }}>
                    {isResolved ? (
                      <span style={{ color: "#94A3B8", fontSize: 13 }}>—</span>
                    ) : (
                      <div>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: revenue > 1000 ? "#DC2626" : revenue > 500 ? "#D97706" : "#22C55E",
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {fmt$(revenue)}/mo
                        </div>
                        {!(threat.revenue_at_risk_monthly > 0) && (
                          <div style={{ fontSize: 10, color: "#94A3B8" }}>estimated</div>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 20,
                      background: status.bg, color: status.color,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {status.label}
                    </span>
                  </td>

                  {/* First Seen */}
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748B" }}>
                    {timeAgo(threat.first_seen_at)}
                  </td>

                  {/* Last Seen */}
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748B" }}>
                    {timeAgo(threat.last_seen_at)}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                  No threats match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer note ── */}
      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 12, textAlign: "right" }}>
        Revenue estimates use: AOV ${assumptions.aov} · Conv. rate {(assumptions.conversionRate * 100).toFixed(1)}% · Position-based CTR curves.
        {" "}<button onClick={() => setShowAssumptions(true)} style={{ background: "none", border: "none", color: "#3B82F6", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>
          Adjust assumptions
        </button>
      </p>
    </div>
  );
}
