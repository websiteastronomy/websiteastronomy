"use client";

import AnimatedSection from "@/components/AnimatedSection";
import type { SystemControlSettings } from "@/lib/system-control";

type PortalOverviewProps = {
  maintenanceActive: boolean;
  systemControl: SystemControlSettings | null;
  formatTimestamp: (value: string | null) => string;
};

export default function PortalOverview({
  maintenanceActive,
  systemControl,
  formatTimestamp,
}: PortalOverviewProps) {
  if (!maintenanceActive) {
    return null;
  }

  return (
    <AnimatedSection>
      <div
        style={{
          marginBottom: "1.2rem",
          padding: "1rem 1.2rem",
          borderRadius: "10px",
          border: "1px solid rgba(201,168,76,0.35)",
          background: "rgba(201,168,76,0.08)",
        }}
      >
        <strong style={{ display: "block", marginBottom: "0.35rem", color: "var(--gold)" }}>
          System Status
        </strong>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem" }}>
          Maintenance mode is currently active.{" "}
          {systemControl?.maintenanceReason || "Some public areas may be unavailable."}
        </p>
        {systemControl?.maintenanceUntil && (
          <p style={{ margin: "0.45rem 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>
            Until {formatTimestamp(systemControl.maintenanceUntil)}
          </p>
        )}
      </div>
    </AnimatedSection>
  );
}
