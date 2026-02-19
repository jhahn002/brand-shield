"use client";
import { useState, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import { KEYWORDS, TYPE_COLOR, priorityColor, intervalLabel } from "@/lib/mock-data";
import { useMounted } from "@/hooks/useApi";

const typeLabel = { exact_brand: "Brand", brand_modifier: "Modifier", product: "Product", misspelling: "Misspelling", long_tail: "Long Tail" };

const Pill = ({ label, active, onClick, color }) => (
  <button onClick={onClick} style={{
    padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1px solid", cursor: "pointer",
    background: active ? (color ? `${color}10` : "#EFF6FF") : "white",
    borderColor: active ? (color || "#BFDBFE") : "#E2E8F0",
    color: active ? (color || "#2563EB") : "#94A3B8",
  }}>{label}</button>
);

export default function KeywordsPage() {
  const mounted = useMounted();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortKey, setSortKey] = useState("priority");
  const [sortDir, setSortDir] = useState("desc");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    let r = [...KEYWORDS];
    if (filterType !== "all") r = r.filter(k => k.type === filterType);
    if (search) r = r.filter(k => k.term.includes(search.toLowerCase()));
    r.sort((a, b) => {
      const v = sortDir === "desc" ? -1 : 1;
      if (sortKey === "priority") return (a.priority - b.priority) * v;
      if (sortKey === "volume") return (a.volume - b.volume) * v;
      if (sortKey === "threats") return (a.threats - b.threats) * v;
      return a.term.localeCompare(b.term) * v;
    });
    return r;
  }, [filterType, search, sortKey, sortDir]);

  const handleSort = (k) => { if (sortKey === k) setSortDir(d => d === "desc" ? "asc" : "desc"); else { setSortKey(k); setSortDir("desc"); } };

  const totals = { volume: filtered.reduce((s, k) => s + k.volume, 0), threats: filtered.reduce((s, k) => s + k.threats, 0) };

  return (
    <DashboardShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#0F172A" }}>Keywords</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>{KEYWORDS.length} monitored · {totals.volume.toLocaleString()} total monthly volume</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>
          + Add Keywords
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: "#0F172A" }}>Add Keywords</h3>
          <textarea placeholder="Enter keywords, one per line..." style={{ width: "100%", padding: 14, borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", minHeight: 80, fontFamily: "var(--font-mono)", resize: "vertical", outline: "none" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>Add & Monitor</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "0 0 260px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search keywords..." style={{ width: "100%", padding: "8px 14px 8px 36px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", background: "white", color: "#1E293B", outline: "none" }} />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4 }}>🔍</span>
        </div>
        <div style={{ height: 24, width: 1, background: "#E2E8F0" }} />
        {[["all", "All"], ["exact_brand", "Brand"], ["brand_modifier", "Modifier"], ["product", "Product"], ["misspelling", "Misspelling"], ["long_tail", "Long Tail"]].map(([v, l]) => (
          <Pill key={v} label={l} active={filterType === v} onClick={() => setFilterType(v)} color={v !== "all" ? TYPE_COLOR[v] : undefined} />
        ))}
      </div>

      <div style={{ background: "white", borderRadius: 16, border: "1px solid #F1F5F9", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
              {[
                { k: "term", l: "Keyword" }, { k: "type", l: "Type" }, { k: "volume", l: "Volume" },
                { k: "cpc", l: "CPC" }, { k: "priority", l: "Priority" }, { k: "interval", l: "Frequency" },
                { k: "lastChecked", l: "Last Checked" }, { k: "threats", l: "Threats" },
              ].map(c => (
                <th key={c.k} onClick={() => ["priority", "volume", "threats", "term"].includes(c.k) && handleSort(c.k)} style={{
                  textAlign: "left", padding: "12px 14px", fontSize: 12, fontWeight: 600, color: "#94A3B8",
                  cursor: ["priority", "volume", "threats", "term"].includes(c.k) ? "pointer" : "default", userSelect: "none",
                }}>
                  {c.l} {sortKey === c.k && <span style={{ color: "#2563EB", fontSize: 10 }}>{sortDir === "desc" ? "↓" : "↑"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((k, i) => {
              const pc = priorityColor(k.priority);
              const tc = TYPE_COLOR[k.type] || "#64748B";
              return (
                <tr key={k.id} style={{
                  borderBottom: "1px solid #FAFBFC",
                  opacity: mounted ? 1 : 0, animation: mounted ? `fadeIn 0.3s ease ${i * 0.02}s both` : "none",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#FAFBFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: "#1E293B" }}>{k.term}</span>
                    {!k.active && <span style={{ fontSize: 10, marginLeft: 8, padding: "2px 6px", borderRadius: 4, background: "#F1F5F9", color: "#94A3B8" }}>paused</span>}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: `${tc}12`, color: tc }}>{typeLabel[k.type]}</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#475569" }}>{k.volume.toLocaleString()}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#94A3B8" }}>${k.cpc.toFixed(2)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 36, height: 5, borderRadius: 3, background: "#F1F5F9", overflow: "hidden" }}><div style={{ width: `${k.priority}%`, height: "100%", borderRadius: 3, background: pc }} /></div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: pc, fontFamily: "var(--font-mono)" }}>{k.priority}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "#F1F5F9", color: "#64748B", fontWeight: 500 }}>{intervalLabel(k.interval)}</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#94A3B8" }}>{k.lastChecked}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {k.threats > 0 ? (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#EF4444", fontFamily: "var(--font-mono)" }}>{k.threats}</span>
                    ) : (
                      <span style={{ fontSize: 12, color: "#CBD5E1" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
