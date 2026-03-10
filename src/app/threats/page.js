"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Shared Revenue Logic (inline copy — also put in src/lib/revenue.js) ───
const DEFAULTS = { aov: 70, conversionRate: 0.028 };
const CTR_CURVES = {
  paid:     { 1: 0.070, 2: 0.035, 3: 0.025, 4: 0.018, 5: 0.012, 6: 0.008 },
  shopping: { 1: 0.050, 2: 0.038, 3: 0.028, 4: 0.020, 5: 0.014 },
  organic:  { 1: 0.280, 2: 0.150, 3: 0.110, 4: 0.080, 5: 0.060, 6: 0.050, 7: 0.040, 8: 0.030 },
};
function getCTR(threatType, position = 2) {
  const curve = threatType === "paid_ad" ? CTR_CURVES.paid : threatType === "shopping_listing" ? CTR_CURVES.shopping : CTR_CURVES.organic;
  const keys = Object.keys(curve);
  return curve[position] ?? curve[keys[keys.length - 1]];
}
function calcRevenue(t, a = DEFAULTS) {
  if (t.revenue_at_risk_monthly > 0) return t.revenue_at_risk_monthly;
  const vol = t.keyword_volume || t.monthly_volume || t.search_volume || 0;
  if (!vol) return 0;
  return Math.round(vol * getCTR(t.threat_type, t.ad_position || 2) * (a.conversionRate ?? DEFAULTS.conversionRate) * (a.aov ?? DEFAULTS.aov));
}
function calcClicks(t) {
  const vol = t.keyword_volume || t.monthly_volume || t.search_volume || 0;
  return Math.round(vol * getCTR(t.threat_type, t.ad_position || 2));
}
function calcSales(t, a = DEFAULTS) {
  return Math.round(calcClicks(t) * (a.conversionRate ?? DEFAULTS.conversionRate));
}
function loadAssumptions() {
  try {
    const r = localStorage.getItem("brandshield_assumptions");
    if (!r) return { aov: DEFAULTS.aov, conversionRate: DEFAULTS.conversionRate };
    const parsed = JSON.parse(r);
    return {
      aov: parseFloat(parsed.aov) || DEFAULTS.aov,
      conversionRate: parseFloat(parsed.conversionRate) || DEFAULTS.conversionRate,
    };
  } catch { return { aov: DEFAULTS.aov, conversionRate: DEFAULTS.conversionRate }; }
}
function saveAssumptions(a) {
  try { localStorage.setItem("brandshield_assumptions", JSON.stringify(a)); } catch {}
}

// ─── Constants ───
const STATUS_MAP = {
  detected:           { label: "Detected",      bg: "#FEF2F2", color: "#DC2626" },
  confirmed:          { label: "Confirmed",     bg: "#FEF2F2", color: "#DC2626" },
  investigating:      { label: "Investigating", bg: "#FFFBEB", color: "#D97706" },
  takedown_pending:   { label: "Pending",       bg: "#EFF6FF", color: "#2563EB" },
  takedown_submitted: { label: "Submitted",     bg: "#F5F3FF", color: "#7C3AED" },
  resolved:           { label: "Resolved",      bg: "#F0FDF4", color: "#16A34A" },
  dismissed:          { label: "Dismissed",     bg: "#F1F5F9", color: "#94A3B8" },
};
const TYPE_LABEL = { paid_ad: "Paid Ad", organic_clone: "Clone", organic_misleading: "Misleading", shopping_listing: "Shopping" };
const TYPE_ICON  = { paid_ad: "💰", organic_clone: "👥", organic_misleading: "⚠️", shopping_listing: "🛒" };

function sColor(s) { return s >= 70 ? "#EF4444" : s >= 40 ? "#F59E0B" : "#22C55E"; }
function sBg(s)    { return s >= 70 ? "#FEF2F2" : s >= 40 ? "#FFFBEB" : "#F0FDF4"; }
function fmt$(n)   { if (!n) return "$0"; return n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toLocaleString()}`; }
function fmtN(n)   { if (!n) return "—"; return n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toLocaleString(); }
function ago(d)    { if (!d) return "—"; const days = Math.floor((Date.now() - new Date(d)) / 86400000); return days === 0 ? "Today" : days === 1 ? "Yesterday" : days < 7 ? `${days}d ago` : days < 30 ? `${Math.floor(days/7)}w ago` : `${Math.floor(days/30)}mo ago`; }

// ─── Mock Data ───
const MOCK = [
  { id:"t-01", domain:"beam-supplements-official.com",  threat_type:"paid_ad",            severity_score:94, status:"detected",           keyword_volume:12400, ad_position:2, revenue_at_risk_monthly:0, first_seen_at:"2026-02-12T09:00:00Z", last_seen_at:"2026-03-10T14:00:00Z" },
  { id:"t-02", domain:"beamsupplements-store.com",      threat_type:"organic_clone",       severity_score:87, status:"confirmed",           keyword_volume:8100,  ad_position:3, revenue_at_risk_monthly:0, first_seen_at:"2026-02-14T11:00:00Z", last_seen_at:"2026-03-09T16:00:00Z" },
  { id:"t-03", domain:"buy-beam-cheap.com",             threat_type:"paid_ad",            severity_score:76, status:"takedown_pending",    keyword_volume:5400,  ad_position:1, revenue_at_risk_monthly:0, first_seen_at:"2026-02-18T08:00:00Z", last_seen_at:"2026-03-08T12:00:00Z" },
  { id:"t-04", domain:"beamwellness-deals.shop",        threat_type:"shopping_listing",   severity_score:71, status:"detected",           keyword_volume:4200,  ad_position:2, revenue_at_risk_monthly:0, first_seen_at:"2026-02-20T10:00:00Z", last_seen_at:"2026-03-10T09:00:00Z" },
  { id:"t-05", domain:"official-beam-supplements.net",  threat_type:"organic_misleading", severity_score:62, status:"detected",           keyword_volume:3200,  ad_position:4, revenue_at_risk_monthly:0, first_seen_at:"2026-02-22T14:00:00Z", last_seen_at:"2026-03-07T11:00:00Z" },
  { id:"t-06", domain:"supplement-beam.shop",           threat_type:"paid_ad",            severity_score:55, status:"takedown_submitted", keyword_volume:2800,  ad_position:3, revenue_at_risk_monthly:0, first_seen_at:"2026-02-08T10:00:00Z", last_seen_at:"2026-03-05T16:00:00Z" },
  { id:"t-07", domain:"beamhealth.store",               threat_type:"organic_clone",       severity_score:48, status:"detected",           keyword_volume:1900,  ad_position:5, revenue_at_risk_monthly:0, first_seen_at:"2026-02-25T09:00:00Z", last_seen_at:"2026-03-09T13:00:00Z" },
  { id:"t-08", domain:"beam-supplements.info",          threat_type:"organic_clone",       severity_score:44, status:"resolved",           keyword_volume:1400,  ad_position:6, revenue_at_risk_monthly:0, first_seen_at:"2026-01-20T08:00:00Z", last_seen_at:"2026-02-28T10:00:00Z" },
];

// ─── Main Component ───
export default function ThreatsPage() {
  const [threats, setThreats]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatus]     = useState("all");
  const [typeFilter, setType]         = useState("all");
  const [sortBy, setSortBy]           = useState("severity");
  const [sortDir, setSortDir]         = useState("desc");
  const [assumptions, setAssumptions] = useState(DEFAULTS);
  const [showPanel, setShowPanel]     = useState(false);

  useEffect(() => { setAssumptions(loadAssumptions()); }, []);

  useEffect(() => {
    const brandId = localStorage.getItem("brandshield_brand_id") || "";
    const api = process.env.NEXT_PUBLIC_API_URL || "https://brave-embrace-production-f71d.up.railway.app";
    fetch(`${api}/api/v1/brands/${brandId}/threats`, { headers: { "Content-Type": "application/json" } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setThreats(d.threats || d))
      .catch(() => setThreats(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const setA = (key, val) => {
    const next = { ...assumptions, [key]: parseFloat(val) || DEFAULTS[key] };
    setAssumptions(next);
    saveAssumptions(next);
  };

  const handleSort = col => { sortBy === col ? setSortDir(d => d === "desc" ? "asc" : "desc") : (setSortBy(col), setSortDir("desc")); };

  const filtered = threats
    .filter(t => statusFilter === "all" || t.status === statusFilter)
    .filter(t => typeFilter   === "all" || t.threat_type === typeFilter)
    .sort((a, b) => {
      const av = sortBy === "severity" ? a.severity_score : sortBy === "revenue" ? calcRevenue(a, assumptions) : sortBy === "traffic" ? (a.keyword_volume||0) : new Date(a[sortBy === "first" ? "first_seen_at" : "last_seen_at"]);
      const bv = sortBy === "severity" ? b.severity_score : sortBy === "revenue" ? calcRevenue(b, assumptions) : sortBy === "traffic" ? (b.keyword_volume||0) : new Date(b[sortBy === "first" ? "first_seen_at" : "last_seen_at"]);
      return sortDir === "desc" ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
    });

  const active = threats.filter(t => !["resolved","dismissed"].includes(t.status));
  const totalRev     = active.reduce((s, t) => s + calcRevenue(t, assumptions), 0);
  const totalClicks  = active.reduce((s, t) => s + calcClicks(t), 0);
  const totalSales   = active.reduce((s, t) => s + calcSales(t, assumptions), 0);

  const Th = ({ label, col, w }) => (
    <th onClick={() => col && handleSort(col)} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:600, color:"#64748B", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap", cursor:col?"pointer":"default", minWidth:w||"auto" }}>
      {label}{col && <span style={{ marginLeft:4, opacity: sortBy===col?1:0.3, fontSize:10 }}>{sortBy===col?(sortDir==="desc"?"↓":"↑"):"↕"}</span>}
    </th>
  );

  if (loading) return (
    <div style={{ padding:32 }}>
      <div style={{ height:28, width:200, background:"#E2E8F0", borderRadius:6, marginBottom:24 }} />
      {[...Array(6)].map((_,i) => <div key={i} style={{ height:56, background:"#F8FAFC", borderRadius:8, marginBottom:8 }} />)}
    </div>
  );

  return (
    <div style={{ padding:"28px 32px" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, color:"#0F172A", margin:0 }}>Threat Queue</h1>
          <p style={{ fontSize:13, color:"#64748B", marginTop:4 }}>{active.length} active threat{active.length!==1?"s":""} detected</p>
        </div>
        <button onClick={() => setShowPanel(v => !v)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, border:"1px solid #E2E8F0", background:showPanel?"#F8FAFC":"white", fontSize:13, color:"#475569", cursor:"pointer", fontWeight:500 }}>
          ⚙️ Revenue Assumptions
        </button>
      </div>

      {/* Assumptions Panel */}
      {showPanel && (
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12, padding:"14px 20px", marginBottom:20, display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:13, color:"#92400E", fontWeight:600 }}>📐 Revenue assumptions</span>
          <label style={{ fontSize:13, color:"#78350F", display:"flex", alignItems:"center", gap:8 }}>
            AOV ($) <input type="number" value={assumptions.aov} onChange={e => setA("aov", e.target.value)} style={{ width:80, padding:"4px 8px", borderRadius:6, border:"1px solid #FCD34D", fontSize:13 }} />
          </label>
          <label style={{ fontSize:13, color:"#78350F", display:"flex", alignItems:"center", gap:8 }}>
            Conv. Rate <input type="number" step="0.001" value={assumptions.conversionRate} onChange={e => setA("conversionRate", e.target.value)} style={{ width:80, padding:"4px 8px", borderRadius:6, border:"1px solid #FCD34D", fontSize:13 }} />
          </label>
          <span style={{ fontSize:12, color:"#A16207" }}>Formula: Volume × CTR × Conv.Rate × AOV · Saved automatically · Syncs with detail page</span>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Monthly Revenue at Risk",    val:`$${totalRev.toLocaleString()}`,   sub:"across all active threats",    accent:"#DC2626", bg:"#FEF2F2" },
          { label:"Est. Monthly Stolen Traffic", val:fmtN(totalClicks),                sub:"diverted clicks/month",        accent:"#D97706", bg:"#FFFBEB" },
          { label:"Est. Lost Sales / Month",     val:fmtN(totalSales),                 sub:"estimated lost conversions",   accent:"#7C3AED", bg:"#F5F3FF" },
        ].map(c => (
          <div key={c.label} style={{ background:c.bg, border:`1px solid ${c.accent}22`, borderRadius:12, padding:"16px 20px" }}>
            <div style={{ fontSize:26, fontWeight:700, color:c.accent, fontVariantNumeric:"tabular-nums" }}>{c.val}</div>
            <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{c.label}</div>
            <div style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)} style={{ padding:"7px 12px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, color:"#374151", background:"white" }}>
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setType(e.target.value)} style={{ padding:"7px 12px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, color:"#374151", background:"white" }}>
          <option value="all">All Types</option>
          {Object.entries(TYPE_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span style={{ marginLeft:"auto", fontSize:13, color:"#94A3B8" }}>{filtered.length} of {threats.length} threats</span>
      </div>

      {/* Scrollable Table Wrapper */}
      <div style={{ background:"white", border:"1px solid #E2E8F0", borderRadius:12, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
          <thead>
            <tr style={{ background:"#F8FAFC", borderBottom:"1px solid #E2E8F0" }}>
              <Th label="Domain"          col={null}      w={200} />
              <Th label="Type"            col={null}      w={110} />
              <Th label="Severity"        col="severity"  w={90}  />
              <Th label="Monthly Traffic" col="traffic"   w={130} />
              <Th label="Est. Sales/mo"   col={null}      w={120} />
              <Th label="Revenue at Risk" col="revenue"   w={140} />
              <Th label="Status"          col={null}      w={110} />
              <Th label="First Seen"      col="first"     w={100} />
              <Th label="Last Seen"       col="last"      w={100} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const rev    = calcRevenue(t, assumptions);
              const clicks = calcClicks(t);
              const sales  = calcSales(t, assumptions);
              const gone   = ["resolved","dismissed"].includes(t.status);
              const st     = STATUS_MAP[t.status] || STATUS_MAP.detected;

              return (
                <tr key={t.id}
                  style={{ borderBottom:"1px solid #F1F5F9", background:i%2===0?"white":"#FAFAFA" }}
                  onMouseEnter={e => e.currentTarget.style.background="#F0F9FF"}
                  onMouseLeave={e => e.currentTarget.style.background=i%2===0?"white":"#FAFAFA"}
                >
                  {/* Domain */}
                  <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                    <Link href={`/threats/${t.id}`} style={{ color:"#1E40AF", fontWeight:600, fontSize:13, textDecoration:"none", fontFamily:"monospace" }}>
                      {t.domain}
                    </Link>
                  </td>

                  {/* Type */}
                  <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                    <span style={{ fontSize:12, color:"#374151" }}>{TYPE_ICON[t.threat_type]||"🔍"} {TYPE_LABEL[t.threat_type]||t.threat_type}</span>
                  </td>

                  {/* Severity */}
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ display:"inline-block", minWidth:36, padding:"2px 8px", borderRadius:6, background:sBg(t.severity_score), color:sColor(t.severity_score), fontSize:13, fontWeight:700, textAlign:"center" }}>
                      {t.severity_score}
                    </span>
                  </td>

                  {/* Monthly Traffic */}
                  <td style={{ padding:"12px 16px" }}>
                    {gone ? <span style={{ color:"#94A3B8" }}>—</span> : (
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#0F172A", fontVariantNumeric:"tabular-nums" }}>{fmtN(clicks)}</div>
                        <div style={{ fontSize:11, color:"#94A3B8" }}>clicks/mo</div>
                      </div>
                    )}
                  </td>

                  {/* Est. Sales */}
                  <td style={{ padding:"12px 16px" }}>
                    {gone ? <span style={{ color:"#94A3B8" }}>—</span> : (
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#7C3AED", fontVariantNumeric:"tabular-nums" }}>{fmtN(sales)}</div>
                        <div style={{ fontSize:11, color:"#94A3B8" }}>conversions/mo</div>
                      </div>
                    )}
                  </td>

                  {/* Revenue at Risk */}
                  <td style={{ padding:"12px 16px" }}>
                    {gone ? <span style={{ color:"#94A3B8" }}>—</span> : (
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:rev>1000?"#DC2626":rev>400?"#D97706":"#16A34A", fontVariantNumeric:"tabular-nums" }}>
                          {fmt$(rev)}/mo
                        </div>
                        {!(t.revenue_at_risk_monthly > 0) && <div style={{ fontSize:10, color:"#94A3B8" }}>estimated</div>}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                    <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, background:st.bg, color:st.color, fontSize:11, fontWeight:600 }}>{st.label}</span>
                  </td>

                  {/* First Seen */}
                  <td style={{ padding:"12px 16px", fontSize:12, color:"#64748B", whiteSpace:"nowrap" }}>{ago(t.first_seen_at)}</td>

                  {/* Last Seen */}
                  <td style={{ padding:"12px 16px", fontSize:12, color:"#64748B", whiteSpace:"nowrap" }}>{ago(t.last_seen_at)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding:48, textAlign:"center", color:"#94A3B8", fontSize:14 }}>No threats match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize:11, color:"#94A3B8", marginTop:10, textAlign:"right" }}>
        AOV ${Number(assumptions.aov)} · Conv. {(Number(assumptions.conversionRate)*100).toFixed(1)}% · Position-based CTR curves ·{" "}
        <button onClick={() => setShowPanel(true)} style={{ background:"none", border:"none", color:"#3B82F6", cursor:"pointer", fontSize:11, textDecoration:"underline" }}>Adjust</button>
      </p>
    </div>
  );
}
