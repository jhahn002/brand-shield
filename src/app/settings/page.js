"use client";
import { useState } from "react";
import { BRAND, WHITELISTED, TEAM } from "@/lib/mock-data";
import { useMounted } from "@/hooks/useApi";

const Toggle = ({ on, onChange }) => (
  <div onClick={onChange} style={{
    width: 40, height: 22, borderRadius: 11, cursor: "pointer", padding: 2,
    background: on ? "#2563EB" : "#E2E8F0", transition: "background 0.2s",
  }}>
    <div style={{
      width: 18, height: 18, borderRadius: "50%", background: "white",
      transform: on ? "translateX(18px)" : "translateX(0)", transition: "transform 0.2s",
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    }} />
  </div>
);

const SettingRow = ({ label, desc, children }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #F8FAFB" }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#1E293B" }}>{label}</div>
      {desc && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{desc}</div>}
    </div>
    {children}
  </div>
);

export default function SettingsPage() {
  const mounted = useMounted();
  const [tab, setTab] = useState("brand");
  const [notifs, setNotifs] = useState({ threats: true, severity: true, takedowns: true, weekly: false, fingerprint: true });

  const tabs = [
    { k: "brand", l: "Brand" }, { k: "whitelist", l: "Whitelist" },
    { k: "team", l: "Team" }, { k: "billing", l: "Billing" }, { k: "notifications", l: "Notifications" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px", color: "#0F172A" }}>Settings</h1>

      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #F1F5F9" }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            padding: "10px 20px", fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer",
            background: "transparent", color: tab === t.k ? "#2563EB" : "#94A3B8",
            borderBottom: tab === t.k ? "2px solid #2563EB" : "2px solid transparent", marginBottom: -1,
          }}>{t.l}</button>
        ))}
      </div>

      {tab === "brand" && (
        <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px", color: "#0F172A" }}>Brand Settings</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
            {[
              { label: "Brand Name", value: BRAND.name },
              { label: "Domain", value: BRAND.domain },
              { label: "AOV", value: "$" + BRAND.aov },
              { label: "Conversion Rate", value: (BRAND.conversionRate * 100).toFixed(1) + "%" },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>{f.label}</label>
                <input defaultValue={f.value} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", outline: "none" }} />
              </div>
            ))}
          </div>
          <div style={{ padding: 18, borderRadius: 12, background: "#F8FAFB", border: "1px solid #F1F5F9", marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>Fingerprint Status: <span style={{ color: "#22C55E" }}>Complete</span></div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Last refresh: {BRAND.fingerprintRefreshedAt} &middot; Next: {BRAND.nextFingerprintRefresh}</div>
              </div>
              <button style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>Refresh Now</button>
            </div>
          </div>
          <button style={{ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>Save Changes</button>
        </div>
      )}

      {tab === "whitelist" && (
        <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#0F172A" }}>Whitelisted Domains</h3>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: "2px 0 0" }}>Permanently excluded from threat detection</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <input placeholder="domain.com" style={{ flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", outline: "none" }} />
            <input placeholder="Reason" style={{ flex: 1.5, padding: "10px 14px", borderRadius: 8, fontSize: 13, border: "1px solid #E2E8F0", outline: "none" }} />
            <button style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>Add</button>
          </div>
          {WHITELISTED.map(w => (
            <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F8FAFB" }}>
              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: "#1E293B" }}>{w.domain}</span>
                <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 12 }}>{w.reason}</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 12, color: "#CBD5E1" }}>
                <span>{w.addedBy} &middot; {w.date}</span>
                <button style={{ fontSize: 12, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "team" && (
        <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#0F172A" }}>Team Members</h3>
            <button style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>+ Invite</button>
          </div>
          {TEAM.map(u => (
            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #F8FAFB" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "white" }}>
                  {u.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>{u.email}</div>
                </div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 6,
                background: u.role === "Account Owner" ? "#EFF6FF" : u.role === "Brand Manager" ? "#F5F3FF" : "#F1F5F9",
                color: u.role === "Account Owner" ? "#2563EB" : u.role === "Brand Manager" ? "#7C3AED" : "#94A3B8",
              }}>{u.role}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "billing" && (
        <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px", color: "#0F172A" }}>Billing</h3>
          <div style={{ padding: 20, borderRadius: 12, background: "linear-gradient(135deg, #EFF6FF, #F0F9FF)", border: "1px solid #DBEAFE", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1E40AF" }}>Starter Plan &middot; $97/mo</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>1 brand &middot; Core keyword monitoring &middot; $40/takedown</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F8FAFB" }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>Subscription (Feb)</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", fontFamily: "var(--font-mono)" }}>$97.00</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F8FAFB" }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>Takedowns (3 x $40)</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", fontFamily: "var(--font-mono)" }}>$120.00</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Total this month</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", fontFamily: "var(--font-mono)" }}>$217.00</span>
            </div>
          </div>
          <button style={{ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>Manage in Stripe</button>
        </div>
      )}

      {tab === "notifications" && (
        <div style={{ background: "white", borderRadius: 16, padding: 28, border: "1px solid #F1F5F9" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px", color: "#0F172A" }}>Notification Preferences</h3>
          <SettingRow label="New threat detected" desc="Get notified when a new bad actor is found">
            <Toggle on={notifs.threats} onChange={() => setNotifs(p => ({ ...p, threats: !p.threats }))} />
          </SettingRow>
          <SettingRow label="Severity escalation" desc="Alert when an existing threat severity increases">
            <Toggle on={notifs.severity} onChange={() => setNotifs(p => ({ ...p, severity: !p.severity }))} />
          </SettingRow>
          <SettingRow label="Takedown updates" desc="Status changes on submitted takedowns">
            <Toggle on={notifs.takedowns} onChange={() => setNotifs(p => ({ ...p, takedowns: !p.takedowns }))} />
          </SettingRow>
          <SettingRow label="Weekly summary" desc="Weekly email digest of monitoring activity">
            <Toggle on={notifs.weekly} onChange={() => setNotifs(p => ({ ...p, weekly: !p.weekly }))} />
          </SettingRow>
          <SettingRow label="Fingerprint refresh" desc="Notify when your site fingerprint needs updating">
            <Toggle on={notifs.fingerprint} onChange={() => setNotifs(p => ({ ...p, fingerprint: !p.fingerprint }))} />
          </SettingRow>
        </div>
      )}
    </div>
  );
}
