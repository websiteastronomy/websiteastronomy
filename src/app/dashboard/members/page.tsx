"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function MemberCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "1rem 1.1rem",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
        background: "rgba(12,18,34,0.55)",
        textDecoration: "none",
      }}
    >
      <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "0.4rem" }}>
        {title}
      </strong>
      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.6 }}>
        {description}
      </p>
      <span style={{ display: "inline-block", marginTop: "0.85rem", color: "var(--gold)", fontSize: "0.82rem" }}>
        {cta}
      </span>
    </Link>
  );
}

export default function DashboardMembersPage() {
  const { isAdmin, hasPermission } = useAuth();
  const canApprove = isAdmin || hasPermission("approve_actions");

  return (
    <div style={{ maxWidth: "980px", display: "grid", gap: "1.25rem" }}>
      <div>
        <h1 style={{ fontSize: "1.4rem", fontFamily: "'Cinzel', serif", marginBottom: "0.4rem" }}>
          <span className="gradient-text">Directory & Approvals</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Member-facing directory access stays in the dashboard, while approvals continue to run through the admin panel.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <MemberCard
          title="Public Directory"
          description="Browse approved member profiles, leadership, and club highlights."
          href="/about"
          cta="Open directory"
        />
        <MemberCard
          title="Membership Application"
          description="Send prospective members to the official join flow without duplicating approval logic."
          href="/join"
          cta="Open join page"
        />
        <MemberCard
          title={canApprove ? "Approvals Queue" : "Approvals Process"}
          description={
            canApprove
              ? "Open the master approvals workflow in the admin panel."
              : "Approvals are managed by Core Committee and Admin from the master control panel."
          }
          href={canApprove ? "/admin?tab=members" : "/admin"}
          cta={canApprove ? "Open approvals" : "View control center"}
        />
      </div>
    </div>
  );
}
