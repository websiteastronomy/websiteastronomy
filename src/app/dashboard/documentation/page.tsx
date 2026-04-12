"use client";

import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

const DocumentationHubClient = dynamic(
  () => import("@/components/DocumentationHubClient"),
  {
    loading: () => <div style={{ color: "var(--text-muted)" }}>Loading documentation hub...</div>,
  },
);

export default function DashboardDocumentationPage() {
  const { user, isAdmin, hasPermission } = useAuth();

  const canManage = isAdmin || hasPermission("manage_projects") || hasPermission("approve_actions");
  const canUpload = canManage;

  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", fontFamily: "'Cinzel', serif", marginBottom: "0.4rem" }}>
        <span className="gradient-text">Documentation</span>
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Browse and manage shared documents, forms, and files.
      </p>
      <DocumentationHubClient
        scope={{ isGlobal: true }}
        userName={user?.name || "Unknown"}
        canManage={canManage}
        canUpload={canUpload}
        canDeleteAny={canManage}
        title="Documentation Hub"
        subtitle="Global docs, forms, and files shared across the club."
      />
    </div>
  );
}
