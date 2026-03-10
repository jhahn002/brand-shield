"use client";
import { useState } from "react";
import { useMounted } from "@/hooks/useApi";
import Link from "next/link";

const TAKEDOWNS = [
  {
    id: 1, domain: "beam-supplements-official.com", threatId: 1, revenue: 8200,
    channel: "Google Ads Trademark", status: "acknowledged",
    steps: [
      { label: "Submitted", date: "Feb 14, 2026", done: true },
      { label: "Acknowledged", date: "Feb 15, 2026", done: true },
      { label: "Resolved", date: null, done: false },
    ],
  },
  {
    id: 2, domain: "beam-supplements-official.com", threatId: 1, revenue: 8200,
    channel: "Registrar Abuse Report", status: "submitted",
    steps: [
      { label: "Submitted", date: "Feb 14, 2026", done: true },
      { label: "Acknowledged", date: null, done: false },
      { label: "Resolved", date: null, done: false },
    ],
  },
  {
    id: 3, domain: "getbeamhealth.store", threatId: 2, revenue: 5400,
    channel: "Google Search DMCA", status: "acknowledged",
    steps: [
      { label: "Submitted", date: "Feb 15, 2026", done: true },
      { label: "Acknowledged", date: "Feb 17, 2026", done: true },
      { label: "Resolved", date: null, done: false },
    ],
  },
  {
    id: 4, domain: "getbeamhealth.store", threatId: 2, revenue: 5400,
    channel: "Hosting Provider DMCA", status: "submitted",
    steps: [
      { label: "Submitted", date: "Feb 16, 2026", done: true },
      { label: "Acknowledged", date: null, done: false },
      { label: "Resolved", date: null, done: false },
    ],
  },
  {
    id: 5, domain: "beamwellness-shop.com", threatId: 3, revenue: 4100,
    channel: "Google Shopping Report", status: "acknowledged",
    steps: [
      { label: "Submitted", date: "Feb 12, 2026", done: true },
      { label: "Acknowledged", date: "Feb 13, 2026", done: true },
      { label: "Resolved", date: null, done: false },
    ],
  },
  {
    id: 6, domain: "beamhealth-offers.com", threatId: 9, revenue: 1100,
    channel: "Registrar Abuse Report", status: "submitted",
    steps: [
      { label: "Submitted", date: "Feb 18, 2026", done: true },
      { label: "Acknowledged", date: null, done: false },
      { label: "Resolved", date: null, done: false },
    ],
  },
  {
    id: 7, domain: "fakebeam-deals.com", threatId: null, revenue: 3200,
    channel: "Google Ads Trademark", status: "resolved",
    steps: [
      { label: "Submitted", date: "Feb 1, 2026", done: true },
      { label: "Acknowledged", date: "Feb 2, 2026", done: true },
      { label: "Resolved", date: "Feb 8, 2026", done: true },
    ],
  },
  {
    id: 8, domain: "fakebeam-deals.com", threatId: null, revenue: 3200,
    channel: "Hosting Provider DMCA", status: "resolved",
    steps: [
      { label: "Submitted", date: "Feb 1, 2026", done: true },
      { label: "Acknowledged", date: "Feb 3, 2026", done: true },
      { label: "Resolved", date: "Feb 10, 2026", done: true },
    ],
  },
  {
    id: 9, domain: "beam-copycats.com", threatId: null, revenue: 2800,
    channel: "Google Search DMCA", status: "resolved",
    steps: [
      { label: "Submitted", date: "Jan 28, 2026", done: true },
      { label: "Acknowledged", date: "Jan 30, 2026", done: true },
      { label: "Resolved", date: "Feb 5, 2026", done: true },
    ],
  },
];

const channelIcon = (ch) => {
  if (ch.includes("Google Ads")) return "🎯";
  if (ch.includes("Google Search")) return "🔍";
  if (ch.includes("Google Shopping")) return "🛒";
  if (ch.includes("Registrar")) return "🌐";
  if (ch.includes("Hosting")) return "🖥️";
  return "📤";
};

const statusConfig = {
  submitted: { label: "Submitted", color: "#D97706", bg: "#FFFBEB" },
  acknowledged: { label: "In Review", color: "#2563EB", bg: "#EFF6FF" },
  resolved: { label: "Resolved", color: "#16A34A", bg: "#F0FDF4" },
};

// Animated progress bar — 3 steps: submitted=1/3, acknowledged=2/3, resolved=3/3
const TakedownProgressBar = ({ status }) => {
  const pct = status === "resolved" ? 100 : status === "acknowledged" ? 66 : status === "submitted" ? 33 : 0;
  const color = status === "resolved" ? "#16A34A" : "#2563EB";
  const isActive = status !== "resolved";

  return (
    <div style={{ position: "relative", height: 4, borderRadius: 2, background: "#F1F5F9", overflow: "hidden", width: "100%" }}>
      {/* filled portion */}
      <div style={{
        position: "absolute", left: 0, top: 0, height: "100%",
        width: `${pct}%`, borderRadius: 2, background: color,
        transition: "width 0.5s ease",
      }} />
      {/* shimmer overlay on active */}
      {isActive && (
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${pct}%`, borderRadius: 2,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.8s infinite",
        }} />
      )}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

const StepTimeline = ({ steps }) => {
  const currentIdx = steps.filter(s => s.done).length - 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: "4px 0" }}>
      {steps.map((step, i) => {
        const isCurrent = i === currentIdx && !steps.every(s => s.done);
        return (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
              <div style={{
                width: isCurrent ? 22 : 18, height: isCurrent ? 22 : 18, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: step.done ? "#2563EB" : "#F1F5F9",
                border: isCurrent ? "3px solid #BFDBFE" : "none",
                transition: "all 0.3s",
              }}>
                {step.done && <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>✓</span>}
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: 2, height: 28, borderRadius: 1,
                  background: step.done && steps[i + 1].done ? "#2563EB" : "#E2E8F0",
                  backgroundImage: !step.done || !steps[i + 1].done ? "repeating-linear-gradient(0deg, #E2E8F0, #E2E8F0 3px, transparent 3px, transparent 6px)" : "none",
                }} />
              )}
            </div>
            <div style={{ paddingBottom: i < steps.length - 1 ? 14 : 0, minHeight: i < steps.length - 1 ? 42 : "auto" }}>
              <div style={{ fontSize: 13, fontWeight: step.done ? 600 : 400, color: step.done ? "#0F172A" : "#CBD5E1" }}>{step.label}</div>
              {step.date && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{step.date}</div>}
              {!step.done && i === currentIdx + 1 && <div style={{ fontSize: 11, color: "#CBD5E1", marginTop: 1, fontStyle: "italic" }}>Waiting...</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TakedownCard = ({ td, mounted, idx }) => {
  const cfg = statusConfig[td.status];
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: 0, border: "1px solid #F1F5F9",
      boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden",
      opacity: mounted ? 1 : 0, animation: mounted ? `fadeIn 0.3s ease ${idx * 0.04}s both` : "none",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <Link href={td.threatId ? `/threats/${td.threatId}` : "#"} style={{ textDecoration: "none" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "#0F172A" }}>{td.domain}</div>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 13 }}>{channelIcon(td.channel)}</span>
              <span style={{ fontSize: 12, color: "#64748B" }}>{td.channel}</span>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, background: td.status === "resolved" ? "#F8FAFB" : "#FEF2F2", marginTop: 4 }}>
          <span style={{ fontSize: 12, color: td.status === "resolved" ? "#94A3B8" : "#92400E" }}>{td.status === "resolved" ? "Recovered:" : "At risk:"}</span>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: td.status === "resolved" ? "#16A34A" : "#DC2626", letterSpacing: "-0.02em" }}>${td.revenue.toLocaleString()}</span>
          <span style={{ fontSize: 11, color: td.status === "resolved" ? "#94A3B8" : "#DC2626" }}>/mo</span>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <StepTimeline steps={td.steps} />
      </div>
    </div>
  );
};

export default function TakedownsPage() {
  const mounted = useMounted();
  const [view, setView] = useState("list"); // default list view
  const [filter, setFilter] = useState("all");

  const active = TAKEDOWNS.filter(t => t.status !== "resolved");
  const resolved = TAKEDOWNS.filter(t => t.status === "resolved");
  const filtered = filter === "active" ? active : filter === "resolved" ? resolved : TAKEDOWNS;

  const totalActiveRev = active.reduce((s, t) => s + t.revenue, 0);
  const totalResolvedRev = resolved.reduce((s, t) => s + t.revenue, 0);

  const Pill = ({ label, active: isActive, onClick }) => (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1px solid", cursor: "pointer",
      background: isActive ? "#EFF6FF" : "white", borderColor: isActive ? "#BFDBFE" : "#E2E8F0", color: isActive ? "#2563EB" : "#94A3B8",
    }}>{label}</button>
  );

  const ViewBtn = ({ icon, mode }) => (
    <button onClick={() => setView(mode)} style={{
      padding: "6px 10px", borderRadius: 6, fontSize: 16, border: "1px solid", cursor: "pointer", lineHeight: 1,
      background: view === mode ? "#EFF6FF" : "white", borderColor: view === mode ? "#BFDBFE" : "#E2E8F0",
    }}>{icon}</button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#0F172A" }}>Takedowns</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>{active.length} in progress · {resolved.length} resolved</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <ViewBtn icon="▦" mode="cards" />
          <ViewBtn icon="☰" mode="list" />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "In Progress", value: active.length, icon: "⏳", bg: "#FFFBEB", color: "#D97706" },
          { label: "Revenue at Risk", value: "$" + totalActiveRev.toLocaleString(), icon: "💰", bg: "#FEF2F2", color: "#DC2626" },
          { label: "Resolved", value: resolved.length, icon: "✅", bg: "#F0FDF4", color: "#16A34A" },
          { label: "Revenue Recovered", value: "$" + totalResolvedRev.toLocaleString(), icon: "🎉", bg: "#F0FDF4", color: "#16A34A" },
        ].map((m, i) => (
          <div key={i} style={{
            background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #F1F5F9",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(8px)",
            transition: `all 0.3s ease ${i * 0.05}s`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{m.icon}</div>
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", fontFamily: "var(--font-mono)", letterSpacing: "-0.03em" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["all", "All"], ["active", "In Progress"], ["resolved", "Resolved"]].map(([v, l]) => (
          <Pill key={v} label={l} active={filter === v} onClick={() => setFilter(v)} />
        ))}
      </div>

      {/* Card View */}
      {view === "cards" && (
        <div>
          {(filter === "all" || filter === "active") && active.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#D97706", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FBBF24" }} />
                In Progress ({active.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
                {active.map((td, i) => <TakedownCard key={td.id} td={td} mounted={mounted} idx={i} />)}
              </div>
            </>
          )}
          {(filter === "all" || filter === "resolved") && resolved.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#16A34A", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
                Resolved ({resolved.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {resolved.map((td, i) => <TakedownCard key={td.id} td={td} mounted={mounted} idx={i} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #F1F5F9", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                {["Domain", "Channel", "Status", "Revenue at Risk", "Progress", "Submitted", "Days Active"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((td, i) => {
                const cfg = statusConfig[td.status];
                const submitted = td.steps.find(s => s.label === "Submitted");
                const daysActive = submitted?.date ? Math.max(1, Math.round((new Date("2026-02-19") - new Date(submitted.date)) / (1000 * 60 * 60 * 24))) : 0;
                return (
                  <tr key={td.id}
                    style={{ borderBottom: "1px solid #FAFBFC", cursor: "pointer", opacity: mounted ? 1 : 0, animation: mounted ? `fadeIn 0.3s ease ${i * 0.03}s both` : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAFBFC"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={td.threatId ? `/threats/${td.threatId}` : "#"} style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: "#1E293B", textDecoration: "none" }}>{td.domain}</Link>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13 }}>{channelIcon(td.channel)}</span>
                        <span style={{ fontSize: 12, color: "#64748B" }}>{td.channel}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: td.status === "resolved" ? "#16A34A" : "#EF4444" }}>${td.revenue.toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: "#CBD5E1" }}>/mo</span>
                    </td>
                    <td style={{ padding: "12px 16px", minWidth: 120 }}>
                      <TakedownProgressBar status={td.status} />
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#94A3B8" }}>{submitted?.date || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {td.status === "resolved" ? (
                        <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 500 }}>✓ Complete</span>
                      ) : (
                        <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "#64748B" }}>{daysActive}d</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
