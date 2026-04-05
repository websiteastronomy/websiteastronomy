"use client";

import { useEffect, useState, useTransition } from "react";
import {
  deleteDocumentationItemAction,
  getDocumentationManagerItemsAction,
  type DocumentationManagerItem,
} from "@/app/actions/files";
import FormsManagement from "./FormsManagement";

export default function DocumentationManager() {
  const [rows, setRows] = useState<DocumentationManagerItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () =>
    startTransition(async () => {
      try {
        setErrorMessage(null);
        setRows(await getDocumentationManagerItemsAction());
      } catch (error: any) {
        console.error(error);
        setRows([]);
        setErrorMessage(error?.message || "Failed to load documentation items.");
      }
    });

  useEffect(() => {
    load();
  }, []);

  const remove = (itemId: string) =>
    startTransition(async () => {
      try {
        await deleteDocumentationItemAction(itemId);
        setDeleteId(null);
        setRows((current) => current.filter((item) => item.id !== itemId));
      } catch (error: any) {
        console.error(error);
        setErrorMessage(error?.message || "Failed to delete item.");
      }
    });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem" }}>Documentation Management</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            View all files, docs, and forms. Global content lives in the Documentation Hub; project content stays in project workspaces.
          </p>
        </div>
        <a href="/documentation" style={{ color: "var(--gold)", fontSize: "0.85rem" }}>Open Hub →</a>
      </div>

      {errorMessage ? (
        <div style={{ marginBottom: "1rem", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: "0.85rem" }}>
          {errorMessage}
        </div>
      ) : null}

      <div style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "rgba(15,22,40,0.35)" }}>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>
          Permission model:
          Admin has full access.
          Core-level roles reuse existing RBAC (`manage_projects` / `approve_actions`) for create, edit, upload, and delete.
          Crew-level users can view the global hub and continue using existing project permissions inside projects.
        </p>
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {isPending && rows.length === 0 ? (
          <div style={{ color: "var(--text-muted)" }}>Loading documentation inventory...</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "var(--text-muted)" }}>No documentation items found.</div>
        ) : (
          rows.map((row) => (
            <div key={row.id} style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "1rem 1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <strong style={{ display: "block" }}>{row.name}</strong>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    {row.isGlobal ? "Global Hub" : row.projectTitle || row.projectId || "Project"} · {row.type} · {row.uploadedBy}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{new Date(row.updatedAt).toISOString().slice(0, 10)}</span>
                  {deleteId === row.id ? (
                    <>
                      <button onClick={() => remove(row.id)} style={{ background: "#ef4444", border: "none", color: "#fff", borderRadius: "6px", padding: "0.4rem 0.7rem", cursor: "pointer", fontFamily: "inherit", fontSize: "0.75rem" }}>Confirm</button>
                      <button onClick={() => setDeleteId(null)} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "6px", padding: "0.4rem 0.7rem", cursor: "pointer", fontFamily: "inherit", fontSize: "0.75rem" }}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteId(row.id)} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444", borderRadius: "6px", padding: "0.4rem 0.7rem", cursor: "pointer", fontFamily: "inherit", fontSize: "0.75rem" }}>Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ height: "1px", background: "var(--border-subtle)", margin: "2rem 0" }} />
      <FormsManagement />
    </>
  );
}
