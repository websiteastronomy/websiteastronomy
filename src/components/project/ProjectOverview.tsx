"use client";

import Link from "next/link";
import AnimatedSection from "@/components/AnimatedSection";

export default function ProjectOverview({ proj, projectId, showFullPageLink = false }: any) {
  return (
    <AnimatedSection>
      <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "0.5rem" }}>
          <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", margin: 0 }}>
            Mission Objective
          </p>
          {showFullPageLink ? (
            <Link
              href={`/projects/${projectId}`}
              style={{ color: "var(--gold)", fontSize: "0.75rem", whiteSpace: "nowrap" }}
            >
              Open full page →
            </Link>
          ) : null}
        </div>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--text-secondary)", borderLeft: "3px solid var(--gold)", paddingLeft: "1rem" }}>
          {proj.objective || proj.fullDescription || proj.description}
        </p>
      </div>
    </AnimatedSection>
  );
}
