"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://brave-embrace-production-f71d.up.railway.app";

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 30) return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h}h ago`;
  return "Just now";
}

function fmtDate(str) {
  if (!str) return "—";
  try { return new Date(str).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return str; }
}

function fmtCurrency(v) {
  return "$" + Number(v || 0).toLocaleString();
}

const C = {
  bg: "#F8FAFC", white: "#FFFFFF", border: "#E2E8F0", borderLight: "#F1F5F9",
  text: "#0F172A", textMid: "#475569", textSoft: "#94A3B8",
  red: "#EF4444", redLight: "#FEF2F2", redBorder: "#FECACA",
  amber: "#F59E0B", amberLight: "#FFFBEB",
  green: "#22C55E", greenLight: "#F0FDF4",
  blue: "#3B82F6", blueLight: "#EFF6FF",
};

function Card({ children, style = {} }) {
  return <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, ...style }}>{children}</div>;
}

function SeverityBadge({ score }) {
  const s = Number(score) || 0;
  if (s >= 70) return <span style={{ background: C.redLight, color: C.red, border: `1px solid ${C.redBorder}`, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Critical · {Math.round(s)}</span>;
  if (s >= 40) return <span style={{ background: C.amberLight, color: C.amber, border: "1px solid #FDE68A", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Moderate · {Math.round(s)}</span>;
  return <span style={{ background: C.greenLight, color: C.green, border: "1px solid #BBF7D0", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Low · {Math.round(s)}</span>;
}

function ScoreBar({ label, value }) {
  const pct = Math.min(100, Math.round(value * 100));
  const color = pct >= 70 ? C.red : pct >= 40 ? C.amber : C.green;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: C.textMid }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "monospace" }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: C.borderLight, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${C.borderLight}` }}>
      <span style={{ fontSize: 13, color: C.textSoft, minWidth: 130 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right", maxWidth: 260, wordBreak: "break-all", color: highlight ? C.red : C.text, fontFamily: mono ? "monospace" : undefined }}>
        {value || "—"}
      </span>
    </div>
  );
}

function RiskFlag({ flag }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 8, marginBottom: 6 }}>
      <span style={{ color: C.red, fontSize: 12 }}>⚑</span>
      <span style={{ fontSize: 12, color: "#B91C1C" }}>{flag}</span>
    </div>
  );
}

function ScreenshotBox({ label, domain, isBad }) {
  const accent = isBad ? C.red : C.green;
  const bg = isBad ? "#FFF5F5" : "#F0FDF4";
  return (
    <div style={{ flex: 1, border: `2px solid ${accent}33`, borderRadius: 12, overflow: "hidden", background: bg }}>
      <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: accent, borderBottom: `1px solid ${accent}22` }}>{label}</div>
      <div style={{ padding: 20, minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "90%", background: "white", borderRadius: 8, padding: 14, border: `1px solid ${accent}22` }}>
          <div style={{ height: 8, width: "55%", borderRadius: 3, background: `${accent}33`, marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <div style={{ height: 6, flex: 1, borderRadius: 3, background: `${accent}22` }} />
            <div style={{ height: 6, flex: 0.6, borderRadius: 3, background: `${accent}22` }} />
          </div>
          <div style={{ height: 70, borderRadius: 6, background: `${accent}18`, marginBottom: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 32, borderRadius: 4, background: `${accent}14` }} />)}
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: C.textSoft, fontFamily: "monospace" }}>{domain}</div>
      </div>
    </div>
  );
}

function EvidenceTab({ evidence, threat }) {
  const whois       = evidence.find(e => e.evidence_type === "whois")?.data || {};
  const contentSim  = evidence.find(e => e.evidence_type === "content_similarity")?.data || {};
  const visualSim   = evidence.find(e => e.evidence_type === "visual_similarity")?.data || {};
  const adCopy      = evidence.find(e => e.evidence_type === "ad_copy")?.data || null;
  const hostingInfo = evidence.find(e => e.evidence_type === "hosting_info")?.data || {};
  const domainScore = Math.min(1, (whois.risk_flags?.length || 0) * 0.25 + 0.3);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Visual Comparison */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Visual Comparison</h3>
          <div style={{ display: "flex", gap: 14 }}>
            <ScreenshotBox label="Your Site — your-brand.com" domain="your-brand.com" isBad={false} />
            <ScreenshotBox label="Bad Actor" domain={threat?.domain} isBad />
          </div>
        </Card>

        {/* Similarity */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 18px" }}>Similarity Analysis</h3>
          <ScoreBar label="Text / Content Similarity" value={contentSim.text_similarity_score || 0} />
          <ScoreBar label="Visual / Layout Similarity" value={contentSim.visual_similarity_score || visualSim.score || 0} />
          <ScoreBar label="Domain Deceptiveness" value={domainScore} />
          {contentSim.color_palette_match && <ScoreBar label="Color Palette Match" value={contentSim.color_palette_match} />}

          {contentSim.matched_terms?.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, color: C.textSoft, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Matched Brand Terms</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {contentSim.matched_terms.map((term, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "3px 10px", background: C.redLight, color: "#B91C1C", border: `1px solid ${C.redBorder}`, borderRadius: 999 }}>{term}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {contentSim.copied_sections_detected && (
              <div style={{ flex: 1, padding: "10px 14px", background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>⚠️</div>
                <div style={{ fontSize: 11, color: "#B91C1C", fontWeight: 600 }}>Copied Content Detected</div>
              </div>
            )}
            {contentSim.logo_detected_on_page && (
              <div style={{ flex: 1, padding: "10px 14px", background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 16, marginBottom: 4 }}>🔍</div>
                <div style={{ fontSize: 11, color: "#B91C1C", fontWeight: 600 }}>Brand Logo Detected</div>
              </div>
            )}
          </div>
        </Card>

        {/* Ad Copy */}
        {adCopy && (
          <Card style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Captured Ad Copy</h3>
              <span style={{ background: C.amberLight, color: C.amber, border: "1px solid #FDE68A", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>Position #{adCopy.ad_position}</span>
            </div>
            <div style={{ background: "#FAFBFC", border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 11, color: "#16A34A", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: "#DCFCE7", padding: "1px 6px", borderRadius: 3, border: "1px solid #BBF7D0" }}>Sponsored</span>
                <span style={{ color: C.textSoft }}>{adCopy.display_url || threat?.domain}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.blue, marginBottom: 8, lineHeight: 1.4 }}>
                {[adCopy.headline_1, adCopy.headline_2, adCopy.headline_3].filter(Boolean).join(" | ")}
              </div>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{adCopy.description_1}</div>
              {adCopy.description_2 && <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginTop: 4 }}>{adCopy.description_2}</div>}
            </div>
          </Card>
        )}

        {/* Tech Stack */}
        {hostingInfo.tech_stack?.length > 0 && (
          <Card style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Tech Stack Fingerprint</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {hostingInfo.tech_stack.map((t, i) => (
                <span key={i} style={{ fontSize: 12, padding: "5px 14px", background: C.borderLight, color: C.textMid, borderRadius: 8, border: `1px solid ${C.border}` }}>{t}</span>
              ))}
            </div>
            {hostingInfo.payment_processor && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: C.redLight, border: `1px solid ${C.redBorder}`, borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: "#B91C1C" }}>💳 Payment processor detected: <strong>{hostingInfo.payment_processor}</strong> — this site is actively transacting</span>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Right column: Revenue → Legal Actions → WHOIS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Revenue card */}
        <Card style={{ padding: 24, borderColor: C.redBorder, background: "#FFFAFA" }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: C.red, letterSpacing: "-0.02em", fontFamily: "monospace", marginBottom: 2 }}>
            {fmtCurrency(threat?.revenue_at_risk_monthly)}
          </div>
          <div style={{ fontSize: 13, color: C.textMid, marginBottom: 16 }}>estimated monthly revenue at risk</div>
          <InfoRow label="Keyword Volume" value="—" />
          <InfoRow label="Est. CTR" value="—" />
          <InfoRow label="Conversion Rate" value={threat?.conversion_rate ? `${(threat.conversion_rate * 100).toFixed(1)}%` : "2.8%"} />
          <InfoRow label="AOV" value={threat?.aov ? `$${threat.aov}` : "$70.00"} />
        </Card>

        {/* Legal action type */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>Legal Action Type</h3>
          {(() => {
            const ttype = threat?.threat_type || "";
            const textScore = contentSim.text_similarity_score || 0;
            const actions = [];
            if (ttype === "paid_ad") actions.push({ label: "Trademark Complaint", color: C.amber, desc: "Brand name used in paid ads without authorization" });
            if (ttype === "organic_clone" || textScore > 0.7) actions.push({ label: "DMCA + Trademark", color: C.red, desc: "Full clone — both copyright and trademark infringement apply" });
            else if (textScore > 0.5) actions.push({ label: "DMCA Takedown", color: C.red, desc: "Copyrighted content (text, images, design) copied from your site" });
            if (ttype.includes("organic") || ttype === "shopping_listing") actions.push({ label: "Trademark Complaint", color: C.amber, desc: "Brand name or marks used to deceive consumers" });
            if (actions.length === 0) actions.push({ label: "Trademark Complaint", color: C.amber, desc: "Brand impersonation without copied content" });
            const unique = actions.filter((a, i, arr) => arr.findIndex(x => x.label === a.label) === i);
            return unique.map((a, i) => (
              <div key={i} style={{ marginBottom: i < unique.length - 1 ? 14 : 0 }}>
                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: a.color === C.red ? C.redLight : C.amberLight, color: a.color, border: `1px solid ${a.color === C.red ? C.redBorder : "#FDE68A"}`, marginBottom: 6 }}>{a.label}</span>
                <p style={{ fontSize: 12, color: C.textMid, margin: 0, lineHeight: 1.5 }}>{a.desc}</p>
              </div>
            ));
          })()}
        </Card>

        {/* WHOIS */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>WHOIS & Infrastructure</h3>
          {whois.risk_flags?.length > 0 && (
            <div style={{ marginBottom: 16 }}>{whois.risk_flags.map((f, i) => <RiskFlag key={i} flag={f} />)}</div>
          )}
          <InfoRow label="Registrar" value={whois.registrar} />
          <InfoRow label="Registered" value={fmtDate(whois.created_date)} />
          <InfoRow label="Domain Age" value={whois.domain_age_days ? `${whois.domain_age_days} days` : "—"} highlight={whois.domain_age_days < 180} />
          <InfoRow label="Expires" value={fmtDate(whois.expires_date)} />
          <InfoRow label="Registrant" value={whois.registrant_name} />
          <InfoRow label="Email" value={whois.registrant_email} mono />
          <InfoRow label="Privacy Protected" value={whois.privacy_protected ? "Yes" : "No"} highlight={whois.privacy_protected} />
          <div style={{ height: 1, background: C.borderLight, margin: "14px 0" }} />
          <InfoRow label="IP Address" value={whois.ip_address} mono highlight />
          <InfoRow label="Hosting Provider" value={whois.hosting_provider} />
          <InfoRow label="Country" value={whois.hosting_country} />
          <InfoRow label="ASN" value={whois.hosting_asn} mono />
          <InfoRow label="SSL Issuer" value={whois.ssl_issuer} />
          {whois.name_servers?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: C.textSoft, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Name Servers</div>
              {whois.name_servers.map((ns, i) => <div key={i} style={{ fontSize: 11, color: C.textSoft, fontFamily: "monospace", padding: "2px 0" }}>{ns}</div>)}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function TakedownsTab({ threat, onAction }) {
  const channels = [
    { channel: "Google Ads Trademark Complaint", applies: threat?.threat_type === "paid_ad", desc: "Bad actor is running paid ads using your brand name" },
    { channel: "Domain Registrar Abuse Report", applies: true, desc: "Domain is designed to impersonate your brand" },
    { channel: "Hosting Provider DMCA", applies: true, desc: "Hosted content infringes your copyrights" },
    { channel: "Google Search DMCA Removal", applies: threat?.threat_type?.includes("organic"), desc: "Organic result contains copied content from your site" },
  ].filter(c => c.applies);

  return (
    <Card style={{ padding: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Takedown Channels</h3>
      <p style={{ fontSize: 13, color: C.textMid, marginBottom: 20, lineHeight: 1.6 }}>Based on evidence collected, the following channels are applicable.</p>
      {channels.map((ch, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.borderLight}` }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{ch.channel}</div>
            <div style={{ fontSize: 12, color: C.textSoft }}>{ch.desc}</div>
          </div>
          <button onClick={() => onAction("takedown")} style={{ padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: C.redLight, color: C.red, border: `1px solid ${C.redBorder}` }}>Initiate</button>
        </div>
      ))}
    </Card>
  );
}

function HistoryTab({ threat }) {
  return (
    <Card style={{ padding: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 20px" }}>Detection History</h3>
      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 2, background: C.borderLight }} />
        {[
          { date: threat?.first_seen_at, label: "Threat first detected", color: C.red },
          { date: threat?.last_seen_at, label: "Last confirmed active", color: C.amber },
        ].filter(e => e.date).map((e, i) => (
          <div key={i} style={{ position: "relative", marginBottom: 20 }}>
            <div style={{ position: "absolute", left: -20, top: 2, width: 10, height: 10, borderRadius: "50%", background: e.color, border: "2px solid white", boxShadow: `0 0 0 2px ${e.color}33` }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{e.label}</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{fmtDate(e.date)}</div>
          </div>
        ))}
      </div>
      {threat?.notes && (
        <div style={{ marginTop: 20, padding: "12px 14px", background: C.borderLight, borderRadius: 10, fontSize: 13, color: C.textMid, lineHeight: 1.6 }}><strong>Notes:</strong> {threat.notes}</div>
      )}
    </Card>
  );
}

export default function ThreatDetailPage() {
  const params = useParams();
  const [threat, setThreat] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("evidence");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!params?.id) return;
    const token = localStorage.getItem("brandshield_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch(`${API_BASE}/api/v1/threats/${params.id}`, { headers }),
      fetch(`${API_BASE}/api/v1/threats/${params.id}/evidence`, { headers }),
    ]).then(async ([tr, er]) => {
      setThreat(tr.ok ? await tr.json() : null);
      const eData = er.ok ? await er.json() : [];
      setEvidence(Array.isArray(eData) ? eData : eData.evidence || []);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [params?.id]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAction(action) {
    setActionLoading(true);
    const token = localStorage.getItem("brandshield_token");
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    try {
      const res = await fetch(`${API_BASE}/api/v1/threats/${params.id}/${action}`, { method: "POST", headers, body: JSON.stringify({}) });
      if (res.ok) {
        showToast(action === "dismiss" ? "Threat dismissed" : "Takedown initiated");
        setThreat(await fetch(`${API_BASE}/api/v1/threats/${params.id}`, { headers }).then(r => r.json()));
      } else showToast("Action failed", "error");
    } catch (e) { showToast(e.message, "error"); }
    finally { setActionLoading(false); }
  }

  const s = Number(threat?.severity_score) || 0;

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <div style={{ color: C.textSoft, fontSize: 14 }}>Loading...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !threat) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 14, color: C.red, marginBottom: 16 }}>{error || "Threat not found"}</div>
      <Link href="/threats" style={{ color: C.blue, fontSize: 14 }}>← Back to Threats</Link>
    </div>
  );

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: toast.type === "error" ? C.red : "#16A34A", color: "white", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>{toast.msg}</div>
      )}

      <Link href="/threats" style={{ color: C.blue, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}>← Back to Threats</Link>

      {/* Header — matches original design exactly */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: "0 0 10px", fontFamily: "monospace" }}>{threat.domain}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <SeverityBadge score={s} />
              <span style={{ fontSize: 13, color: C.textSoft }}>Type: <strong style={{ color: C.textMid }}>{threat.threat_type?.replace(/_/g, " ")}</strong></span>
              <span style={{ fontSize: 13, color: C.textSoft }}>First: <strong style={{ color: C.textMid }}>{fmtDate(threat.first_seen_at)}</strong></span>
              <span style={{ fontSize: 13, color: C.textSoft }}>Revenue: <strong style={{ color: C.red }}>{fmtCurrency(threat.revenue_at_risk_monthly)}/mo</strong></span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => handleAction("takedown")} disabled={actionLoading} style={{ padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", background: C.red, color: "white", border: "none", boxShadow: "0 2px 8px rgba(239,68,68,0.25)" }}>
              {actionLoading ? "…" : "Initiate Takedown"}
            </button>
            <button onClick={() => handleAction("dismiss")} disabled={actionLoading} style={{ padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", background: C.white, color: C.textMid, border: `1px solid ${C.border}` }}>Dismiss</button>
            <button style={{ padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", background: C.white, color: C.textMid, border: `1px solid ${C.border}` }}>Whitelist</button>
          </div>
        </div>
      </div>

      {/* Tabs — full width, revenue card lives inside EvidenceTab's right column */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
        {[{ id: "evidence", label: "Evidence" }, { id: "takedowns", label: "Takedowns" }, { id: "history", label: "History" }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "transparent", border: "none", borderBottom: activeTab === tab.id ? `2px solid ${C.blue}` : "2px solid transparent", color: activeTab === tab.id ? C.blue : C.textSoft, marginBottom: -1 }}>
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "evidence"  && <EvidenceTab evidence={evidence} threat={threat} />}
      {activeTab === "takedowns" && <TakedownsTab threat={threat} onAction={handleAction} />}
      {activeTab === "history"   && <HistoryTab threat={threat} />}
    </div>
  );
}
