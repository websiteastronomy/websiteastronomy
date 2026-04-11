"use client";

import AnimatedSection from "@/components/AnimatedSection";
import type { ActivityEntry } from "./types";

type PortalActivityProps = {
  recentActivity: ActivityEntry[];
  loading: boolean;
  formatTimestamp: (value: string | null) => string;
  limit?: number;
};

export default function PortalActivity({
  recentActivity,
  loading,
  formatTimestamp,
  limit,
}: PortalActivityProps) {
  const visibleActivity = typeof limit === "number" ? recentActivity.slice(0, limit) : recentActivity;

  return (
    <>
      <AnimatedSection>
        <h2
          style={{
            fontSize: "1.3rem",
            marginTop: "3rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>🕒</span> Personal Activity
        </h2>
      </AnimatedSection>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {loading ? (
          <div
            style={{
              padding: "1.1rem",
              background: "rgba(15,22,40,0.3)",
              borderRadius: "8px",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            Loading your activity...
          </div>
        ) : visibleActivity.length === 0 ? (
          <div
            style={{
              padding: "1.1rem",
              background: "rgba(15,22,40,0.3)",
              borderRadius: "8px",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No recent personal activity logged yet.
          </div>
        ) : (
          visibleActivity.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: "0.9rem 1rem",
                background: "rgba(15,22,40,0.35)",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <strong style={{ fontSize: "0.88rem" }}>{entry.action}</strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
              <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                {entry.entityType}
                {entry.entityId ? ` · ${entry.entityId}` : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
