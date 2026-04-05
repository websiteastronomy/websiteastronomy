"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminFormListAction, type AdminFormListItem } from "@/app/actions/files";
import { formatDateStable } from "@/lib/format-date";

export default function FormsManagement() {
  const [forms, setForms] = useState<AdminFormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminFormListAction()
      .then((rows) => {
        if (!active) return;
        setForms(rows);
        setError(null);
      })
      .catch((reason: any) => {
        if (!active) return;
        setForms([]);
        setError(reason?.message || "Failed to load forms.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "0.35rem" }}>Forms Management</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Open a form dashboard to review responses, analytics, editing, and settings.
        </p>
      </div>

      {error ? (
        <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#fca5a5" }}>
          {error}
        </div>
      ) : null}

      <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "14px", background: "rgba(12,18,34,0.55)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1.5fr) 140px 160px 160px", gap: "0.75rem", padding: "0.95rem 1rem", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <div>Form Title</div>
          <div>Status</div>
          <div>Submission Count</div>
          <div>Created Date</div>
        </div>

        {loading ? (
          <div style={{ padding: "1rem", color: "var(--text-muted)" }}>Loading forms...</div>
        ) : forms.length === 0 ? (
          <div style={{ padding: "1rem", color: "var(--text-muted)" }}>No forms found.</div>
        ) : (
          forms.map((form) => (
            <Link
              key={form.id}
              href={`/admin/forms/${form.id}`}
              style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1.5fr) 140px 160px 160px", gap: "0.75rem", padding: "1rem", borderBottom: "1px solid var(--border-subtle)", textDecoration: "none", color: "inherit", alignItems: "center" }}
            >
              <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{form.title}</div>
              <div>
                <span style={{ padding: "0.3rem 0.65rem", borderRadius: "999px", background: form.status === "published" ? "rgba(34,197,94,0.12)" : "rgba(251,191,36,0.12)", color: form.status === "published" ? "#86efac" : "#fbbf24", fontSize: "0.75rem", textTransform: "capitalize" }}>
                  {form.status}
                </span>
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.86rem" }}>{form.submissionCount}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.86rem" }}>{formatDateStable(form.createdAt)}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
