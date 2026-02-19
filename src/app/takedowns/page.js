"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useMounted } from "@/hooks/useApi";
import Link from "next/link";

// Takedown timeline data — each takedown is a horizontal bar
const TAKEDOWNS = [
  {
    id: 1, domain: "beam-supplements-official.com", severity: 94, revenue: 8200, threatId: 1,
    channels: [
      { channel: "Google Ads Trademark", status: "submitted", submittedAt: "Feb 14", acknowledgedAt: "Feb 15", resolvedAt: null, daysActive: 5 },
      { channel: "Registrar Abuse", status: "submitted", submittedAt: "Feb 14", acknowledgedAt: null, resolvedAt: null, daysActive: 5 },
      { channel: "Hosting DMCA", status: "draft", submittedAt: null, acknowledgedAt: null, resolvedAt: null, daysActive: 0 },
    ],
  },
  {
    id: 2, domain: "getbeamhealth.store", severity: 87, revenue: 5400, threatId: 2,
    channels: [
      { channel: "Google Search DMCA", status: "acknowledged", submittedAt: "Feb 15", acknowledgedAt: "Feb 17", resolvedAt: null, daysActive: 4 },
      { channel: "Hosting DMCA", status: "submitted", submittedAt: "Feb 16", acknowledgedAt: null, resolvedAt: null, daysActive: 3 },
    ],
  },
  {
    id: 3, domain: "beamwellness-shop.com", severity: 82, revenue: 4100, threatId: 3,
    channels: [
      { channel: "Google Shopping Report", status: "submitted", submittedAt: "Feb 12", acknowledgedAt: "Feb 13", resolvedAt: null, daysActive: 7 },
      { channel: "Registrar Abuse", status: "acknowledged", submittedAt: "Feb 12", acknowledgedAt: "Feb 14", resolvedAt: null, daysActive: 7 },
    ],
  },
  {
    id: 4, domain: "fakebeam-deals.com", severity: 78, revenue: 3200, threatId: null,
    channels: [
      { channel: "Google Ads Trademark", status: "resolved", submittedAt: "Feb 1", acknowledgedAt: "Feb 2", resolvedAt: "Feb 8", daysActive: 7 },
      { channel: "Hosting DMCA", status: "resolved", submittedAt: "Feb 1", acknowledgedAt: "Feb 3", resolvedAt: "Feb 10", daysActive: 9 },
    ],
  },
  {
    id: 5, domain: "beam-copycats.com", severity: 72, revenue: 2800, threatId: null,
    channels: [
      { channel: "Google Search DMCA", status: "resolved", submittedAt: "Jan 28", acknowledgedAt: "Jan 30", resolvedAt: "Feb 5", daysActive: 8 },
    ],
  },
  {
    id: 6, domain: "beamhealth-offers.com", severity: 48, revenue: 1100, threatId: 9,
    channels: [
      { channel: "Registrar Abuse", status: "submitted", submittedAt: "Feb 18", acknowledgedAt: null, resolvedAt: null, daysActive: 1 },
    ],
  },
];

const statusConfig = {
  draft: { label: "Draft", color: "#94A3B8", bg: "#F1F5F9", barColor: "#CBD5E1" },
  submitted: { label: "Submitted", color: "#D97706", bg: "#FFFBEB", barColor: "#FBBF24" },
  acknowledged: { label: "Acknowledged", color: "#2563EB", bg: "#EFF6FF", barColor: "#3B82F6" },
  resolved: { label: "Resolved", color: "#16A34A", bg: "#F0FDF4", barColor: "#22C55E" },
  failed: { label: "Failed", color: "#DC2626", bg: "#FEF2F2", barColor: "#EF4444" },
};

// Timeline spans Feb 1 – Feb 19 (19 days)
const TIMELINE_START = new Date("2026-02-01");
const TIMELINE_END = new Date("2026-02-19");
const TOTAL_DAYS = 19;
const dayLabels = Array.from({ length: TOTAL_DAYS }, (_, i) => {
  const d = new Date(TIMELINE_START);
  d.setDate(d.getDate() + i);
  return { day: d.getDate(), label: `Feb ${d.getDate()}`, isWeekend: d.getDay() === 0 || d.getDay() === 6 };
});

const dateToDayIndex = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.replace(",", "").split(" ");
  const monthMap = { Jan: 0, Feb: 1, Mar: 2 };
  const d = new Date(2026, monthMap[parts[0]], parseInt(parts[1]));
  return Math.round((d - TIMELINE_START) / (1000 * 60 * 60 * 24));
};

const channelIcon = (ch) => {
  if (ch.includes("Google Ads")) return "🎯";
  if (ch.includes("Google Search")) return "🔍";
  if (ch.includes("Google Shopping")) return "🛒";
  if (ch.includes("Registrar")) return "🌐";
  if (ch.includes("Hosting")) return "🖥️";
  if (ch.includes("DMCA")) return "📄";
  return "📤";
};

export default function TakedownsPage() {
  const mounted = useMounted();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? TAKEDOWNS
    : filter === "active" ? TAKEDOWNS.filter(t => t.channels.some(c => c.status !== "resolved" && c.status !== "draft"))
    : filter === "resolved" ? TAKEDOWNS.filter(t => t.channels.every(c => c.status === "resolved"))
    : TAKEDOWNS;

  const totalActive = TAKEDOWNS.reduce((s, t) => s + t.channels.filter(c => c.status === "submitted" || c.status === "acknowledged").length, 0);
  const totalResolved = TAKEDOWNS.reduce((s, t) => s + t.channels.filter(c => c.status === "resolved").length, 0);

  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1px solid", cursor: "pointer",
      background: active ? "#EFF6FF" : "white", borderColor: active ? "#BFDBFE" : "#E2E8F0", color: active ? "#2563EB" : "#94A3B8",
    }}>{label}</button>
  );

  return (
    <DashboardShell>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#0F172A" }}>Takedowns</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>
            {totalActive} active across {TAKEDOWNS.filter(t => t.channels.some(c => c.status !== "resolved" && c.status !== "draft")).length} threats · {totalResolved} resolved
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "In Progress", value: totalActive, icon: "⏳", bg: "#FFFBEB", color: "#D97706" },
          { label: "Resolved", value: totalResolved, icon: "✅", bg: "#F0FDF4", color: "#16A34A" },
          { label: "Avg. Resolution", value: "8 days", icon: "📅", bg: "#EFF6FF", color: "#2563EB" },
          { label: "Success Rate", value: "100%", icon: "🎯", bg: "#F5F3FF", color: "#7C3AED" },
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
        {[["all", "All"], ["active", "Active"], ["resolved", "Resolved"]].map(([v, l]) => (
          <Pill key={v} label={l} active={filter === v} onClick={() => setFilter(v)} />
        ))}
      </div>

      {/* Timeline View */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #F1F5F9", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>

        {/* Timeline Header */}
        <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ width: 280, flexShrink: 0, padding: "12px 20px", fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
            Threat / Channel
          </div>
          <div style={{ flex: 1, display: "flex", position: "relative" }}>
            {dayLabels.map((d, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center", padding: "12px 0", fontSize: 11, fontWeight: 500,
                color: d.day === 19 ? "#0F172A" : d.isWeekend ? "#CBD5E1" : "#94A3B8",
                background: d.isWeekend ? "#FAFBFC" : "transparent",
                borderLeft: "1px solid #F8FAFB",
              }}>{d.day}</div>
            ))}
          </div>
        </div>

        {/* Takedown Rows */}
        {filtered.map((takedown, ti) => (
          <div key={takedown.id} style={{
            borderBottom: "1px solid #F1F5F9",
            opacity: mounted ? 1 : 0, animation: mounted ? `fadeIn 0.3s ease ${ti * 0.04}s both` : "none",
          }}>
            {/* Domain Header Row */}
            <div style={{ display: "flex", alignItems: "center", background: "#FAFBFC" }}>
              <div style={{ width: 280, flexShrink: 0, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                <Link href={takedown.threatId ? `/threats/${takedown.threatId}` : "#"} style={{ textDecoration: "none" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{takedown.domain}</span>
                </Link>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: "#FEF2F2", color: "#DC2626" }}>{takedown.severity}</span>
              </div>
              <div style={{ flex: 1, padding: "10px 16px", display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 12, color: "#EF4444", fontWeight: 600, fontFamily: "var(--font-mono)" }}>${takedown.revenue.toLocaleString()}/mo</span>
              </div>
            </div>

            {/* Channel Rows with Timeline Bars */}
            {takedown.channels.map((ch, ci) => {
              const cfg = statusConfig[ch.status];
              const startIdx = dateToDayIndex(ch.submittedAt);
              const endIdx = ch.resolvedAt ? dateToDayIndex(ch.resolvedAt) : (ch.status === "draft" ? null : TOTAL_DAYS - 1);
              const ackIdx = dateToDayIndex(ch.acknowledgedAt);

              return (
                <div key={ci} style={{ display: "flex", alignItems: "center", borderTop: "1px solid #F8FAFB" }}>
                  {/* Channel Label */}
                  <div style={{ width: 280, flexShrink: 0, padding: "8px 20px 8px 40px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{channelIcon(ch.channel)}</span>
                    <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{ch.channel}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: cfg.bg, color: cfg.color, marginLeft: "auto" }}>{cfg.label}</span>
                  </div>

                  {/* Timeline Bar Area */}
                  <div style={{ flex: 1, position: "relative", height: 36, display: "flex" }}>
                    {/* Background grid */}
                    {dayLabels.map((d, i) => (
                      <div key={i} style={{
                        flex: 1, height: "100%",
                        background: d.isWeekend ? "#FAFBFC" : "transparent",
                        borderLeft: "1px solid #F8FAFB",
                      }} />
                    ))}

                    {/* The actual bar */}
                    {startIdx != null && endIdx != null && (
                      <div style={{
                        position: "absolute",
                        left: `${(startIdx / TOTAL_DAYS) * 100}%`,
                        width: `${(Math.max(endIdx - startIdx + 1, 1) / TOTAL_DAYS) * 100}%`,
                        top: 8, height: 20, borderRadius: 6,
                        background: ch.status === "resolved"
                          ? `linear-gradient(90deg, ${cfg.barColor}, ${cfg.barColor})`
                          : `linear-gradient(90deg, ${cfg.barColor}, ${cfg.barColor}88)`,
                        opacity: ch.status === "resolved" ? 0.7 : 1,
                        display: "flex", alignItems: "center", paddingLeft: 8,
                        overflow: "hidden",
                      }}>
                        {/* Acknowledged marker */}
                        {ackIdx != null && startIdx != null && (
                          <div style={{
                            position: "absolute",
                            left: `${((ackIdx - startIdx) / Math.max(endIdx - startIdx + 1, 1)) * 100}%`,
                            top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.6)",
                          }} />
                        )}
                        <span style={{ fontSize: 10, fontWeight: 600, color: "white", whiteSpace: "nowrap", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
                          {ch.status === "resolved" ? "✓" : ch.daysActive + "d"}
                        </span>
                      </div>
                    )}

                    {/* Draft indicator */}
                    {ch.status === "draft" && (
                      <div style={{
                        position: "absolute", right: 12, top: 8, height: 20,
                        display: "flex", alignItems: "center",
                        fontSize: 11, color: "#CBD5E1", fontStyle: "italic",
                      }}>Not yet submitted</div>
                    )}

                    {/* Pulsing dot for active submissions */}
                    {(ch.status === "submitted" || ch.status === "acknowledged") && (
                      <div style={{
                        position: "absolute",
                        left: `calc(${((endIdx + 0.5) / TOTAL_DAYS) * 100}%)`,
                        top: 13, width: 10, height: 10, borderRadius: "50%",
                        background: cfg.barColor, border: "2px solid white",
                        boxShadow: `0 0 0 3px ${cfg.barColor}33`,
                      }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, padding: "14px 4px", fontSize: 12, color: "#94A3B8" }}>
        {Object.entries(statusConfig).filter(([k]) => k !== "failed").map(([k, v]) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 6, borderRadius: 3, background: v.barColor, opacity: k === "resolved" ? 0.7 : 1 }} />
            {v.label}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 2, height: 10, background: "rgba(255,255,255,0.6)", border: "1px solid #CBD5E1", borderRadius: 1 }} />
          Acknowledged
        </span>
      </div>
    </DashboardShell>
  );
}
