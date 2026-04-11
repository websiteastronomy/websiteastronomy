"use client";

import FinanceWorkspaceClient from "@/components/FinanceWorkspaceClient";

export default function DashboardFinancePage() {
  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", fontFamily: "'Cinzel', serif", marginBottom: "0.4rem" }}>
        <span className="gradient-text">Finance</span>
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        View payments, submit expenses, and track financial activity.
      </p>
      <FinanceWorkspaceClient />
    </div>
  );
}
