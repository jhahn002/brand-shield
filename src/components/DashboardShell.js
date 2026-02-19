"use client";
import Sidebar from "@/components/Sidebar";

export default function DashboardShell({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "28px 36px", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
