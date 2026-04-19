"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { canAccessAdminPage as canAccessAdminDashboard } from "@/lib/admin-access";
import {
  deleteDocumentationItemAction,
  getDocumentationItemAction,
  getFormAnalyticsAction,
  getFormContentAction,
  getFormResponsesAction,
  updateFormContentAction,
  type FormAnalytics,
  type FormResponseView,
  type ProjectFile,
} from "@/app/actions/files";
import { FormAnalyticsPanel, FormQuestionsEditor, FormResponsesPanel, FormSettingsPanel } from "@/components/FormBuilderPanels";

type Props = {
  formId: string;
};

type DashboardTab = "responses" | "analytics" | "edit" | "settings";

const defaultTabs: Array<{ id: DashboardTab; label: string }> = [
  { id: "responses", label: "Responses" },
  { id: "analytics", label: "Analytics" },
  { id: "edit", label: "Edit Form" },
  { id: "settings", label: "Settings" },
];

export default function FormDashboardClient({ formId }: Props) {
  const { user, isAdmin, hasPermission, loading: authLoading, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<DashboardTab>("responses");
  const [formItem, setFormItem] = useState<ProjectFile | null>(null);
  const [formDraft, setFormDraft] = useState<Record<string, unknown>>({});
  const [responses, setResponses] = useState<FormResponseView[]>([]);
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const access = useMemo(() => ({ isAdmin, hasPermission }), [hasPermission, isAdmin]);
  const canAccessAdminPage = canAccessAdminDashboard(access);
  const canEdit = isAdmin || hasPermission("manage_projects") || hasPermission("approve_actions");

  const load = async () => {
    setLoading(true);
    try {
      const [item, content, formResponses, formAnalytics] = await Promise.all([
        getDocumentationItemAction(formId),
        getFormContentAction(formId),
        getFormResponsesAction(formId),
        getFormAnalyticsAction(formId),
      ]);
      setFormItem(item);
      setFormDraft((content as Record<string, unknown>) || {});
      setResponses(formResponses as FormResponseView[]);
      setAnalytics(formAnalytics);
      setFeedback(null);
    } catch (reason: any) {
      setFeedback({ type: "error", message: reason?.message || "Failed to load form dashboard." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !canAccessAdminPage) return;
    void load();
  }, [user, canAccessAdminPage, formId]);

  const saveForm = async () => {
    setSaving(true);
    try {
      await updateFormContentAction(formId, formDraft);
      await load();
      setFeedback({ type: "success", message: "Form updated." });
    } catch (reason: any) {
      setFeedback({ type: "error", message: reason?.message || "Failed to update form." });
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async () => {
    setDeleting(true);
    try {
      await deleteDocumentationItemAction(formId);
      window.location.href = "/admin/docs";
    } catch (reason: any) {
      setFeedback({ type: "error", message: reason?.message || "Failed to delete form." });
      setDeleting(false);
    }
  };

  if (authLoading) {
    return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)" }}>Loading dashboard...</div>;
  }

  if (!user) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: "420px", textAlign: "center", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "2rem", background: "rgba(12,18,34,0.6)" }}>
          <h1 style={{ marginTop: 0, color: "var(--text-primary)" }}>Sign in required</h1>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>You need an authenticated account to open the admin form dashboard.</p>
          <button onClick={() => void signInWithGoogle()} className="btn-primary">Continue with Google</button>
        </div>
      </div>
    );
  }

  if (!canAccessAdminPage) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: "420px", textAlign: "center", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "16px", padding: "2rem", background: "rgba(12,18,34,0.6)" }}>
          <h1 style={{ marginTop: 0, color: "var(--text-primary)" }}>Permission denied</h1>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>This form dashboard is restricted to admin or core users with documentation access.</p>
          <Link href="/admin" style={{ color: "var(--gold)", textDecoration: "none" }}>Back to Admin</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingTop: "2rem", paddingBottom: "3rem", maxWidth: "1180px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <Link href="/admin/docs" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem" }}>← Back to Forms List</Link>
          <h1 style={{ margin: "0.5rem 0 0", color: "var(--text-primary)", fontSize: "2rem" }}>{String(formDraft.title || formItem?.name || "Form Dashboard")}</h1>
          <p style={{ margin: "0.45rem 0 0", color: "var(--text-muted)", lineHeight: 1.6 }}>Manage responses, analytics, editing, and publishing in one place.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={() => void saveForm()} disabled={saving || loading || !canEdit} className="btn-primary" style={{ opacity: saving || !canEdit ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {feedback ? (
        <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", borderRadius: "10px", border: feedback.type === "success" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)", background: feedback.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", color: feedback.type === "success" ? "#86efac" : "#fca5a5" }}>
          {feedback.message}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {defaultTabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{ padding: "0.65rem 0.95rem", borderRadius: "999px", border: tab === item.id ? "1px solid rgba(201,168,76,0.3)" : "1px solid var(--border-subtle)", background: tab === item.id ? "rgba(201,168,76,0.12)" : "rgba(12,18,34,0.55)", color: tab === item.id ? "var(--gold-light)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)", color: "var(--text-muted)" }}>Loading form dashboard...</div>
      ) : (
        <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "18px", background: "linear-gradient(180deg, rgba(16,22,40,0.92), rgba(9,14,28,0.95))", padding: "1.35rem" }}>
          {tab === "responses" ? <FormResponsesPanel responses={responses} /> : null}
          {tab === "analytics" ? <FormAnalyticsPanel analytics={analytics} /> : null}
          {tab === "edit" ? <FormQuestionsEditor formName={formItem?.name || "Form"} formDraft={formDraft} canEdit={canEdit} onChange={setFormDraft} /> : null}
          {tab === "settings" ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              <FormSettingsPanel formId={formId} formDraft={formDraft} canEdit={canEdit} onChange={setFormDraft} />
              <div style={{ border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "1rem", background: "rgba(127,29,29,0.12)" }}>
                <h3 style={{ marginTop: 0, color: "#fca5a5" }}>Danger Zone</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                  Delete this form and all linked responses. Existing documentation and file features remain unchanged.
                </p>
                <button onClick={() => void deleteForm()} disabled={deleting} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", borderRadius: "8px", padding: "0.65rem 0.9rem", cursor: "pointer", fontFamily: "inherit" }}>
                  {deleting ? "Deleting..." : "Delete Form"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
