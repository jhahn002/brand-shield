"use client";
import { useState, useEffect } from "react";

const AUDIT = {
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

export default function GatedPortal() {
  const [mounted, setMounted] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowCta(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const a = AUDIT;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fafbfc",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      color: "#1e293b",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        padding: "48px 32px 56px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse at 30% 0%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, rgba(6,182,212,0.06) 0%, transparent 50%)",
        }} />
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, color: "white",
            }}>B</div>
            <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Brand Shield</span>
          </div>
          <div style={{
            fontSize: 13, fontWeight: 500, color: "#60a5fa",
            letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12,
            opacity: mounted ? 1 : 0, transition: "opacity 0.5s 0.1s",
          }}>Brand Protection Audit Report</div>
          <h1 style={{
            fontSize: 38, fontWeight: 700, color: "white", letterSpacing: "-0.03em",
            margin: "0 0 8px", lineHeight: 1.15,
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.6s cubic-bezier(0.4,0,0.2,1) 0.15s",
          }}>{a.brandName}</h1>
          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.5)", margin: 0,
            opacity: mounted ? 1 : 0, transition: "opacity 0.5s 0.3s",
          }}>{a.domain} · {a.auditPeriod}</p>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px" }}>

        {/* Headline Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0,
          background: "white", borderRadius: 16, overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
          marginTop: -32, position: "relative", zIndex: 10,
          opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.4,0,0.2,1) 0.2s",
        }}>
          {[
            { label: "Bad Actors Found", value: a.totalThreats, sub: `${a.criticalThreats} critical severity`, color: "#ef4444" },
            { label: "Revenue at Risk", value: `$${a.revenueAtRisk.toLocaleString()}`, sub: "per month estimated", color: "#dc2626" },
            { label: "Keywords Targeted", value: "47", sub: "across paid, organic & shopping", color: "#f59e0b" },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: "28px 32px", textAlign: "center",
              borderRight: i < 2 ? "1px solid #f1f5f9" : "none",
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8, letterSpacing: "0.02em" }}>{stat.label}</div>
              <div style={{
                fontSize: 36, fontWeight: 700, color: stat.color,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em",
              }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Alert Banner */}
        <div style={{
          margin: "28px 0", padding: "18px 24px", borderRadius: 12,
          background: "linear-gradient(135deg, #fef2f2, #fff1f2)",
          border: "1px solid #fecaca",
          display: "flex", alignItems: "center", gap: 14,
          opacity: mounted ? 1 : 0, transition: "opacity 0.5s 0.4s",
        }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#dc2626" }}>
              {a.totalThreats} bad actors are actively targeting {a.brandName}
            </div>
            <div style={{ fontSize: 13, color: "#991b1b", marginTop: 2 }}>
              These entities are bidding on your keywords, cloning your pages, and diverting your customers — costing an estimated ${a.revenueAtRisk.toLocaleString()}/month.
            </div>
          </div>
        </div>

        {/* Top Threats */}
        <div style={{
          background: "white", borderRadius: 16, padding: "28px 32px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Top Threats Found</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
            Showing 3 of {a.totalThreats} threats. <span style={{ color: "#3b82f6", fontWeight: 500 }}>Sign up to see all.</span>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {a.topThreats.map((threat, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderRadius: 12,
                background: threat.blurred ? "#f8fafc" : "white",
                border: threat.blurred ? "1px solid #e2e8f0" : "1px solid #e2e8f0",
                position: "relative", overflow: "hidden",
                filter: threat.blurred ? "blur(2px)" : "none",
                userSelect: threat.blurred ? "none" : "auto",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateX(0)" : "translateX(-10px)",
                transition: `all 0.4s ease ${0.4 + i * 0.08}s`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: threat.severity >= 70 ? "#fef2f2" : threat.severity >= 40 ? "#fffbeb" : "#f0fdf4",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 700,
                    color: threat.severity >= 70 ? "#dc2626" : threat.severity >= 40 ? "#d97706" : "#16a34a",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{threat.severity}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>
                      {threat.domain}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      {threat.type}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>
                    ${threat.revenue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>/month at risk</div>
                </div>
              </div>
            ))}
          </div>

          {/* Blur overlay for locked threats */}
          <div style={{
            position: "relative", marginTop: -72,
            background: "linear-gradient(0deg, white 40%, rgba(255,255,255,0) 100%)",
            padding: "48px 0 8px", textAlign: "center", zIndex: 5,
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 10,
              background: "#0f172a", color: "white",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              🔒 Sign up to reveal all {a.totalThreats} threats
            </div>
          </div>
        </div>

        {/* Keyword Breakdown */}
        <div style={{
          background: "white", borderRadius: 16, padding: "28px 32px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Revenue at Risk by Keyword</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 18px" }}>
            Your brand keywords are being targeted by competitors and impersonators.
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                {["Keyword", "Monthly Volume", "Bad Actors", "Revenue Impact"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "10px 12px", fontSize: 12,
                    fontWeight: 600, color: "#64748b", letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.keywordBreakdown.map((kw, i) => (
                <tr key={i} style={{
                  borderBottom: "1px solid #f8fafc",
                  filter: kw.volume === null ? "blur(4px)" : "none",
                  userSelect: kw.volume === null ? "none" : "auto",
                }}>
                  <td style={{ padding: "12px 12px", fontSize: 14, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>
                    "{kw.keyword}"
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 14, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
                    {kw.volume ? kw.volume.toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    {kw.badActors !== null && (
                      <span style={{
                        fontSize: 13, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                        background: "#fef2f2", color: "#dc2626",
                      }}>{kw.badActors} found</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 16, fontWeight: 700, color: "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>
                    {kw.revenue ? `$${kw.revenue.toLocaleString()}/mo` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Threat Type Breakdown */}
        <div style={{
          background: "white", borderRadius: 16, padding: "28px 32px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 18px", letterSpacing: "-0.01em" }}>Threat Breakdown by Type</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Paid Ads", count: a.threatTypes.paid_ad, color: "#f59e0b", icon: "📢", desc: "Bidding on your brand keywords" },
              { label: "Site Clones", count: a.threatTypes.organic_clone, color: "#ef4444", icon: "🔄", desc: "Copying your site content" },
              { label: "Misleading", count: a.threatTypes.organic_misleading, color: "#a855f7", icon: "🎭", desc: "Deceptive search listings" },
              { label: "Shopping", count: a.threatTypes.shopping, color: "#3b82f6", icon: "🛒", desc: "Fake product listings" },
            ].map((t, i) => (
              <div key={i} style={{
                padding: "20px", borderRadius: 12,
                border: "1px solid #e2e8f0", textAlign: "center",
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: t.color, fontFamily: "'JetBrains Mono', monospace" }}>{t.count}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginTop: 4 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          borderRadius: 20, padding: "48px 40px", textAlign: "center",
          marginBottom: 48, position: "relative", overflow: "hidden",
          opacity: showCta ? 1 : 0, transform: showCta ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.7s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 60%)",
          }} />
          <div style={{ position: "relative" }}>
            <div style={{
              fontSize: 48, fontWeight: 700, color: "#ef4444",
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em",
              marginBottom: 4, lineHeight: 1,
            }}>${a.revenueAtRisk.toLocaleString()}</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
              estimated revenue lost every month to brand impersonation
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "white", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Stop losing revenue to impersonators
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 540, margin: "0 auto 28px", lineHeight: 1.6 }}>
              Brand Shield monitors your brand 24/7, detects bad actors in real-time, and helps you take them down. Starting at just $97/month.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
              <button style={{
                padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 700,
                border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                color: "white", boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
              }}>Start Protecting {a.brandName} →</button>
              <button style={{
                padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 500,
                border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer",
                background: "transparent", color: "rgba(255,255,255,0.7)",
              }}>Schedule a Demo</button>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 16 }}>
              No credit card required · Cancel anytime · Setup in under 5 minutes
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "0 0 40px", fontSize: 12, color: "#94a3b8" }}>
          <p>This report was generated by Brand Shield on Feb 19, 2026.</p>
          <p style={{ marginTop: 4 }}>Portal access expires in 14 days. © 2026 Brand Shield</p>
        </div>
      </div>
    </div>
  );
}
