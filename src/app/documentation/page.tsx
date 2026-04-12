"use client";

import AnimatedSection from "@/components/AnimatedSection";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";

const DocumentationHubClient = dynamic(
  () => import("@/components/DocumentationHubClient"),
  {
    loading: () => <div style={{ color: "var(--text-muted)" }}>Loading documentation hub...</div>,
  },
);

export default function DocumentationPage() {
  const { user, loading, isAdmin, hasPermission } = useAuth();

  const canManage = isAdmin || hasPermission("manage_projects") || hasPermission("approve_actions");
  const canUpload = canManage;

  if (loading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)" }}>
        Loading documentation hub...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <AnimatedSection>
          <h1 className="page-title"><span className="gradient-text">Documentation Hub</span></h1>
          <p style={{ color: "var(--text-muted)", textAlign: "center", maxWidth: "720px", margin: "1rem auto 0" }}>
            Sign in to access club-wide documentation, shared forms, and reference files.
          </p>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingTop: "3rem", paddingBottom: "4rem" }}>
      <AnimatedSection>
        <p className="section-title" style={{ textAlign: "center" }}>Club Knowledge Base</p>
        <h1 className="page-title"><span className="gradient-text">Documentation Hub</span></h1>
      </AnimatedSection>

      <div style={{ marginTop: "2rem" }}>
        <DocumentationHubClient
          scope={{ isGlobal: true }}
          userName={user.name || "Unknown"}
          canManage={canManage}
          canUpload={canUpload}
          canDeleteAny={canManage}
          title="Documentation Hub"
          subtitle="Global docs, forms, and files shared across the club."
        />
      </div>
    </div>
  );
}
