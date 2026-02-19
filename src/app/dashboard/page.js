"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { DASHBOARD, BRAND, STATUS_MAP, severityColor } from "@/lib/mock-data";
import { useMounted } from "@/hooks/useApi";
import Link from "next/link";

export default function DashboardPage() {
  const mounted = useMounted();
  const [period, setPeriod] = useState("6m");
  const d = DASHBOARD;
  const maxChart = Math.max(...d.chartData.map(c => c.threats));

  const chartW = 480, chartH = 120, padX = 0, padY = 8;
  const stepX = chartW / (d.chartData.length - 1);
  const threatPoints = d.chartData.map((c, i) => [padX + i * stepX, padY + chartH - (c.threats / maxChart) * chartH]);
  const resolvedPoints = d.chartData.map((c, i) => [padX + i * stepX, padY + chartH - (c.resolved / maxChart) * chartH]);
  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const toArea = (pts) => toPath(pts) + ` L${pts[pts.length-1][0]},${padY+chartH} L${pts[0][0]},${padY+chartH} Z`;

  return (
    <DashboardShell>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#0F172A", letterSpacing: "-0.02em" }}>Good morning! 👋</h1>
          <p style={{ fontSize: 14, color: "#94A3B8", margin: "4px 0 0" }}>
            Here's what's happening with <strong style={{ color: "#64748B" }}>{BRAND.name}</strong> today
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "white", border: "1px solid #E2E8F0", fontSize: 13, color: "#64748B" }}>
            📅 Feb 19, 2026
          </div>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "white", cursor: "pointer" }}>JS</div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { icon: "⚠️", label: "Active Threats", value: d.activeThreats, change: "+3", changeUp: true, changePct: "this week", bg: "#FEF2F2" },
          { icon: "💰", label: "Revenue at Risk", value: `$${d.revenueAtRisk.toLocaleString()}`, change: "$4,200", changeUp: true, changePct: "/mo increase", bg: "#FFFBEB" },
          { icon: "✅", label: "Resolved This Month", value: d.resolvedMonth, change: "67%", changeUp: false, changePct: "success rate", bg: "#F0FDF4" },
          { icon: "📤", label: "Pending Takedowns", value: d.pendingTakedowns, change: "2", changeUp: false, changePct: "awaiting approval", bg: "#EFF6FF" },
        ].map((m, i) => (
          <div key={i} style={{
            background: "white", borderRadius: 16, padding: "22px 24px",
            border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
            transition: `all 0.4s ease ${i * 0.06}s`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{m.icon}</div>
              <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#0F172A", fontFamily: "var(--font-mono)", letterSpacing: "-0.03em" }}>{m.value}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
              <span style={{ color: m.changeUp ? "#EF4444" : "#22C55E", fontWeight: 600 }}>{m.changeUp ? "↑" : ""} {m.change}</span> {m.changePct}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 24 }}>
        {/* Chart */}
        <div style={{ background: "white", borderRadius: 16, padding: "24px 28px", border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#0F172A" }}>Revenue at risk</h2>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: "2px 0 0" }}>Monthly trend of threats detected vs. resolved</p>
            </div>
            <div style={{ display: "flex", gap: 4, background: "#F8FAFB", borderRadius: 8, padding: 3 }}>
              {["1m", "3m", "6m", "1y"].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer",
                  background: period === p ? "white" : "transparent", color: period === p ? "#0F172A" : "#94A3B8",
                  boxShadow: period === p ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 32, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#EF4444", fontFamily: "var(--font-mono)", letterSpacing: "-0.03em" }}>$28,750</div>
              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
                <span style={{ color: "#EF4444", fontWeight: 600 }}>↑ $4,200 (+17%)</span> vs last month
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20, position: "relative" }}>
            <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + padY * 2}`} style={{ overflow: "visible" }}>
              {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                <line key={pct} x1={0} y1={padY + chartH * (1 - pct)} x2={chartW} y2={padY + chartH * (1 - pct)} stroke="#F1F5F9" strokeWidth={1} />
              ))}
              <path d={toArea(threatPoints)} fill="url(#threatGrad)" opacity={0.3} />
              <path d={toArea(resolvedPoints)} fill="url(#resolvedGrad)" opacity={0.25} />
              <path d={toPath(threatPoints)} fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <path d={toPath(resolvedPoints)} fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {threatPoints.map((p, i) => <circle key={`t${i}`} cx={p[0]} cy={p[1]} r={4} fill="white" stroke="#EF4444" strokeWidth={2} />)}
              {resolvedPoints.map((p, i) => <circle key={`r${i}`} cx={p[0]} cy={p[1]} r={4} fill="white" stroke="#22C55E" strokeWidth={2} />)}
              <defs>
                <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22C55E" /><stop offset="100%" stopColor="#22C55E" stopOpacity={0} /></linearGradient>
              </defs>
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "0 2px" }}>
              {d.chartData.map(c => (
                <span key={c.month} style={{ fontSize: 12, color: c.month === "Feb" ? "#0F172A" : "#CBD5E1", fontWeight: c.month === "Feb" ? 600 : 400 }}>{c.month}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 14, fontSize: 12, color: "#94A3B8" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 3, borderRadius: 2, background: "#EF4444" }} /> New threats</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 3, borderRadius: 2, background: "#22C55E" }} /> Resolved</span>
          </div>
        </div>

        {/* Callout + Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "linear-gradient(135deg, #FEF2F2, #FFF7ED)", borderRadius: 16, padding: "22px 24px", border: "1px solid #FECACA" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>You're losing ~$958/day</div>
            <p style={{ fontSize: 13, color: "#92400E", margin: 0, lineHeight: 1.6 }}>
              14 bad actors are diverting your search traffic right now. Each day without action is another ~$958 in potential revenue lost to impersonators.
            </p>
            <Link href="/threats">
              <button style={{ marginTop: 14, padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#DC2626", color: "white" }}>Review top threats →</button>
            </Link>
          </div>
          <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", border: "1px solid #F1F5F9", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px", color: "#0F172A" }}>Recent activity</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {d.activity.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < d.activity.length - 1 ? "1px solid #F8FAFB" : "none", opacity: mounted ? 1 : 0, transition: `opacity 0.3s ${0.3 + i * 0.05}s` }}>
                  <span style={{ fontSize: 14, lineHeight: "20px", flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.4 }}>{a.text}</p>
                    <span style={{ fontSize: 11, color: "#CBD5E1" }}>{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Threats Table */}
      <div style={{ background: "white", borderRadius: 16, padding: "24px 28px", border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#0F172A" }}>Top threats</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "2px 0 0" }}>Highest severity threats requiring immediate action</p>
          </div>
          <Link href="/threats"><button style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>View all threats →</button></Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Domain", "Type", "Severity", "Revenue at Risk", "Status", "Detected"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#94A3B8", borderBottom: "1px solid #F1F5F9", letterSpacing: "0.02em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.threats.map((t, i) => {
              const sevColor = severityColor(t.severity);
              const s = STATUS_MAP[t.status] || STATUS_MAP.detected;
              return (
                <tr key={t.id} style={{ cursor: "pointer", opacity: mounted ? 1 : 0, animation: mounted ? `fadeIn 0.3s ease ${0.2 + i * 0.04}s both` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFBFC"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 12px" }}><Link href={`/threats/${t.id}`} style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: "#1E293B", textDecoration: "none" }}>{t.domain}</Link></td>
                  <td style={{ padding: "14px 12px" }}><span style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 6, background: "#F1F5F9", color: "#64748B" }}>{t.type}</span></td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 40, height: 5, borderRadius: 3, background: "#F1F5F9", overflow: "hidden" }}><div style={{ width: `${t.severity}%`, height: "100%", borderRadius: 3, background: sevColor }} /></div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: sevColor, fontFamily: "var(--font-mono)" }}>{t.severity}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px" }}><span style={{ fontSize: 15, fontWeight: 700, color: "#EF4444", fontFamily: "var(--font-mono)" }}>${t.revenue.toLocaleString()}</span><span style={{ fontSize: 11, color: "#CBD5E1" }}>/mo</span></td>
                  <td style={{ padding: "14px 12px" }}><span style={{ fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 6, background: s.bg, color: s.color }}>{s.label}</span></td>
                  <td style={{ padding: "14px 12px", fontSize: 13, color: "#94A3B8" }}>{t.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
