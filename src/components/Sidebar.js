"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND, DASHBOARD } from "@/lib/mock-data";

const NAV = [
  { section: "Monitor", items: [
    { icon: "📊", label: "Overview", href: "/dashboard" },
    { icon: "⚠️", label: "Threats", href: "/threats", badge: () => DASHBOARD.activeThreats },
    { icon: "🔑", label: "Keywords", href: "/keywords" },
    { icon: "🔍", label: "SERP Viewer", href: "/serp" },
  ]},
  { section: "Actions", items: [
    { icon: "📤", label: "Takedowns", href: "/takedowns", badge: () => DASHBOARD.pendingTakedowns },
    { icon: "📄", label: "Reports", href: "/audits" },
    { icon: "🎯", label: "Prospecting", href: "/audits" },
  ]},
  { section: "Settings", items: [
    { icon: "⚙️", label: "Settings", href: "/settings" },
    { icon: "👥", label: "Team", href: "/settings?tab=team" },
    { icon: "💳", label: "Billing", href: "/settings?tab=billing" },
  ]},
];

function SidebarItem({ icon, label, href, active, badge }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
        borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
        background: active ? "#F0F5FF" : "transparent",
        color: active ? "#2563EB" : "#64748B",
        fontWeight: active ? 600 : 400, fontSize: 14,
      }}>
        <span style={{ fontSize: 18, width: 22, textAlign: "center" }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {badge != null && (
          <span style={{
            background: "#EF4444", color: "white", fontSize: 11, fontWeight: 700,
            padding: "2px 7px", borderRadius: 10, minWidth: 20, textAlign: "center",
          }}>{badge}</span>
        )}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href.split("?")[0]);
  };

  return (
    <aside style={{
      width: 240, background: "white", borderRight: "1px solid #F1F5F9",
      padding: "24px 16px", display: "flex", flexDirection: "column",
      position: "sticky", top: 0, height: "100vh", flexShrink: 0,
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 32 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "white",
          }}>B</div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>Brand Shield</span>
        </div>
      </Link>

      {/* Navigation */}
      {NAV.map((group) => (
        <div key={group.section}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: "#94A3B8",
            letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "0 16px", marginBottom: 8,
          }}>{group.section}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 24 }}>
            {group.items.map((item) => (
              <SidebarItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={isActive(item.href)}
                badge={item.badge?.()}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Plan Card */}
      <div style={{ marginTop: "auto" }}>
        <div style={{
          padding: 16, borderRadius: 12,
          background: "linear-gradient(135deg, #EFF6FF, #F0F9FF)",
          border: "1px solid #DBEAFE",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1E40AF", marginBottom: 4 }}>
            {BRAND.planTier === "starter" ? "Starter Plan" : "Growth Plan"}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>
            1 brand · {BRAND.keywordsCount} keywords monitored
          </div>
        </div>
      </div>
    </aside>
  );
}
