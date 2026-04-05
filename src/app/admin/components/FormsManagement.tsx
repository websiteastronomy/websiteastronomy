"use client";

import { useEffect, useState } from "react";
import {
  deleteDocumentationItemAction,
  getDocumentationManagerItemsAction,
  getFormResponsesAction,
  type DocumentationManagerItem,
} from "@/app/actions/files";
import { formatDateStable } from "@/lib/format-date";

export default function FormsManagement() {
  const [forms, setForms] = useState<DocumentationManagerItem[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadForms = async () => {
    setLoading(true);
    try {
      const items = await getDocumentationManagerItemsAction();
      const formItems = items.filter((item) => item.type === "form");
      setForms(formItems);
      if (formItems.length && !selectedFormId) {
        setSelectedFormId(formItems[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadForms();
  }, []);

  useEffect(() => {
    if (!selectedFormId) {
      setResponses([]);
      return;
    }
    getFormResponsesAction(selectedFormId).then(setResponses).catch(() => setResponses([]));
  }, [selectedFormId]);

  const selectedForm = forms.find((item) => item.id === selectedFormId) || null;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "0.35rem" }}>Forms Management</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>View forms, submission counts, detailed responses, and delete forms when needed.</p>
        </div>
      </div>
      {feedback ? <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "#86efac" }}>{feedback}</div> : null}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 360px) 1fr", gap: "1rem" }}>
        <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "14px", background: "rgba(12,18,34,0.55)", overflow: "hidden" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-subtle)", color: "var(--gold-light)" }}>All Forms</div>
          {loading ? <div style={{ padding: "1rem", color: "var(--text-muted)" }}>Loading forms...</div> : forms.length === 0 ? <div style={{ padding: "1rem", color: "var(--text-muted)" }}>No forms found.</div> : (
            <div style={{ display: "grid" }}>
              {forms.map((form) => (
                <button key={form.id} onClick={() => setSelectedFormId(form.id)} style={{ textAlign: "left", padding: "1rem", border: "none", borderBottom: "1px solid var(--border-subtle)", background: selectedFormId === form.id ? "rgba(201,168,76,0.08)" : "transparent", color: "inherit", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{form.name}</strong>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{form.isGlobal ? "Global" : form.projectTitle || "Project"}</span>
                  </div>
                  <div style={{ marginTop: "0.45rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Created {formatDateStable(form.createdAt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "14px", background: "rgba(12,18,34,0.55)", padding: "1rem" }}>
          {!selectedForm ? (
            <div style={{ color: "var(--text-muted)" }}>Select a form to inspect responses.</div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: 0, color: "var(--gold-light)" }}>{selectedForm.name}</h3>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {responses.length} submission(s) · {selectedForm.isGlobal ? "Global form" : selectedForm.projectTitle || "Project form"}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await deleteDocumentationItemAction(selectedForm.id);
                    setFeedback("Form deleted.");
                    setSelectedFormId(null);
                    setResponses([]);
                    await loadForms();
                  }}
                  style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", borderRadius: "8px", padding: "0.45rem 0.75rem", cursor: "pointer" }}
                >
                  Delete Form
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                      <th style={{ padding: "0.65rem 0.4rem" }}>Name</th>
                      <th style={{ padding: "0.65rem 0.4rem" }}>Email</th>
                      <th style={{ padding: "0.65rem 0.4rem" }}>Date</th>
                      <th style={{ padding: "0.65rem 0.4rem" }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response) => (
                      <tr key={response.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "0.65rem 0.4rem" }}>{response.externalDetails?.name || "Internal user"}</td>
                        <td style={{ padding: "0.65rem 0.4rem" }}>{response.externalDetails?.email || "Collected internally"}</td>
                        <td style={{ padding: "0.65rem 0.4rem" }}>{formatDateStable(response.createdAt)}</td>
                        <td style={{ padding: "0.65rem 0.4rem", textTransform: "capitalize" }}>{response.paymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {responses.map((response) => (
                <div key={response.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1rem", background: "rgba(0,0,0,0.18)" }}>
                  <div style={{ marginBottom: "0.5rem", color: "var(--gold-light)", fontSize: "0.85rem" }}>
                    {response.externalDetails?.name || "Internal user"} · {formatDateStable(response.createdAt)}
                  </div>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--text-secondary)", fontSize: "0.78rem" }}>{JSON.stringify(response.answers, null, 2)}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
