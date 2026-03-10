"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Shared Revenue Logic (same as threats/page.js) ───────────────────────
const DEFAULTS = { aov: 70, conversionRate: 0.028 };
const CTR_CURVES = {
  paid:     { 1: 0.070, 2: 0.035, 3: 0.025, 4: 0.018, 5: 0.012, 6: 0.008 },
  shopping: { 1: 0.050, 2: 0.038, 3: 0.028, 4: 0.020, 5: 0.014 },
  organic:  { 1: 0.280, 2: 0.150, 3: 0.110, 4: 0.080, 5: 0.060, 6: 0.050, 7: 0.040, 8: 0.030 },
};
function getCTR(threatType, position = 2) {
  const curve = threatType === "paid_ad" ? CTR_CURVES.paid : threatType === "shopping_listing" ? CTR_CURVES.shopping : CTR_CURVES.organic;
  return curve[position] ?? curve[Object.keys(curve).at(-1)];
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
  try { const r = typeof window !== "undefined" && localStorage.getItem("brandshield_assumptions"); return r ? { ...DEFAULTS, ...JSON.parse(r) } : { ...DEFAULTS }; } catch { return { ...DEFAULTS }; }
}
function saveAssumptions(a) { try { localStorage.setItem("brandshield_assumptions", JSON.stringify(a)); } catch {} }

// ─── Mock threat ────────────────────────────────────────────────────────────
const MOCK_THREAT = {
  id: "t-01",
  domain: "beam-supplements-official.com",
  threat_type: "paid_ad",
  severity_score: 94,
  status: "detected",
  keyword_volume: 12400,
  ad_position: 2,
  revenue_at_risk_monthly: 0,
  first_seen_at: "2026-02-12T09:00:00Z",
  last_seen_at: "2026-03-10T14:00:00Z",
  similarity: { text: 0.78, visual: 0.64, domain: 0.85 },
  keywords: ["beam supplements", "beam official", "buy beam", "beam coupon"],
  ad_copy: {
    title: "Beam Supplements™ – Official Store | 60% Off Today",
    description: "Shop the official Beam Supplements collection. Premium health & wellness products. Free shipping on orders over $50.",
    display_url: "beam-supplements-official.com/shop",
    position: 2,
    keyword: "beam supplements",
  },
  whois: {
    registrar: "Namecheap, Inc.",
    registered: "2026-01-15",
    age_days: 54,
    ip: "104.21.38.72",
    hosting: "Cloudflare, Inc.",
    country: "US",
    ssl_issuer: "Let's Encrypt",
    privacy_protected: true,
  },
  takedown_channels: [
    { channel: "Google Ads Trademark Complaint", reason: "Paid ad using brand trademark", applicable: true },
    { channel: "Domain Registrar Abuse Report", reason: "Domain designed to impersonate brand", applicable: true },
    { channel: "Direct DMCA to Site Operator", reason: "Copied product content detected", applicable: true },
  ],
};

function sColor(s) { return s >= 70 ? "#EF4444" : s >= 40 ? "#F59E0B" : "#22C55E"; }
function scLabel(s) { return s >= 70 ? "Critical" : s >= 40 ? "Moderate" : "Low"; }

function Bar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#475569" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{Math.round(value * 100)}%</span>
      </div>
      <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value * 100}%`, background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

export default function ThreatDetailPage({ params }) {
  const [threat, setThreat]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("evidence");
  const [assumptions, setAssump]  = useState(DEFAULTS);
  const [editingA, setEditingA]   = useState(false);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    setMounted(true);
    setAssump(loadAssumptions());
  }, []);

  useEffect(() => {
    if (!params?.id) { setThreat(MOCK_THREAT); setLoading(false); return; }
    const api = process.env.NEXT_PUBLIC_API_URL || "https://brave-embrace-production-f71d.up.railway.app";
    fetch(`${api}/api/v1/threats/${params.id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setThreat(d))
      .catch(() => setThreat(MOCK_THREAT))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const setA = (key, val) => {
    const next = { ...assumptions, [key]: parseFloat(val) || DEFAULTS[key] };
    setAssump(next);
    saveAssumptions(next);
  };

  if (loading) return <div style={{ padding: 32, color: "#94A3B8" }}>Loading threat details…</div>;
  if (!threat)  return <div style={{ padding: 32, color: "#EF4444" }}>Threat not found.</div>;

  const T = threat;
  const revenue = calcRevenue(T, assumptions);
  const clicks  = calcClicks(T);
  const sales   = calcSales(T, assumptions);
  const ctr     = getCTR(T.threat_type, T.ad_position || 2);
  const vol     = T.keyword_volume || T.monthly_volume || T.search_volume || 0;
  const TYPE_LABEL = { paid_ad: "Paid Ad", organic_clone: "Clone", organic_misleading: "Misleading", shopping_listing: "Shopping" };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

      {/* Back */}
      <Link href="/threats" style={{ fontSize: 13, color: "#2563EB", textDecoration: "none", fontWeight: 500, display: "inline-block", marginBottom: 16 }}>
        ← Back to Threats
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, opacity: mounted ? 1 : 0, transition: "opacity 0.3s" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "monospace", color: "#0F172A" }}>{T.domain}</h1>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: sColor(T.severity_score) === "#EF4444" ? "#FEF2F2" : "#FFFBEB", color: sColor(T.severity_score) }}>
              {scLabel(T.severity_score)} · {T.severity_score}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#94A3B8", flexWrap: "wrap" }}>
            <span>Type: <strong style={{ color: "#64748B" }}>{TYPE_LABEL[T.threat_type] || T.threat_type}</strong></span>
            <span>First: <strong style={{ color: "#64748B" }}>{new Date(T.first_seen_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}</strong></span>
            <span>Revenue: <strong style={{ color: "#EF4444" }}>${revenue.toLocaleString()}/mo</strong></span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#DC2626", color: "white" }}>Initiate Takedown</button>
          <button style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>Dismiss</button>
          <button style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>Whitelist</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", marginBottom: 24 }}>
        {[["evidence","Evidence"],["takedowns","Takedowns"],["history","History"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "10px 20px", fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer", background: "transparent", color: tab === k ? "#2563EB" : "#94A3B8", borderBottom: `2px solid ${tab === k ? "#2563EB" : "transparent"}`, marginBottom: -1 }}>
            {l}
          </button>
        ))}
      </div>

      {tab === "evidence" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Visual Comparison */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "#0F172A" }}>Visual Comparison</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "YOUR SITE — BEAMSUPPLEMENTS.COM", domain: "beamsupplements.com", color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC" },
                  { label: "BAD ACTOR", domain: T.domain, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
                ].map(s => (
                  <div key={s.label} style={{ border: `1.5px solid ${s.border}`, borderRadius: 12, padding: 12, background: s.bg }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: s.color, marginBottom: 8, letterSpacing: "0.05em" }}>{s.label}</div>
                    <div style={{ background: "white", borderRadius: 8, padding: 10, minHeight: 160 }}>
                      {[80,60,90,40,70].map((w,i) => (
                        <div key={i} style={{ height: i===2?40:10, width:`${w}%`, background: s.color === "#DC2626" ? "#FECACA" : "#BBF7D0", borderRadius: 4, marginBottom: 8 }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 8, fontFamily: "monospace" }}>{s.domain}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Captured Ad */}
            {T.ad_copy && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "#0F172A" }}>Captured Ad</h3>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16, border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 11, color: "#16A34A", marginBottom: 4 }}>Sponsored · {T.ad_copy.display_url}</div>
                  <div style={{ fontSize: 16, color: "#1558D6", fontWeight: 500, marginBottom: 6 }}>{T.ad_copy.title}</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{T.ad_copy.description}</div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#94A3B8" }}>
                    Position: <strong style={{ color: "#DC2626" }}>#{T.ad_copy.position}</strong> &nbsp;·&nbsp; Keyword: <strong style={{ color: "#475569" }}>"{T.ad_copy.keyword}"</strong>
                  </div>
                </div>
              </div>
            )}

            {/* WHOIS */}
            {T.whois && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "#0F172A" }}>Domain Intelligence</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    ["Registrar",    T.whois.registrar],
                    ["Registered",   T.whois.registered],
                    ["Domain Age",   `${T.whois.age_days} days old`],
                    ["IP Address",   T.whois.ip, true],
                    ["Hosting",      T.whois.hosting],
                    ["Country",      T.whois.country],
                    ["SSL Issuer",   T.whois.ssl_issuer],
                    ["Privacy",      T.whois.privacy_protected ? "Protected" : "Public"],
                  ].map(([label, val, highlight]) => (
                    <div key={label} style={{ padding: "8px 12px", background: "#F8FAFC", borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: highlight ? "#DC2626" : "#0F172A", fontFamily: highlight ? "monospace" : "inherit" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Revenue Card */}
            <div style={{ background: "#FEF2F2", borderRadius: 16, padding: 24, border: "1px solid #FECACA" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: "#DC2626", fontVariantNumeric: "tabular-nums" }}>
                  ${revenue.toLocaleString()}
                </div>
                <button onClick={() => setEditingA(v => !v)} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid #FECACA", background: "white", color: "#DC2626", cursor: "pointer", fontWeight: 500 }}>
                  ✏️ Edit
                </button>
              </div>
              <div style={{ fontSize: 13, color: "#991B1B", marginBottom: 16 }}>estimated monthly revenue at risk</div>

              {editingA && (
                <div style={{ background: "white", borderRadius: 10, padding: 12, marginBottom: 16, border: "1px solid #FECACA" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#991B1B", marginBottom: 10 }}>Adjust Assumptions</div>
                  {[
                    { label: "AOV ($)", key: "aov", step: "1" },
                    { label: "Conv. Rate", key: "conversionRate", step: "0.001" },
                  ].map(f => (
                    <label key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 13, color: "#7F1D1D" }}>
                      {f.label}
                      <input type="number" step={f.step} value={assumptions[f.key]} onChange={e => setA(f.key, e.target.value)}
                        style={{ width: 90, padding: "4px 8px", borderRadius: 6, border: "1px solid #FECACA", fontSize: 13 }} />
                    </label>
                  ))}
                  <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 4 }}>Changes sync to threat list automatically</div>
                </div>
              )}

              {/* Calculation breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  ["Keyword Volume",   `${vol.toLocaleString()}/mo`],
                  ["Est. CTR",         `${(ctr * 100).toFixed(1)}%`],
                  ["Conversion Rate",  `${(assumptions.conversionRate * 100).toFixed(1)}%`],
                  ["AOV",              `$${assumptions.aov.toFixed(2)}`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #FECACA22" }}>
                    <span style={{ fontSize: 13, color: "#991B1B" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#7F1D1D" }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Traffic + Sales metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
                <div style={{ background: "white", borderRadius: 10, padding: "10px 12px", border: "1px solid #FECACA" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#D97706", fontVariantNumeric: "tabular-nums" }}>
                    {clicks >= 1000 ? `${(clicks/1000).toFixed(1)}k` : clicks}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>est. clicks/mo</div>
                </div>
                <div style={{ background: "white", borderRadius: 10, padding: "10px 12px", border: "1px solid #FECACA" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#7C3AED", fontVariantNumeric: "tabular-nums" }}>
                    {sales}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>est. sales/mo</div>
                </div>
              </div>
            </div>

            {/* Similarity Scores */}
            {T.similarity && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px", color: "#0F172A" }}>Similarity Scores</h3>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 16px" }}>
                  Composite: <strong style={{ color: "#DC2626" }}>{T.severity_score}/100</strong>
                </p>
                <Bar label="Text Similarity"     value={T.similarity.text}   color={sColor(T.similarity.text   * 100)} />
                <Bar label="Visual Similarity"   value={T.similarity.visual} color={sColor(T.similarity.visual * 100)} />
                <Bar label="Domain Deceptiveness" value={T.similarity.domain} color={sColor(T.similarity.domain * 100)} />
              </div>
            )}

            {/* Detected On Keywords */}
            {T.keywords?.length > 0 && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: "#0F172A" }}>Detected On</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {T.keywords.map(k => (
                    <div key={k} style={{ padding: "8px 12px", borderRadius: 8, background: "#F8FAFB", border: "1px solid #F1F5F9", fontSize: 13, fontFamily: "monospace", color: "#475569" }}>
                      "{k}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Takedown Channels */}
            {T.takedown_channels?.length > 0 && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: "#0F172A" }}>Takedown Channels</h3>
                {T.takedown_channels.map((td, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: "#F8FAFB", border: "1px solid #F1F5F9", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{td.channel}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{td.reason}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 5, background: "#F1F5F9", color: "#94A3B8", whiteSpace: "nowrap" }}>Draft</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "takedowns" && (
        <div style={{ background: "white", borderRadius: 16, padding: 32, border: "1px solid #F1F5F9", color: "#94A3B8", textAlign: "center" }}>
          No takedowns initiated yet. Click <strong style={{ color: "#DC2626" }}>Initiate Takedown</strong> to begin.
        </div>
      )}

      {tab === "history" && (
        <div style={{ background: "white", borderRadius: 16, padding: 32, border: "1px solid #F1F5F9", color: "#94A3B8", textAlign: "center" }}>
          Detection history will appear here as monitoring continues.
        </div>
      )}
    </div>
  );
}
