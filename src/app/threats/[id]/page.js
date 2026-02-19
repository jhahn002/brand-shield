"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { THREAT_DETAIL as T } from "@/lib/mock-data";
import { useMounted } from "@/hooks/useApi";
import Link from "next/link";

const Bar = ({ label, value, color }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ fontSize: 13, color: "#64748B" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{(value * 100).toFixed(0)}%</span>
    </div>
    <div style={{ height: 6, borderRadius: 3, background: "#F1F5F9", overflow: "hidden" }}>
      <div style={{ width: `${value * 100}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s ease" }} />
    </div>
  </div>
);

const Row = ({ label, value, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #F8FAFB" }}>
    <span style={{ fontSize: 13, color: "#94A3B8" }}>{label}</span>
    <span style={{ fontSize: 13, color: "#1E293B", fontWeight: 500, fontFamily: mono ? "var(--font-mono)" : "inherit", textAlign: "right", maxWidth: "60%" }}>{value}</span>
  </div>
);

const ScreenshotBox = ({ label, domain, isBad }) => (
  <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: isBad ? "2px solid #FECACA" : "2px solid #BBF7D0" }}>
    <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", background: isBad ? "#FEF2F2" : "#F0FDF4", color: isBad ? "#DC2626" : "#16A34A", borderBottom: `1px solid ${isBad ? "#FECACA" : "#BBF7D0"}` }}>{label}</div>
    <div style={{ padding: 20, minHeight: 180, background: isBad ? "#FFFBFB" : "#FAFFFE", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "88%", background: "white", borderRadius: 8, padding: 14, border: "1px solid #F1F5F9" }}>
        <div style={{ height: 8, width: "55%", borderRadius: 4, background: "#F1F5F9", marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}><div style={{ height: 6, flex: 1, borderRadius: 3, background: "#F1F5F9" }} /><div style={{ height: 6, flex: 0.5, borderRadius: 3, background: "#F1F5F9" }} /></div>
        <div style={{ height: 64, borderRadius: 6, background: isBad ? "#FEF2F2" : "#F0FDF4", marginBottom: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>{[1,2,3].map(i => <div key={i} style={{ height: 32, borderRadius: 4, background: "#F8FAFB" }} />)}</div>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>{domain}</div>
    </div>
  </div>
);

export default function ThreatDetailPage() {
  const mounted = useMounted();
  const [tab, setTab] = useState("evidence");
  const sc = (v) => v >= 0.7 ? "#EF4444" : v >= 0.4 ? "#F59E0B" : "#22C55E";

  return (
    <DashboardShell>
      <Link href="/threats" style={{ fontSize: 13, color: "#2563EB", cursor: "pointer", marginBottom: 16, fontWeight: 500, display: "inline-block", textDecoration: "none" }}>← Back to Threats</Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, opacity: mounted ? 1 : 0, transition: "opacity 0.3s" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "var(--font-mono)", color: "#0F172A" }}>{T.domain}</h1>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: "#FEF2F2", color: "#DC2626" }}>Critical · {T.severity}</span>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#94A3B8" }}>
            <span>Type: <strong style={{ color: "#64748B" }}>{T.type}</strong></span>
            <span>First: <strong style={{ color: "#64748B" }}>{T.firstSeen}</strong></span>
            <span>Revenue: <strong style={{ color: "#EF4444" }}>${T.revenue.toLocaleString()}/mo</strong></span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#DC2626", color: "white" }}>Initiate Takedown</button>
          <button style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>Dismiss</button>
          <button style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>Whitelist</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #F1F5F9" }}>
        {[["evidence", "Evidence"], ["takedowns", "Takedowns"], ["history", "History"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "10px 20px", fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer",
            background: "transparent", color: tab === k ? "#2563EB" : "#94A3B8",
            borderBottom: tab === k ? "2px solid #2563EB" : "2px solid transparent", marginBottom: -1,
          }}>{l}</button>
        ))}
      </div>

      {tab === "evidence" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Screenshots */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "#0F172A" }}>Visual Comparison</h3>
              <div style={{ display: "flex", gap: 14 }}>
                <ScreenshotBox label="Your Site — beamsupplements.com" domain="beamsupplements.com" isBad={false} />
                <ScreenshotBox label="Bad Actor" domain={T.domain} isBad />
              </div>
            </div>
            {/* Ad Copy */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px", color: "#0F172A" }}>Captured Ad</h3>
              <div style={{ background: "#FAFBFC", borderRadius: 10, padding: 18, border: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 11, color: "#16A34A", fontWeight: 500, marginBottom: 4 }}>Sponsored · {T.ad.display}</div>
                <div style={{ fontSize: 17, fontWeight: 500, color: "#2563EB", marginBottom: 6, lineHeight: 1.3 }}>{T.ad.title}</div>
                <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>{T.ad.desc}</div>
                <div style={{ marginTop: 10, display: "flex", gap: 16, fontSize: 12, color: "#94A3B8" }}>
                  <span>Position: <strong style={{ color: "#D97706" }}>#{T.ad.position}</strong></span>
                  <span>Keyword: <strong style={{ color: "#64748B" }}>"{T.ad.keyword}"</strong></span>
                </div>
              </div>
            </div>
            {/* WHOIS */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: "#0F172A" }}>WHOIS & Infrastructure</h3>
              <Row label="Registrar" value={T.whois.registrar} />
              <Row label="Created" value={T.whois.created} mono />
              <Row label="Expires" value={T.whois.expires} mono />
              <Row label="Registrant" value={T.whois.registrant} />
              <Row label="Country" value={T.whois.country} mono />
              <Row label="Name Servers" value={T.whois.nameServers[0]} mono />
              <Row label="Tech Stack" value={T.tech.join(", ")} />
              <Row label="Payments" value={T.payments.join(", ")} />
              <Row label="Checkout" value="✅ Active" />
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "linear-gradient(135deg, #FEF2F2, #FFF7ED)", borderRadius: 16, padding: 24, border: "1px solid #FECACA", textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#DC2626", fontFamily: "var(--font-mono)", letterSpacing: "-0.03em" }}>${T.revenue.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: "#92400E", marginTop: 2 }}>estimated monthly revenue at risk</div>
              <div style={{ marginTop: 14, fontSize: 12, color: "#94A3B8", textAlign: "left" }}>
                <Row label="Keyword Volume" value="12,400/mo" mono />
                <Row label="Est. CTR (#2)" value="3.5%" mono />
                <Row label="Conversion Rate" value="2.8%" mono />
                <Row label="AOV" value="$67.50" mono />
              </div>
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px", color: "#0F172A" }}>Similarity Scores</h3>
              <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 16px" }}>Composite: <strong style={{ color: "#DC2626" }}>{T.severity}/100</strong></p>
              <Bar label="Text Similarity" value={T.similarity.text} color={sc(T.similarity.text)} />
              <Bar label="Visual Similarity" value={T.similarity.visual} color={sc(T.similarity.visual)} />
              <Bar label="Domain Deceptiveness" value={T.similarity.domain} color={sc(T.similarity.domain)} />
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: "#0F172A" }}>Detected On</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {T.keywords.map(k => (
                  <div key={k} style={{ padding: "8px 12px", borderRadius: 8, background: "#F8FAFB", border: "1px solid #F1F5F9", fontSize: 13, fontFamily: "var(--font-mono)", color: "#475569" }}>"{k}"</div>
                ))}
              </div>
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: "#0F172A" }}>Takedown Channels</h3>
              {T.takedowns.map((td, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: "#F8FAFB", border: "1px solid #F1F5F9", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{td.channel}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 5, background: "#F1F5F9", color: "#94A3B8" }}>Draft</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "takedowns" && (
        <div style={{ background: "white", borderRadius: 16, padding: 32, border: "1px solid #F1F5F9", textAlign: "center", color: "#94A3B8" }}>
          <p style={{ fontSize: 15 }}>Takedown management view — coming in Phase 3</p>
        </div>
      )}
      {tab === "history" && (
        <div style={{ background: "white", borderRadius: 16, padding: 32, border: "1px solid #F1F5F9", textAlign: "center", color: "#94A3B8" }}>
          <p style={{ fontSize: 15 }}>Detection history timeline — coming in Phase 2</p>
        </div>
      )}
    </DashboardShell>
  );
}
