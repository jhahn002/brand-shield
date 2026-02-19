"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { KEYWORDS } from "@/lib/mock-data";
import { useMounted } from "@/hooks/useApi";

const SERP_DATA = {
  keyword: "beam supplements",
  checkedAt: "Feb 19, 2026 · 2:14 PM",
  geoTarget: "United States",
  paid: [
    { position: 1, title: "Beam Supplements™ - Official Store | 60% Off Today", display: "beam-supplements-official.com/shop", desc: "Shop the official Beam Supplements collection. Premium health & wellness products. Free shipping.", domain: "beam-supplements-official.com", isThreat: true, severity: 94 },
    { position: 2, title: "Beam® | Science-Backed Supplements", display: "beamsupplements.com", desc: "Discover our full line of plant-powered supplements. Dream, Focus, Super Greens & more.", domain: "beamsupplements.com", isBrand: true },
    { position: 3, title: "Official Beam Store - Best Prices Guaranteed", display: "official-beam.co/store", desc: "Get Beam supplements at the lowest prices. Free returns. Shop now.", domain: "official-beam.co", isThreat: true, severity: 76 },
    { position: 4, title: "GNC - Health & Wellness Supplements", display: "gnc.com/supplements", desc: "Browse thousands of health and wellness supplements. Free shipping on $49+.", domain: "gnc.com", isWhitelisted: true },
  ],
  organic: [
    { position: 1, title: "Beam Supplements | Plant-Powered Wellness", url: "beamsupplements.com", desc: "Beam creates premium supplements using plant-based ingredients. Our best sellers: Dream Powder, Super Greens, Focus.", domain: "beamsupplements.com", isBrand: true },
    { position: 2, title: "Beam Supplements Review 2026: Is It Worth It?", url: "supplementreviews.com/beam", desc: "Our honest review of Beam Supplements products. We test Dream Powder, Super Greens, and more.", domain: "supplementreviews.com", isWhitelisted: true },
    { position: 3, title: "Beam Health & Wellness - Premium Store", url: "getbeamhealth.store", desc: "Shop Beam health and wellness products. Same quality, better prices. Order today for fast delivery.", domain: "getbeamhealth.store", isThreat: true, severity: 87 },
    { position: 4, title: "Beam Supplements Reviews - Are They Legit?", url: "beamsupplements-reviews.org", desc: "Read real user reviews of Beam supplements. Is it worth the hype? Find out here.", domain: "beamsupplements-reviews.org", isThreat: true, severity: 55 },
    { position: 5, title: "r/supplements - Beam Supplements Discussion", url: "reddit.com/r/supplements/beam", desc: "Community discussion about Beam supplements, dosages, and experiences.", domain: "reddit.com", isWhitelisted: true },
  ],
  shopping: [
    { title: "Beam Dream Powder - Sleep Aid", price: "$38.00", merchant: "beamsupplements.com", image: true, isBrand: true },
    { title: "Beam Dream Powder - 60% Off!", price: "$15.99", merchant: "beamwellness-shop.com", image: true, isThreat: true, severity: 82 },
    { title: "Beam Super Greens - Superfood", price: "$34.00", merchant: "beamsupplements.com", image: true, isBrand: true },
  ],
};

const ResultBadge = ({ isThreat, isBrand, isWhitelisted, severity }) => {
  if (isThreat) return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>⚠️ Threat · {severity}</span>;
  if (isBrand) return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>✓ Your brand</span>;
  if (isWhitelisted) return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#F1F5F9", color: "#94A3B8", border: "1px solid #E2E8F0" }}>Whitelisted</span>;
  return null;
};

export default function SerpViewerPage() {
  const mounted = useMounted();
  const [selectedKw, setSelectedKw] = useState("beam supplements");
  const threatenedKws = KEYWORDS.filter(k => k.threats > 0).slice(0, 8);

  return (
    <DashboardShell>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#0F172A" }}>SERP Viewer</h1>
        <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>Visual reconstruction of search results with threat highlighting</p>
      </div>

      {/* Keyword Selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {threatenedKws.map(k => (
          <button key={k.term} onClick={() => setSelectedKw(k.term)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1px solid", cursor: "pointer",
            background: selectedKw === k.term ? "#EFF6FF" : "white",
            borderColor: selectedKw === k.term ? "#BFDBFE" : "#E2E8F0",
            color: selectedKw === k.term ? "#2563EB" : "#64748B",
          }}>
            {k.term} <span style={{ color: "#EF4444", fontWeight: 700, marginLeft: 4 }}>{k.threats}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#94A3B8" }}>
          Showing SERP for <strong style={{ color: "#0F172A" }}>"{selectedKw}"</strong> · {SERP_DATA.checkedAt} · {SERP_DATA.geoTarget}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        {/* Main SERP */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Paid Ads */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: "#94A3B8", letterSpacing: "0.03em", textTransform: "uppercase" }}>Paid Ads</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SERP_DATA.paid.map((r, i) => (
                <div key={i} style={{
                  padding: 16, borderRadius: 12,
                  border: r.isThreat ? "2px solid #FECACA" : "1px solid #F1F5F9",
                  background: r.isThreat ? "#FFFBFB" : "#FAFBFC",
                  opacity: mounted ? 1 : 0, animation: mounted ? `fadeIn 0.3s ease ${i * 0.05}s both` : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      <span style={{ fontWeight: 600, color: "#D97706" }}>Ad · #{r.position}</span> · {r.display}
                    </div>
                    <ResultBadge {...r} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: "#2563EB", marginBottom: 4, lineHeight: 1.3 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Organic */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: "#94A3B8", letterSpacing: "0.03em", textTransform: "uppercase" }}>Organic Results</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SERP_DATA.organic.map((r, i) => (
                <div key={i} style={{
                  padding: 16, borderRadius: 12,
                  border: r.isThreat ? "2px solid #FECACA" : "1px solid #F1F5F9",
                  background: r.isThreat ? "#FFFBFB" : "#FAFBFC",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>#{r.position} · {r.url}</div>
                    <ResultBadge {...r} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: "#2563EB", marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shopping Sidebar */}
        <div>
          <div style={{ background: "white", borderRadius: 16, padding: 20, border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px", color: "#94A3B8", letterSpacing: "0.03em", textTransform: "uppercase" }}>Shopping</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SERP_DATA.shopping.map((s, i) => (
                <div key={i} style={{
                  padding: 14, borderRadius: 12,
                  border: s.isThreat ? "2px solid #FECACA" : "1px solid #F1F5F9",
                  background: s.isThreat ? "#FFFBFB" : "#FAFBFC",
                }}>
                  <div style={{ height: 56, borderRadius: 8, background: s.isThreat ? "#FEF2F2" : "#F0FDF4", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {s.isThreat ? "⚠️" : "🌿"}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1E293B", marginBottom: 4, lineHeight: 1.3 }}>{s.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: s.isThreat ? "#DC2626" : "#0F172A", fontFamily: "var(--font-mono)" }}>{s.price}</span>
                    <ResultBadge {...s} />
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{s.merchant}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
