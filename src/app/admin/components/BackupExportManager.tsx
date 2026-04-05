"use client";

import { useEffect, useState, useTransition } from "react";
import { getAdminFormListAction, type AdminFormListItem } from "@/app/actions/files";

export default function BackupExportManager() {
  const [forms, setForms] = useState<AdminFormListItem[]>([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        setErrorMessage(null);
        const rows = await getAdminFormListAction();
        setForms(rows);
        if (rows.length > 0) {
          setSelectedFormId((current) => current || rows[0].id);
        }
      } catch (error: any) {
        console.error(error);
        setErrorMessage(error?.message || "Failed to load forms for export.");
      }
    });
  }, []);

  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40px",
    padding: "0.65rem 0.95rem",
    borderRadius: "8px",
    border: "1px solid rgba(201,168,76,0.28)",
    color: "var(--gold-light)",
    background: "rgba(201,168,76,0.08)",
    textDecoration: "none",
    fontSize: "0.82rem",
    fontFamily: "inherit",
    cursor: "pointer",
  };

  return (
    <div style={{ marginTop: "2rem", padding: "1.2rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", background: "rgba(15,22,40,0.35)" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--gold-light)" }}>Backup & Export</h3>
        <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
          Admin-only exports for documentation metadata, forms, activity logs, and full metadata backup.
        </p>
      </div>

      {errorMessage ? (
        <div style={{ marginBottom: "1rem", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: "0.85rem" }}>
          {errorMessage}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "grid", gap: "0.7rem" }}>
          <strong style={{ fontSize: "0.86rem" }}>Documentation Metadata</strong>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a href="/admin/export/docs?format=json" style={buttonStyle}>Export Docs</a>
            <a href="/admin/export/docs?format=csv" style={buttonStyle}>Export Docs CSV</a>
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.7rem" }}>
          <strong style={{ fontSize: "0.86rem" }}>Forms Responses</strong>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={selectedFormId}
              onChange={(event) => setSelectedFormId(event.target.value)}
              style={{ minWidth: "240px", padding: "0.65rem 0.85rem", background: "rgba(8,12,22,0.55)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit" }}
              disabled={isPending || forms.length === 0}
            >
              {forms.length === 0 ? <option value="">No forms available</option> : null}
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.title}
                </option>
              ))}
            </select>
            <a href={selectedFormId ? `/admin/export/forms?formId=${encodeURIComponent(selectedFormId)}` : "/admin/export/forms"} style={buttonStyle}>
              Export Forms
            </a>
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.7rem" }}>
          <strong style={{ fontSize: "0.86rem" }}>Activity Logs</strong>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a href="/admin/export/activity" style={buttonStyle}>Export Activity</a>
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.7rem" }}>
          <strong style={{ fontSize: "0.86rem" }}>System Backup</strong>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a href="/admin/backup/full" style={buttonStyle}>Full Backup</a>
          </div>
        </div>
      </div>
    </div>
  );
}
