"use client";

import DocumentationHubClient from "@/components/DocumentationHubClient";
import { useAuth } from "@/context/AuthContext";

export default function DashboardFormsPage() {
  const { user, isAdmin, hasPermission } = useAuth();

  const canManage = isAdmin || hasPermission("manage_projects") || hasPermission("approve_actions");
  const canUpload = canManage;

  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", fontFamily: "'Cinzel', serif", marginBottom: "0.4rem" }}>
        <span className="gradient-text">Forms</span>
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Access and manage forms. Form creation and management uses the Documentation system.
      </p>
      <DocumentationHubClient
        scope={{ isGlobal: true }}
        userName={user?.name || "Unknown"}
        canManage={canManage}
        canUpload={canUpload}
        canDeleteAny={canManage}
        title="Forms & Documents"
        subtitle="Create, manage, and review forms in one place."
      />
    </div>
  );
}
