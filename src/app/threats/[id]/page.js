"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://brave-embrace-production-f71d.up.railway.app";

// ── Helpers ──────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 30) return new Date(ts).toLocaleDateString();
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

function ScoreBar({ label, value, max = 100, color = "#ef4444" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const bgColor = pct >= 70 ? "#ef4444" : pct >= 40 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: bgColor }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 99,
          background: `linear-gradient(90deg, ${bgColor}88, ${bgColor})`,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight, tag }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "10px 0", borderBottom: "1px solid #1e293b",
    }}>
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, minWidth: 140 }}>{label}</span>
      <span style={{
        fontSize: 12, color: highlight ? "#f87171" : "#e2e8f0",
        fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
        textAlign: "right", maxWidth: 300, wordBreak: "break-all",
      }}>
        {tag ? (
          <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{value}</span>
        ) : value || "—"}
      </span>
    </div>
  );
}

function RiskFlag({ flag }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px", background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, marginBottom: 8,
    }}>
      <span style={{ color: "#ef4444", fontSize: 14 }}>⚑</span>
      <span style={{ fontSize: 12, color: "#fca5a5" }}>{flag}</span>
    </div>
  );
}

function Tag({ children, color = "#3b82f6" }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
      background: `${color}20`, color, border: `1px solid ${color}40`,
    }}>{children}</span>
  );
}

function SeverityBadge({ score }) {
  const s = Number(score) || 0;
  if (s >= 70) return <Tag color="#ef4444">Critical</Tag>;
  if (s >= 40) return <Tag color="#f59e0b">Moderate</Tag>;
  return <Tag color="#22c55e">Low</Tag>;
}

// ── Tab Components ───────────────────────────────────────────────
function EvidenceTab({ evidence, threat }) {
  const whois = evidence.find(e => e.evidence_type === "whois")?.data || {};
  const contentSim = evidence.find(e => e.evidence_type === "content_similarity")?.data || {};
  const visualSim = evidence.find(e => e.evidence_type === "visual_similarity")?.data || {};
  const adCopy = evidence.find(e => e.evidence_type === "ad_copy")?.data || null;
  const hostingInfo = evidence.find(e => e.evidence_type === "hosting_info")?.data || {};

  const textScore = Math.round((contentSim.text_similarity_score || 0) * 100);
  const visualScore = Math.round((contentSim.visual_similarity_score || visualSim.score || 0) * 100);
  const domainScore = whois.risk_flags?.length ? Math.min(100, whois.risk_flags.length * 25 + 30) : 40;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
      {/* Left column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Similarity Scores */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 20px" }}>
            Similarity Analysis
          </h3>
          <ScoreBar label="Text / Content Similarity" value={textScore} />
          <ScoreBar label="Visual / Layout Similarity" value={visualScore} />
          <ScoreBar label="Domain Deceptiveness" value={domainScore} />
          {contentSim.color_palette_match && (
            <ScoreBar label="Color Palette Match" value={Math.round(contentSim.color_palette_match * 100)} />
          )}

          {contentSim.matched_terms?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Matched Brand Terms
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {contentSim.matched_terms.map((term, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: "3px 10px", background: "rgba(239,68,68,0.1)",
                    color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 999,
                  }}>{term}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            {contentSim.copied_sections_detected && (
              <div style={{ flex: 1, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>⚠️</div>
                <div style={{ fontSize: 11, color: "#fca5a5", fontWeight: 600 }}>Copied Content Detected</div>
              </div>
            )}
            {contentSim.logo_detected_on_page && (
              <div style={{ flex: 1, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>🔍</div>
                <div style={{ fontSize: 11, color: "#fca5a5", fontWeight: 600 }}>Brand Logo Detected</div>
              </div>
            )}
          </div>
        </div>

        {/* Ad Copy */}
        {adCopy && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                Captured Ad Copy
              </h3>
              <Tag color="#f59e0b">Position #{adCopy.ad_position || "?"}</Tag>
            </div>

            {/* Realistic ad preview */}
            <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: "#22c55e22", padding: "1px 6px", borderRadius: 3, border: "1px solid #22c55e44" }}>Sponsored</span>
                <span style={{ color: "#475569" }}>{adCopy.display_url || threat?.domain}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#60a5fa", marginBottom: 8, lineHeight: 1.4 }}>
                {[adCopy.headline_1, adCopy.headline_2, adCopy.headline_3].filter(Boolean).join(" | ")}
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                {adCopy.description_1}
              </div>
              {adCopy.description_2 && (
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginTop: 4 }}>
                  {adCopy.description_2}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {hostingInfo.tech_stack?.length > 0 && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
              Tech Stack Fingerprint
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {hostingInfo.tech_stack.map((t, i) => (
                <span key={i} style={{
                  fontSize: 12, padding: "5px 14px", background: "#1e293b",
                  color: "#94a3b8", borderRadius: 8, border: "1px solid #334155",
                }}>{t}</span>
              ))}
            </div>
            {hostingInfo.payment_processor && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: "#fca5a5" }}>
                  💳 Payment processor detected: <strong>{hostingInfo.payment_processor}</strong> — this site is actively transacting
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right column — WHOIS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
            WHOIS & Infrastructure
          </h3>

          {whois.risk_flags?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {whois.risk_flags.map((flag, i) => <RiskFlag key={i} flag={flag} />)}
            </div>
          )}

          <InfoRow label="Registrar" value={whois.registrar} />
          <InfoRow label="Registered" value={fmtDate(whois.created_date)} />
          <InfoRow label="Domain Age" value={whois.domain_age_days ? `${whois.domain_age_days} days` : "—"} highlight={whois.domain_age_days < 180} />
          <InfoRow label="Expires" value={fmtDate(whois.expires_date)} />
          <InfoRow label="Registrant" value={whois.registrant_name} />
          <InfoRow label="Registrant Email" value={whois.registrant_email} mono />
          <InfoRow label="Privacy Protected" value={whois.privacy_protected ? "Yes" : "No"} highlight={whois.privacy_protected} />

          <div style={{ height: 1, background: "#1e293b", margin: "16px 0" }} />

          <InfoRow label="IP Address" value={whois.ip_address} mono highlight />
          <InfoRow label="Hosting Provider" value={whois.hosting_provider} />
          <InfoRow label="Hosting Country" value={whois.hosting_country} />
          <InfoRow label="ASN" value={whois.hosting_asn} mono />
          <InfoRow label="SSL Issuer" value={whois.ssl_issuer} />

          {whois.name_servers?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Name Servers</div>
              {whois.name_servers.map((ns, i) => (
                <div key={i} style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", padding: "3px 0" }}>{ns}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ threat }) {
  const s = Number(threat.severity_score) || 0;
  const sevColor = s >= 70 ? "#ef4444" : s >= 40 ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>Threat Details</h3>
        <InfoRow label="Domain" value={threat.domain} mono />
        <InfoRow label="Threat Type" value={threat.threat_type?.replace(/_/g, " ")} />
        <InfoRow label="Status" value={threat.status} />
        <InfoRow label="Severity Score" value={`${Math.round(s)}/100`} highlight={s >= 70} />
        <InfoRow label="First Detected" value={fmtDate(threat.first_seen_at)} />
        <InfoRow label="Last Seen" value={timeAgo(threat.last_seen_at)} />
      </div>
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>Revenue at Risk</h3>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: sevColor, letterSpacing: "-0.02em" }}>
            ${Number(threat.revenue_at_risk_monthly || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>estimated per month</div>
        </div>
        {threat.notes && (
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#1e293b", borderRadius: 10, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            {threat.notes}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function ThreatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [threat, setThreat] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("evidence");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);

    const token = localStorage.getItem("brandshield_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${API_BASE}/api/v1/threats/${params.id}`, { headers }),
      fetch(`${API_BASE}/api/v1/threats/${params.id}/evidence`, { headers }),
    ])
      .then(async ([tr, er]) => {
        const tData = tr.ok ? await tr.json() : null;
        const eData = er.ok ? await er.json() : [];
        setThreat(tData);
        setEvidence(Array.isArray(eData) ? eData : eData.evidence || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
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
        const updated = await fetch(`${API_BASE}/api/v1/threats/${params.id}`, { headers }).then(r => r.json());
        setThreat(updated);
      } else {
        showToast("Action failed — check console", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  const s = Number(threat?.severity_score) || 0;
  const sevColor = s >= 70 ? "#ef4444" : s >= 40 ? "#f59e0b" : "#22c55e";
  const tabs = [
    { id: "evidence", label: `Evidence (${evidence.length})` },
    { id: "overview", label: "Overview" },
  ];

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #1e293b", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ color: "#475569", fontSize: 14 }}>Loading threat data...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !threat) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 14, color: "#ef4444", marginBottom: 16 }}>{error || "Threat not found"}</div>
      <Link href="/threats" style={{ color: "#3b82f6", fontSize: 14 }}>← Back to Threats</Link>
    </div>
  );

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: toast.type === "error" ? "#7f1d1d" : "#14532d",
          color: toast.type === "error" ? "#fca5a5" : "#86efac",
          border: `1px solid ${toast.type === "error" ? "#ef444440" : "#22c55e40"}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/threats" style={{ color: "#475569", fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          ← Back to Threat Queue
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", margin: 0, fontFamily: "monospace" }}>
                {threat.domain}
              </h1>
              <SeverityBadge score={s} />
              <Tag color="#64748b">{threat.threat_type?.replace(/_/g, " ")}</Tag>
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              First detected {timeAgo(threat.first_seen_at)} · Last seen {timeAgo(threat.last_seen_at)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => handleAction("dismiss")}
              disabled={actionLoading || threat.status === "dismissed"}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: "transparent", color: "#64748b", border: "1px solid #334155",
                opacity: threat.status === "dismissed" ? 0.5 : 1,
              }}
            >Dismiss</button>
            <button
              onClick={() => handleAction("takedown")}
              disabled={actionLoading || threat.status === "takedown_submitted"}
              style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                color: "white", border: "none",
                opacity: threat.status === "takedown_submitted" ? 0.5 : 1,
                boxShadow: "0 4px 12px rgba(220,38,38,0.3)",
              }}
            >{actionLoading ? "…" : "Initiate Takedown"}</button>
          </div>
        </div>

        {/* Severity bar */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, height: 6, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${s}%`, borderRadius: 99,
              background: `linear-gradient(90deg, ${sevColor}66, ${sevColor})`,
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: sevColor, minWidth: 60 }}>
            {Math.round(s)}/100
          </span>
          <span style={{ fontSize: 12, color: "#64748b" }}>severity</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #1e293b", paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: "transparent", border: "none", borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === tab.id ? "#60a5fa" : "#64748b",
              marginBottom: -1, transition: "color 0.15s",
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "evidence" && <EvidenceTab evidence={evidence} threat={threat} />}
      {activeTab === "overview" && <OverviewTab threat={threat} />}
    </div>
  );
}
