/**
 * Shared UI Design System
 *
 * Single source of truth for all admin and dashboard UI primitives.
 * Used across /app, /admin, and /dashboard for visual consistency.
 *
 * ⚠️  DO NOT duplicate these styles in page-level components.
 *     Import from here instead.
 */

import React from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   STYLE TOKENS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Standard form input style — matches admin panel inputs. */
export const inputStyle: React.CSSProperties = {
  padding: "0.7rem 1rem",
  background: "rgba(15, 22, 40, 0.5)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "6px",
  color: "var(--text-primary)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  width: "100%",
};

/** Standard list-row style — matches admin panel rows. */
export const rowStyle: React.CSSProperties = {
  padding: "1rem 1.5rem",
  background: "rgba(15, 22, 40, 0.3)",
  borderRadius: "8px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.5rem",
};

/** Standard card / panel wrapper background. */
export const panelStyle: React.CSSProperties = {
  padding: "1.5rem",
  background: "rgba(15, 22, 40, 0.4)",
  borderRadius: "12px",
  border: "1px solid var(--border-subtle)",
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Section Header ── */

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>{title}</h2>
        {subtitle && (
          <p
            style={{
              color: "var(--text-secondary)",
              marginTop: "0.3rem",
              marginBottom: 0,
              fontWeight: 300,
              fontSize: "0.9rem",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── Stats Card ── */

export function StatsCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div
      style={{
        textAlign: "left",
        padding: "1.3rem",
        background: "rgba(15, 22, 40, 0.4)",
        borderRadius: "8px",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "0.4rem",
          margin: 0,
        }}
      >
        {label}
      </p>
      <h3
        style={{
          fontSize: "1.8rem",
          marginBottom: "0.2rem",
          marginTop: "0.4rem",
          color: "var(--gold-light)",
        }}
      >
        {value}
      </h3>
      {detail && (
        <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
          {detail}
        </span>
      )}
    </div>
  );
}

/* ── Stats Grid ── */

export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
        marginBottom: "2.5rem",
      }}
    >
      {children}
    </div>
  );
}

/* ── Feedback Banner ── */

export function FeedbackBanner({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const isSuccess = type === "success";
  return (
    <div
      style={{
        marginBottom: "1rem",
        padding: "0.8rem 1rem",
        borderRadius: "8px",
        border: isSuccess
          ? "1px solid rgba(34,197,94,0.35)"
          : "1px solid rgba(239,68,68,0.35)",
        background: isSuccess
          ? "rgba(34,197,94,0.1)"
          : "rgba(239,68,68,0.1)",
        color: isSuccess ? "#86efac" : "#fca5a5",
        fontSize: "0.85rem",
      }}
    >
      {message}
    </div>
  );
}

/* ── Status Badge ── */

export function StatusBadge({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      style={{
        fontSize: "0.72rem",
        padding: "0.25rem 0.6rem",
        borderRadius: "12px",
        background: bg,
        color: color,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

/* ── Table Container ── */

export function TableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(15,22,40,0.35)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

/* ── Table Header ── */

export function TableHeader({
  columns,
}: {
  columns: { label: string; style?: React.CSSProperties }[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns.map(() => "1fr").join(" "),
        gap: "1rem",
        padding: "0.8rem 1.2rem",
        borderBottom: "1px solid var(--border-subtle)",
        fontSize: "0.7rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-muted)",
        fontWeight: 600,
      }}
    >
      {columns.map((col, i) => (
        <span key={i} style={col.style}>
          {col.label}
        </span>
      ))}
    </div>
  );
}

/* ── Empty State ── */

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{description}</div>
    </div>
  );
}

/* ── Panel / Card Wrapper ── */

export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        ...panelStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
