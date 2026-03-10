"use client";
import { useState, useMemo } from "react";
import { useMounted } from "@/hooks/useApi";

const AUDITS = [
  { id: 1, brand: "Beam Supplements", domain: "beamsupplements.com", type: "managed", status: "complete", started: "2026-02-05", ends: "2026-02-19", threats: 14, revenue: 28750, email: "" },
  { id: 2, brand: "NovaSkin", domain: "novaskin.co", type: "self_serve", status: "running", started: "2026-02-12", ends: "2026-02-26", threats: 6, revenue: 12400, email: "sarah@novaskin.co" },
  { id: 3, brand: "Peak Performance", domain: "peakperformance.com", type: "managed", status: "complete", started: "2026-01-20", ends: "2026-02-03", threats: 9, revenue: 19200, email: "" },
  { id: 4, brand: "Vital Roots", domain: "vitalroots.com", type: "self_serve", status: "running", started: "2026-02-14", ends: "2026-02-28", threats: 3, revenue: 6800, email: "mark@vitalroots.com" },
  { id: 5, brand: "LuxForm", domain: "luxform.co", type: "managed", status: "expired", started: "2026-01-01", ends: "2026-01-15", threats: 11, revenue: 22100, email: "" },
  { id: 6, brand: "Solara Beauty", domain: "solarabeauty.com", type: "self_serve", status: "complete", started: "2026-01-28", ends: "2026-02-11", threats: 7, revenue: 15300, email: "jen@solarabeauty.com" },
  { id: 7, brand: "Apex Nutrition", domain: "apexnutrition.io", type: "managed", status: "running", started: "2026-02-17", ends: "2026-03-03", threats: 2, revenue: 4200, email: "" },
];

const statusConfig = {
  running: { label: "Running", color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
  complete: { label: "Complete", color: "#16A34A", bg: "#F0FDF4", dot: "#22C55E" },
  expired: { label: "Expired", color: "#94A3B8", bg: "#F8FAFC", dot: "#CBD5E1" },
};

const fmt = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const COLUMNS = [
  { key: "brand", label: "Brand", sortable: true },
  { key: "type", label: "Type", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "threats", label: "Threats", sortable: true },
  { key: "revenue", label: "Revenue at Risk", sortable: true },
  { key: "started", label: "Started", sortable: true },
  { key: "ends", label: "Ends", sortable: true },
  { key: "actions", label: "", sortable: false },
];

export default function AuditsPage() {
  const mounted = useMounted();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("started");
  const [sortDir, setSortDir] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleSort = (key) => {
    if (!COLUMNS.find(c => c.key === key)?.sortable) return;
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = AUDITS.filter(a => {
      const matchSearch = search === "" ||
        a.brand.toLowerCase().includes(search.toLowerCase()) ||
        a.domain.toLowerCase().includes(search.toLowerCase()) ||
        (a.email || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });

    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase(), bv = bv.toLowerCase();
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    return list;
  }, [search, statusFilter, sortKey, sortDir]);

  const running = AUDITS.filter(a => a.status === "running").length;
  const totalRevenue = AUDITS.reduce((s, a) => s + a.revenue, 0);
  const avgThreats = Math.round(AUDITS.reduce((s, a) => s + a.threats, 0) / AUDITS.length);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span style={{ color: "#CBD5E1", fontSize: 10 }}>⇅</span>;
    return <span style={{ color: "#2563EB", fontSize: 10 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const Pill = ({ label, value, active, onClick }) => (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1px solid", cursor: "pointer",
      background: active ? "#EFF6FF" : "white", borderColor: active ? "#BFDBFE" : "#E2E8F0", color: active ? "#2563EB" : "#94A3B8",
    }}>{label}{value !== undefined && <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>({value})</span>}</button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#0F172A" }}>Prospecting</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>Brand audits for sales outreach and pipeline development</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white", display: "flex", alignItems: "center", gap: 6 }}>
          + New Audit
        </button>
      </div>

      {/* Summary Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Audits", value: AUDITS.length, icon: "📋", color: "#2563EB", bg: "#EFF6FF" },
          { label: "Currently Running", value: running, icon: "⚡", color: "#D97706", bg: "#FFFBEB" },
          { label: "Avg Threats Found", value: avgThreats, icon: "🎯", color: "#EF4444", bg: "#FEF2F2" },
          { label: "Total Revenue Exposed", value: "$" + (totalRevenue / 1000).toFixed(0) + "k", icon: "💰", color: "#16A34A", bg: "#F0FDF4" },
        ].map((m, i) => (
          <div key={i} style={{
            background: "white", borderRadius: 14, padding: "16px 20px", border: "1px solid #F1F5F9",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(6px)",
            transition: `all 0.3s ease ${i * 0.05}s`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{m.icon}</div>
              <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", fontFamily: "var(--font-mono)", letterSpacing: "-0.03em" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#0F172A" }}>New Audit</h3>
            <button onClick={() => setShowCreate(false)} style={{ fontSize: 18, border: "none", background: "none", cursor: "pointer", color: "#94A3B8", lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            {[
              { label: "Brand Name", placeholder: "e.g. NovaSkin" },
              { label: "Domain", placeholder: "e.g. novaskin.co" },
              { label: "Prospect Email", placeholder: "prospect@company.com" },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>{f.label}</label>
                <input placeholder={f.placeholder} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Audit Type</label>
              <select style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", background: "white", color: "#1E293B" }}>
                <option value="managed">Managed (you run it)</option>
                <option value="self_serve">Self-Serve (drip emails)</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>Start Audit</button>
            <button onClick={() => setShowCreate(false)} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search brand, domain, email..."
            style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Pill label="All" value={AUDITS.length} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <Pill label="Running" value={AUDITS.filter(a => a.status === "running").length} active={statusFilter === "running"} onClick={() => setStatusFilter("running")} />
          <Pill label="Complete" value={AUDITS.filter(a => a.status === "complete").length} active={statusFilter === "complete"} onClick={() => setStatusFilter("complete")} />
          <Pill label="Expired" value={AUDITS.filter(a => a.status === "expired").length} active={statusFilter === "expired"} onClick={() => setStatusFilter("expired")} />
        </div>
        <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: "auto" }}>{filtered.length} audit{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #F1F5F9", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
              {COLUMNS.map(col => (
                <th key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{
                    textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600,
                    color: sortKey === col.key ? "#2563EB" : "#94A3B8",
                    cursor: col.sortable ? "pointer" : "default",
                    userSelect: "none", whiteSpace: "nowrap",
                  }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    {col.sortable && <SortIcon col={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No audits match your search</td></tr>
            )}
            {filtered.map((a, i) => {
              const cfg = statusConfig[a.status];
              const isRunning = a.status === "running";
              return (
                <tr key={a.id}
                  style={{ borderBottom: "1px solid #FAFBFC", opacity: mounted ? 1 : 0, animation: mounted ? `fadeIn 0.25s ease ${i * 0.03}s both` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFBFC"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Brand */}
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{a.brand}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "var(--font-mono)", marginTop: 1 }}>{a.domain}</div>
                    {a.email && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{a.email}</div>}
                  </td>

                  {/* Type */}
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 6,
                      background: a.type === "managed" ? "#F0F9FF" : "#F5F3FF",
                      color: a.type === "managed" ? "#0369A1" : "#7C3AED",
                    }}>
                      {a.type === "managed" ? "Managed" : "Self-Serve"}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {isRunning && <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, animation: "pulse 1.5s infinite" }} />}
                      {cfg.label}
                    </span>
                  </td>

                  {/* Threats */}
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)", color: a.threats >= 10 ? "#DC2626" : a.threats >= 5 ? "#D97706" : "#64748B" }}>{a.threats}</span>
                  </td>

                  {/* Revenue */}
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#DC2626" }}>${a.revenue.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "#CBD5E1" }}>/mo</span>
                  </td>

                  {/* Started */}
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#64748B" }}>{fmt(a.started)}</td>

                  {/* Ends */}
                  <td style={{ padding: "13px 16px", fontSize: 13, color: isRunning ? "#D97706" : "#94A3B8", fontWeight: isRunning ? 500 : 400 }}>
                    {fmt(a.ends)}
                    {isRunning && <div style={{ fontSize: 11, color: "#D97706" }}>Active</div>}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white", whiteSpace: "nowrap" }}>
                        📄 Report
                      </button>
                      <button style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>
                        🔗
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
