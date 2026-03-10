"use client";
import { useState } from "react";
import { useMounted } from "@/hooks/useApi";

const AUDITS = [
  { id: 1, brand: "Beam Supplements", domain: "beamsupplements.com", type: "managed", status: "complete", started: "Feb 5", ends: "Feb 19", threats: 14, revenue: 28750, email: "" },
  { id: 2, brand: "NovaSkin", domain: "novaskin.co", type: "self_serve", status: "running", started: "Feb 12", ends: "Feb 26", threats: 6, revenue: 12400, email: "sarah@novaskin.co" },
  { id: 3, brand: "Peak Performance", domain: "peakperformance.com", type: "managed", status: "complete", started: "Jan 20", ends: "Feb 3", threats: 9, revenue: 19200, email: "" },
];

export default function AuditsPage() {
  const mounted = useMounted();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#0F172A" }}>Prospecting Audits</h1>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>Run brand audits to generate sales reports for prospects</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>+ New Audit</button>
      </div>

      {showCreate && (
        <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 18px", color: "#0F172A" }}>Create Audit</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Brand Name</label>
              <input placeholder="e.g. NovaSkin" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Domain</label>
              <input placeholder="e.g. novaskin.co" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Prospect Email <span style={{ color: "#CBD5E1" }}>(for self-serve)</span></label>
              <input placeholder="prospect@company.com" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Audit Type</label>
              <select style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", background: "white", color: "#1E293B" }}>
                <option value="managed">Managed (you run it)</option>
                <option value="self_serve">Self-Serve (prospect gets drip emails)</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>Start Audit</button>
            <button onClick={() => setShowCreate(false)} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {AUDITS.map((a, i) => (
          <div key={a.id} style={{
            background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            opacity: mounted ? 1 : 0, animation: mounted ? `fadeIn 0.3s ease ${i * 0.06}s both` : "none",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A" }}>{a.brand}</div>
                <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>{a.domain}</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                background: a.status === "running" ? "#EFF6FF" : "#F0FDF4",
                color: a.status === "running" ? "#2563EB" : "#16A34A",
              }}>{a.status === "running" ? "● Running" : "Complete"}</span>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "#F1F5F9", color: "#64748B", fontWeight: 500 }}>{a.type === "managed" ? "Managed" : "Self-Serve"}</span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "#F1F5F9", color: "#94A3B8" }}>{a.started} – {a.ends}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 10, background: "#F8FAFB", border: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>Threats Found</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#EF4444", fontFamily: "var(--font-mono)" }}>{a.threats}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: "#F8FAFB", border: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>Revenue at Risk</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#EF4444", fontFamily: "var(--font-mono)" }}>${(a.revenue / 1000).toFixed(1)}k</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>📄 PDF Report</button>
              <button style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>🔗 Portal Link</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
