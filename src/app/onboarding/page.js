"use client";
import { useState } from "react";
import { useMounted } from "@/hooks/useApi";

const StepIndicator = ({ steps, current }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700,
            background: i < current ? "#22C55E" : i === current ? "#2563EB" : "#F1F5F9",
            color: i <= current ? "white" : "#94A3B8", transition: "all 0.3s",
          }}>{i < current ? "✓" : i + 1}</div>
          <span style={{ fontSize: 13, fontWeight: i === current ? 600 : 400, color: i <= current ? "#0F172A" : "#94A3B8", whiteSpace: "nowrap" }}>{s}</span>
        </div>
        {i < steps.length - 1 && <div style={{ width: 48, height: 2, background: i < current ? "#22C55E" : "#F1F5F9", margin: "0 12px", borderRadius: 1, transition: "background 0.3s" }} />}
      </div>
    ))}
  </div>
);

export default function OnboardingPage() {
  const mounted = useMounted();
  const [step, setStep] = useState(0);
  const [brand, setBrand] = useState("");
  const [domain, setDomain] = useState("");
  const [aov, setAov] = useState("");
  const [convRate, setConvRate] = useState("");
  const steps = ["Brand Info", "Crawl & Fingerprint", "Review Keywords", "Go Live"];

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
    border: "1px solid #E2E8F0", background: "white", color: "#1E293B", outline: "none",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFB",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 640, padding: "40px 0" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #2563EB, #0EA5E9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "white" }}>B</div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#0F172A" }}>Brand Shield</span>
        </div>

        <StepIndicator steps={steps} current={step} />

        <div style={{
          background: "white", borderRadius: 16, padding: "36px 40px",
          border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          opacity: mounted ? 1 : 0, transition: "opacity 0.3s",
        }}>
          {step === 0 && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", color: "#0F172A" }}>Add your brand</h2>
              <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 0 28px" }}>We'll crawl your site to build a content fingerprint for threat detection.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Brand Name</label>
                  <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Beam Supplements" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Domain</label>
                  <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. beamsupplements.com" style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>AOV <span style={{ color: "#CBD5E1" }}>(optional)</span></label>
                    <input value={aov} onChange={e => setAov(e.target.value)} placeholder="$67.50" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "#475569", display: "block", marginBottom: 6 }}>Conversion Rate <span style={{ color: "#CBD5E1" }}>(optional)</span></label>
                    <input value={convRate} onChange={e => setConvRate(e.target.value)} placeholder="2.8%" style={inputStyle} />
                  </div>
                </div>
              </div>
              <button onClick={() => setStep(1)} style={{ marginTop: 28, padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white", width: "100%" }}>
                Start Crawl →
              </button>
            </>
          )}

          {step === 1 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#0F172A" }}>Crawling your site...</h2>
              <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 0 24px" }}>We're analyzing beamsupplements.com to build your brand fingerprint.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
                {[
                  { label: "Site crawl (142/200 pages)", pct: 71, done: false },
                  { label: "Content fingerprint", pct: 0, done: false },
                  { label: "Visual fingerprint", pct: 0, done: false },
                  { label: "Keyword generation", pct: 0, done: false },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: s.pct > 0 ? "#0F172A" : "#CBD5E1", fontWeight: 500 }}>{s.label}</span>
                      <span style={{ color: "#94A3B8", fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.pct}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: "#F1F5F9", overflow: "hidden" }}>
                      <div style={{ width: `${s.pct}%`, height: "100%", borderRadius: 3, background: "#2563EB", transition: "width 0.6s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(2)} style={{ marginTop: 28, padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>
                Skip to Keywords (demo) →
              </button>
            </div>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", color: "#0F172A" }}>Review keywords</h2>
              <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 0 20px" }}>We generated 47 keywords from your site content. Review and adjust.</p>
              <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid #F1F5F9", borderRadius: 10 }}>
                {["beam supplements", "beam official", "buy beam supplements", "beam health", "beam dream powder", "beam super greens", "beam supplements reviews", "beam supplement discount", "beam coupon", "beam focus supplement"].map((k, i) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #F8FAFB" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#1E293B" }}>{k}</span>
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>✓</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep(1)} style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #E2E8F0", cursor: "pointer", background: "white", color: "#64748B" }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>Confirm & Start Monitoring →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#0F172A" }}>You're live!</h2>
              <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 0 24px", lineHeight: 1.6 }}>
                Brand Shield is now monitoring 47 keywords for Beam Supplements. We'll run our first full SERP sweep and notify you when threats are detected.
              </p>
              <a href="/dashboard">
                <button style={{ padding: "11px 28px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", background: "#2563EB", color: "white" }}>Go to Dashboard →</button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
