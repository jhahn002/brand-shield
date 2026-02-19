"use client";
import { useState, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import { THREATS, STATUS_MAP, TYPE_LABEL, severityColor } from "@/lib/mock-data";
import { useMounted } from "@/hooks/useApi";
import Link from "next/link";

const Chk = ({ checked, onChange }) => (
  <div onClick={e => { e.stopPropagation(); onChange(); }} style={{
    width: 18, height: 18, borderRadius: 5, cursor: "pointer", flexShrink: 0,
    border: checked ? "none" : "1.5px solid #CBD5E1",
    background: checked ? "#2563EB" : "white",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>{checked && <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1px solid", cursor: "pointer",
    background: active ? "#EFF6FF" : "white", borderColor: active ? "#BFDBFE" : "#E2E8F0", color: active ? "#2563EB" : "#94A3B8",
  }}>{label}</button>
);

export default function ThreatQueuePage() {
  const mounted = useMounted();
  const [selected, setSelected] = useState(new Set());
  const [sortKey, setSortKey] = useState("severity");
  const [sortDir, setSortDir] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let r = [...THREATS];
    if (filterStatus !== "all") r = r.filter(t => t.status === filterStatus);
    if (filterSeverity === "critical") r = r.filter(t => t.severity >= 70);
    else if (filterSeverity === "moderate") r = r.filter(t => t.severity >= 40 && t.severity < 70);
    else if (filterSeverity === "low") r = r.filter(t => t.severity < 40);
    if (search) r = r.filter(t => t.domain.includes(search.toLowerCase()));
    r.sort((a, b) => {
      const v = sortDir === "desc" ? -1 : 1;
      if (sortKey === "severity") return (a.severity - b.severity) * v;
      if (sortKey === "revenue") return (a.revenue - b.revenue) * v;
      return a.domain.localeCompare(b.domain) * v;
    });
    return r;
  }, [filterStatus, filterSeverity, search, sortKey, sortDir]);

  const allSel = filtered.length > 0 && filtered.every(t => selected.has(t.id));
  const handleSort = (k) => { if (sortKey === k) setSortDir(d => d === "desc" ? "asc" : "desc"); else { setSortKey(k); setSortDir("desc"); } };

  return (
    <DashboardShell>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#0F172A" }}>Threat Queue</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>{THREATS.length} threats detected · ${THREATS.reduce((s, t) => s + t.revenue, 0).toLocaleString()}/mo at risk</p>
        </div>
        {selected.size > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#DC2626", color: "white" }}>Initiate Takedown ({selected.size})</button>
            <button style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>Dismiss ({selected.size})</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "0 0 260px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search domains..." style={{ width: "100%", padding: "8px 14px 8px 36px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", background: "white", color: "#1E293B", outline: "none" }} />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4 }}>🔍</span>
        </div>
        <div style={{ height: 24, width: 1, background: "#E2E8F0" }} />
        {[["all", "All"], ["detected", "Detected"], ["investigating", "Investigating"], ["takedown_pending", "Pending"], ["resolved", "Resolved"]].map(([v, l]) => (
          <Pill key={v} label={l} active={filterStatus === v} onClick={() => setFilterStatus(v)} />
        ))}
        <div style={{ height: 24, width: 1, background: "#E2E8F0" }} />
        {[["all", "All"], ["critical", "Critical"], ["moderate", "Moderate"], ["low", "Low"]].map(([v, l]) => (
          <Pill key={v} label={l} active={filterSeverity === v} onClick={() => setFilterSeverity(v)} />
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #F1F5F9", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
              <th style={{ padding: "12px 16px", width: 40 }}><Chk checked={allSel} onChange={() => { if (allSel) setSelected(new Set()); else setSelected(new Set(filtered.map(t => t.id))); }} /></th>
              {[
                { k: "domain", l: "Domain" }, { k: "type", l: "Type" }, { k: "severity", l: "Severity" },
                { k: "revenue", l: "Revenue at Risk" }, { k: "status", l: "Status" }, { k: "firstSeen", l: "Detected" }, { k: "keywords", l: "Keywords" },
              ].map(c => (
                <th key={c.k} onClick={() => ["severity", "revenue", "domain"].includes(c.k) && handleSort(c.k)} style={{
                  textAlign: "left", padding: "12px 12px", fontSize: 12, fontWeight: 600, color: "#94A3B8",
                  cursor: ["severity", "revenue", "domain"].includes(c.k) ? "pointer" : "default", userSelect: "none",
                }}>
                  {c.l} {sortKey === c.k && <span style={{ color: "#2563EB", fontSize: 10 }}>{sortDir === "desc" ? "↓" : "↑"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const sel = selected.has(t.id);
              const sc = severityColor(t.severity);
              const s = STATUS_MAP[t.status] || STATUS_MAP.detected;
              return (
                <tr key={t.id} style={{
                  borderBottom: "1px solid #FAFBFC", cursor: "pointer",
                  background: sel ? "#F8FBFF" : "transparent",
                  opacity: mounted ? 1 : 0, animation: mounted ? `fadeIn 0.3s ease ${i * 0.02}s both` : "none",
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#FAFBFC"; }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = sel ? "#F8FBFF" : "transparent"; }}>
                  <td style={{ padding: "10px 16px" }}><Chk checked={sel} onChange={() => { const n = new Set(selected); n.has(t.id) ? n.delete(t.id) : n.add(t.id); setSelected(n); }} /></td>
                  <td style={{ padding: "12px 12px" }}>
                    <Link href={`/threats/${t.id}`} style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: "#1E293B", textDecoration: "none" }}>{t.domain}</Link>
                  </td>
                  <td style={{ padding: "12px 12px" }}><span style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 6, background: "#F1F5F9", color: "#64748B" }}>{TYPE_LABEL[t.type] || t.type}</span></td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 40, height: 5, borderRadius: 3, background: "#F1F5F9", overflow: "hidden" }}><div style={{ width: `${t.severity}%`, height: "100%", borderRadius: 3, background: sc }} /></div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: sc, fontFamily: "var(--font-mono)" }}>{t.severity}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px" }}><span style={{ fontSize: 15, fontWeight: 700, color: "#EF4444", fontFamily: "var(--font-mono)" }}>${t.revenue.toLocaleString()}</span><span style={{ fontSize: 11, color: "#CBD5E1" }}>/mo</span></td>
                  <td style={{ padding: "12px 12px" }}><span style={{ fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 6, background: s.bg, color: s.color }}>{s.label}</span></td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#94A3B8" }}>{t.firstSeen}</td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {t.keywords.slice(0, 2).map(k => (
                        <span key={k} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#F8FAFB", color: "#94A3B8", border: "1px solid #F1F5F9" }}>{k}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>No threats match your filters</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 4px", fontSize: 13, color: "#94A3B8" }}>
        <span>Showing {filtered.length} of {THREATS.length} threats</span>
        <div style={{ display: "flex", gap: 16 }}>
          <span>Critical: <strong style={{ color: "#EF4444" }}>{filtered.filter(t => t.severity >= 70).length}</strong></span>
          <span>Moderate: <strong style={{ color: "#F59E0B" }}>{filtered.filter(t => t.severity >= 40 && t.severity < 70).length}</strong></span>
          <span>Low: <strong style={{ color: "#22C55E" }}>{filtered.filter(t => t.severity < 40).length}</strong></span>
        </div>
      </div>
    </DashboardShell>
  );
}
