"use client";

import { useEffect, useMemo, useState } from "react";
import {
  acquireArticleEditLockAction,
  finalizeArticleEditRequestAction,
  getArticleDetailAction,
  getArticleManagementSnapshotAction,
  publishArticleAction,
  releaseArticleEditLockAction,
  reviewArticleAction,
  reviewArticleEditRequestAction,
  rollbackArticleVersionAction,
  saveArticleAction,
  setArticleHighlightAction,
  softDeleteArticleAction,
} from "@/app/actions/articles";
import { loadSiteSettingsClient } from "@/data/siteSettingsStatic";
import { writeSiteSettingsLocal } from "@/lib/settingsLocal";
import {
  ARTICLE_KNOWLEDGE_CATEGORIES,
  ARTICLE_TYPES,
  canPublishArticles,
  canReviewArticles,
} from "@/lib/article-workflow";
import { useAuth } from "@/context/AuthContext";
import { inputStyle, rowStyle } from "./shared";
import ArticleCoverImageField from "@/components/ArticleCoverImageField";
import { formatDateTimeStable } from "@/lib/format-date";

type ManagedArticle = any;
type ArticleDetail = any;

const queuePillStyle = (active: boolean) => ({
  border: `1px solid ${active ? "var(--gold)" : "var(--border-subtle)"}`,
  background: active ? "rgba(201,168,76,0.12)" : "transparent",
  color: active ? "var(--gold)" : "var(--text-secondary)",
  padding: "0.55rem 1rem",
  borderRadius: "999px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "0.82rem",
});

export default function ArticlesManager() {
  const { isAdmin, hasPermission } = useAuth();
  const access = { isAdmin, hasPermission };
  const canReview = canReviewArticles(access);
  const canPublish = canPublishArticles(access);

  const [articles, setArticles] = useState<ManagedArticle[]>([]);
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeQueue, setActiveQueue] = useState("under_review");
  const [editingArticle, setEditingArticle] = useState<ManagedArticle | null>(null);
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMode, setSaveMode] = useState<"draft" | "review" | "publish">("draft");
  const [formState, setFormState] = useState({
    title: "",
    contentType: "article",
    knowledgeCategory: "Theory",
    tags: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
    metaTitle: "",
    metaDescription: "",
  });
  const [dailyFact, setDailyFact] = useState("");
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [pendingDeleteArticleId, setPendingDeleteArticleId] = useState<string | null>(null);

  const loadSnapshot = async () => {
    setIsLoading(true);
    try {
      const snapshot = await getArticleManagementSnapshotAction();
      setArticles(snapshot.articles || []);
      setEditRequests(snapshot.editRequests || []);
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: "Failed to load article queues." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
    const settings = loadSiteSettingsClient();
    if (settings) {
      setSiteSettings(settings);
      setDailyFact(settings.dailyFact?.text || "");
    }
  }, []);

  const resetForm = () => {
    setFormState({
      title: "",
      contentType: "article",
      knowledgeCategory: "Theory",
      tags: "",
      excerpt: "",
      content: "",
      coverImageUrl: "",
      metaTitle: "",
      metaDescription: "",
    });
    setEditingArticle(null);
    setArticleDetail(null);
    setSaveMode("draft");
  };

  const closeEditor = async () => {
    if (editingArticle?.id && canReview) {
      try {
        await releaseArticleEditLockAction(editingArticle.id);
      } catch (error) {
        console.error(error);
      }
    }
    setShowForm(false);
    resetForm();
  };

  const openEditor = async (article?: ManagedArticle | null) => {
    if (!article) {
      resetForm();
      setShowForm(true);
      return;
    }

    try {
      if (canReview) {
        await acquireArticleEditLockAction(article.id);
      }
      const detail = await getArticleDetailAction(article.id);
      setEditingArticle(article);
      setArticleDetail(detail);
      setFormState({
        title: article.title || "",
        contentType: article.contentType || "article",
        knowledgeCategory: article.knowledgeCategory || "Theory",
        tags: (article.tags || []).join(", "),
        excerpt: article.excerpt || "",
        content: article.content || "",
        coverImageUrl: article.coverImageUrl || "",
        metaTitle: article.metaTitle || "",
        metaDescription: article.metaDescription || "",
      });
      setShowForm(true);
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to open article editor." });
    }
  };

  const handleUpdateFact = () => {
    if (!siteSettings) {
      return;
    }
    const next = { ...siteSettings, dailyFact: { ...siteSettings.dailyFact, text: dailyFact } };
    setSiteSettings(next);
    writeSiteSettingsLocal(next);
    setFeedback({ type: "success", message: "Daily fact updated in local site settings." });
  };

  const handleSave = async () => {
    if (!formState.title.trim() || !formState.content.trim()) {
      setFeedback({ type: "error", message: "Title and content are required." });
      return;
    }

    setFeedback(null);
    setIsSaving(true);
    try {
      await saveArticleAction(
        {
          id: editingArticle?.id,
          title: formState.title,
          contentType: formState.contentType as any,
          knowledgeCategory: formState.knowledgeCategory,
          tags: formState.tags,
          excerpt: formState.excerpt,
          content: formState.content,
          coverImageUrl: formState.coverImageUrl,
          metaTitle: formState.metaTitle,
          metaDescription: formState.metaDescription,
        },
        saveMode
      );
      await loadSnapshot();
      await closeEditor();
      setFeedback({ type: "success", message: "Article saved successfully." });
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to save article." });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredArticles = useMemo(() => {
    if (activeQueue === "ready") {
      return articles.filter((article) => article.status === "under_review" && article.coreApproved);
    }
    if (activeQueue === "under_review") {
      return articles.filter((article) => article.status === "under_review" && !article.coreApproved);
    }
    if (activeQueue === "draft") {
      return articles.filter((article) => article.status === "draft");
    }
    if (activeQueue === "published") {
      return articles.filter((article) => article.status === "published");
    }
    if (activeQueue === "rejected") {
      return articles.filter((article) => article.status === "rejected");
    }
    return articles;
  }, [activeQueue, articles]);

  const pendingEditRequests = editRequests.filter((request) => request.status === "pending");

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem" }}>Articles & Knowledge Base</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Structured publishing, version control, edit requests, and approval logs for the Education Hub.
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ fontFamily: "inherit", cursor: "pointer", fontSize: "0.8rem" }}
          onClick={() => void openEditor(null)}
        >
          + New Article
        </button>
      </div>

      {!showForm && (
        <div style={{ background: "linear-gradient(135deg, rgba(201, 168, 76, 0.1), rgba(12, 18, 34, 0.4))", border: "1px solid var(--gold-dark)", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--gold)" }}>Daily Astronomy Fact</h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <input value={dailyFact} onChange={(e) => setDailyFact(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "280px", background: "rgba(0,0,0,0.4)" }} />
            <button className="btn-secondary" style={{ padding: "0 1.5rem", fontSize: "0.8rem" }} onClick={handleUpdateFact}>
              Update Fact
            </button>
          </div>
        </div>
      )}

      {feedback ? (
        <div style={{
          marginBottom: "1rem",
          padding: "0.9rem 1rem",
          borderRadius: "8px",
          border: `1px solid ${feedback.type === "error" ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
          background: feedback.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          color: feedback.type === "error" ? "#fca5a5" : "#86efac",
          fontSize: "0.85rem",
        }}>
          {feedback.message}
        </div>
      ) : null}

      {showForm ? (
        <div style={{ display: "grid", gap: "1.25rem", marginBottom: "2rem" }}>
          <div style={{ padding: "1.5rem", background: "rgba(15, 22, 40, 0.4)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.35rem", color: "var(--gold)" }}>
                  {editingArticle ? "Edit Article" : "New Article"}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0 }}>
                  Every content change creates a full version snapshot before saving.
                </p>
              </div>
              {articleDetail?.activeLock ? (
                <div style={{ padding: "0.55rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: "0.78rem" }}>
                  Edit lock active until {articleDetail.activeLock.expiresAt ? formatDateTimeStable(articleDetail.activeLock.expiresAt).slice(11) : "soon"}
                </div>
              ) : null}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
              <input value={formState.title} onChange={(e) => setFormState((current) => ({ ...current, title: e.target.value }))} placeholder="Article title" style={inputStyle} />
              <select value={formState.contentType} onChange={(e) => setFormState((current) => ({ ...current, contentType: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                {ARTICLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select value={formState.knowledgeCategory} onChange={(e) => setFormState((current) => ({ ...current, knowledgeCategory: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                {ARTICLE_KNOWLEDGE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input value={formState.tags} onChange={(e) => setFormState((current) => ({ ...current, tags: e.target.value }))} placeholder="Tags (comma separated)" style={inputStyle} />
              <input value={formState.metaTitle} onChange={(e) => setFormState((current) => ({ ...current, metaTitle: e.target.value }))} placeholder="Meta title (optional)" style={inputStyle} />
              <input value={formState.metaDescription} onChange={(e) => setFormState((current) => ({ ...current, metaDescription: e.target.value }))} placeholder="Meta description (optional)" style={inputStyle} />
              <textarea value={formState.excerpt} onChange={(e) => setFormState((current) => ({ ...current, excerpt: e.target.value }))} placeholder="Short excerpt" rows={3} style={{ ...inputStyle, gridColumn: "1 / -1", resize: "vertical" }} />
              <textarea value={formState.content} onChange={(e) => setFormState((current) => ({ ...current, content: e.target.value }))} placeholder="Article content (Markdown/HTML supported)" rows={10} style={{ ...inputStyle, gridColumn: "1 / -1", resize: "vertical" }} />
            </div>

            <ArticleCoverImageField value={formState.coverImageUrl} onChange={(coverImageUrl) => setFormState((current) => ({ ...current, coverImageUrl }))} />

            <div style={{ display: "grid", gap: "0.8rem", marginTop: "1.2rem" }}>
              <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Save Mode</label>
              <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setSaveMode("draft")} style={queuePillStyle(saveMode === "draft")}>Save Draft</button>
                <button type="button" onClick={() => setSaveMode("review")} style={queuePillStyle(saveMode === "review")}>Submit For Review</button>
                {canPublish ? (
                  <button type="button" onClick={() => setSaveMode("publish")} style={queuePillStyle(saveMode === "publish")}>Publish Now</button>
                ) : null}
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
              <button className="btn-primary" disabled={isSaving} style={{ fontFamily: "inherit", cursor: "pointer", fontSize: "0.8rem", opacity: isSaving ? 0.7 : 1 }} onClick={() => void handleSave()}>
                {isSaving ? "Saving..." : "Save Article"}
              </button>
              <button className="btn-secondary" style={{ fontFamily: "inherit", cursor: "pointer", fontSize: "0.8rem", background: "transparent" }} onClick={() => void closeEditor()}>
                Cancel
              </button>
            </div>
          </div>

          {editingArticle ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ padding: "1.2rem", background: "rgba(15, 22, 40, 0.3)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <h4 style={{ marginTop: 0, marginBottom: "0.9rem" }}>Version History</h4>
                <div style={{ display: "grid", gap: "0.7rem" }}>
                  {(articleDetail?.versions || []).map((version: any) => (
                    <div key={version.id} style={{ padding: "0.9rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,12,22,0.55)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                        <strong>Version {version.versionNumber}</strong>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                          {formatDateTimeStable(version.createdAt)}
                        </span>
                      </div>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.75rem", background: "transparent", cursor: "pointer" }}
                        onClick={async () => {
                          try {
                            await rollbackArticleVersionAction(editingArticle.id, version.id);
                            await loadSnapshot();
                            const detail = await getArticleDetailAction(editingArticle.id);
                            setArticleDetail(detail);
                            setFeedback({ type: "success", message: `Rolled back to version ${version.versionNumber}.` });
                          } catch (error) {
                            console.error(error);
                            setFeedback({ type: "error", message: error instanceof Error ? error.message : "Rollback failed." });
                          }
                        }}
                      >
                        Roll Back
                      </button>
                    </div>
                  ))}
                  {(!articleDetail?.versions || articleDetail.versions.length === 0) ? (
                    <p style={{ color: "var(--text-muted)", margin: 0 }}>No prior versions recorded yet.</p>
                  ) : null}
                </div>
              </div>

              <div style={{ padding: "1.2rem", background: "rgba(15, 22, 40, 0.3)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <h4 style={{ marginTop: 0, marginBottom: "0.9rem" }}>Approval Logs</h4>
                <div style={{ display: "grid", gap: "0.7rem" }}>
                  {(articleDetail?.approvalLogs || []).map((log: any) => (
                    <div key={log.id} style={{ padding: "0.9rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,12,22,0.55)" }}>
                      <strong style={{ display: "block", marginBottom: "0.35rem" }}>{log.action}</strong>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                        {formatDateTimeStable(log.createdAt)}
                      </span>
                      {log.comment ? <p style={{ margin: "0.55rem 0 0", color: "var(--text-secondary)", fontSize: "0.82rem" }}>{log.comment}</p> : null}
                    </div>
                  ))}
                  {(!articleDetail?.approvalLogs || articleDetail.approvalLogs.length === 0) ? (
                    <p style={{ color: "var(--text-muted)", margin: 0 }}>No approval actions logged yet.</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        {[
          { id: "draft", label: `Drafts (${articles.filter((article) => article.status === "draft").length})` },
          { id: "under_review", label: `Under Review (${articles.filter((article) => article.status === "under_review" && !article.coreApproved).length})` },
          { id: "ready", label: `Ready To Publish (${articles.filter((article) => article.status === "under_review" && article.coreApproved).length})` },
          { id: "published", label: `Published (${articles.filter((article) => article.status === "published").length})` },
          { id: "rejected", label: `Rejected (${articles.filter((article) => article.status === "rejected").length})` },
          { id: "edit_requests", label: `Edit Requests (${pendingEditRequests.length})` },
        ].map((queue) => (
          <button key={queue.id} type="button" onClick={() => setActiveQueue(queue.id)} style={queuePillStyle(activeQueue === queue.id)}>
            {queue.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: "var(--gold)", padding: "1rem 0" }}>Loading article queues...</p>
      ) : activeQueue === "edit_requests" ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {pendingEditRequests.map((request) => {
            const article = articles.find((entry) => entry.id === request.articleId);
            return (
              <div key={request.id} style={{ ...rowStyle, padding: "1.2rem", alignItems: "flex-start", flexDirection: "column" }}>
                <div style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{article?.title || "Unknown article"}</h4>
                      <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        Core status: {request.coreStatus} | Admin status: {request.adminStatus}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
                      {request.coreStatus === "pending" ? (
                        <>
                          <button className="btn-secondary" style={{ background: "transparent", cursor: "pointer", fontSize: "0.75rem" }} onClick={async () => { setFeedback(null); try { await reviewArticleEditRequestAction(request.id, "approve"); await loadSnapshot(); setFeedback({ type: "success", message: "Edit request approved by Core." }); } catch (error) { console.error(error); setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to review edit request." }); } }}>
                            Core Approve
                          </button>
                          <button className="btn-secondary" style={{ background: "transparent", cursor: "pointer", fontSize: "0.75rem", borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }} onClick={async () => { setFeedback(null); try { await reviewArticleEditRequestAction(request.id, "reject"); await loadSnapshot(); setFeedback({ type: "success", message: "Edit request rejected by Core." }); } catch (error) { console.error(error); setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to review edit request." }); } }}>
                            Core Reject
                          </button>
                        </>
                      ) : null}
                      {canPublish && request.coreStatus === "approved" && request.adminStatus === "pending" ? (
                        <>
                          <button className="btn-primary" style={{ cursor: "pointer", fontSize: "0.75rem" }} onClick={async () => { setFeedback(null); try { await finalizeArticleEditRequestAction(request.id, "approve"); await loadSnapshot(); setFeedback({ type: "success", message: "Edit request merged into article." }); } catch (error) { console.error(error); setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to finalize edit request." }); } }}>
                            Merge Changes
                          </button>
                          <button className="btn-secondary" style={{ background: "transparent", cursor: "pointer", fontSize: "0.75rem", borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }} onClick={async () => { setFeedback(null); try { await finalizeArticleEditRequestAction(request.id, "reject"); await loadSnapshot(); setFeedback({ type: "success", message: "Edit request rejected by Admin." }); } catch (error) { console.error(error); setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to finalize edit request." }); } }}>
                            Admin Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ marginTop: "0.9rem", padding: "1rem", borderRadius: "8px", background: "rgba(8,12,22,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ margin: 0, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{request.proposedContent}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {pendingEditRequests.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No pending edit requests.</p>
          ) : null}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredArticles.map((article) => (
            <div key={article.id} style={{ ...rowStyle, padding: "1.2rem", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", fontWeight: 600 }}>{article.contentType}</span>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{article.knowledgeCategory}</span>
                  {article.isHighlighted ? <span style={{ fontSize: "0.65rem", background: "var(--gold)", color: "#000", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 700 }}>HIGHLIGHT</span> : null}
                </div>
                <h4 style={{ fontSize: "1.05rem", margin: "0 0 0.35rem" }}>{article.title}</h4>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0 0 0.5rem" }}>
                  {article.authorName} | Status: {article.status}{article.coreApproved ? " | Core approved" : ""}
                </p>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>{article.excerpt}</p>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button onClick={() => void openEditor(article)} style={{ background: "none", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", padding: "0.4rem 0.7rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                  Edit
                </button>
                {canReview && article.status === "under_review" && !article.coreApproved ? (
                  <>
                    <button className="btn-secondary" style={{ fontSize: "0.75rem", background: "transparent", cursor: "pointer" }} onClick={async () => { setFeedback(null); try { await reviewArticleAction(article.id, "approve"); await loadSnapshot(); setFeedback({ type: "success", message: "Article approved by Core." }); } catch (error) { console.error(error); setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to review article." }); } }}>
                      Core Approve
                    </button>
                    <button className="btn-secondary" style={{ fontSize: "0.75rem", background: "transparent", cursor: "pointer", borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }} onClick={async () => { setFeedback(null); try { await reviewArticleAction(article.id, "reject"); await loadSnapshot(); setFeedback({ type: "success", message: "Article rejected." }); } catch (error) { console.error(error); setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to review article." }); } }}>
                      Reject
                    </button>
                  </>
                ) : null}
                {canPublish && article.status === "under_review" && article.coreApproved ? (
                  <button className="btn-primary" style={{ fontSize: "0.75rem", cursor: "pointer" }} onClick={async () => { setFeedback(null); try { await publishArticleAction(article.id); await loadSnapshot(); setFeedback({ type: "success", message: "Article published." }); } catch (error) { console.error(error); setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to publish article." }); } }}>
                    Publish
                  </button>
                ) : null}
                {canReview && article.status === "published" ? (
                  <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <input
                      type="number"
                      defaultValue={article.highlightPriority || 0}
                      min={0}
                      max={999}
                      style={{ ...inputStyle, width: "86px", padding: "0.35rem 0.45rem", fontSize: "0.75rem" }}
                      onBlur={async (event) => {
                        const parsed = Number(event.currentTarget.value);
                        if (!Number.isFinite(parsed)) {
                          setFeedback({ type: "error", message: "Priority must be numeric." });
                          event.currentTarget.value = String(article.highlightPriority || 0);
                          return;
                        }
                        if (!article.isHighlighted) {
                          return;
                        }
                        setFeedback(null);
                        try {
                          await setArticleHighlightAction(article.id, true, parsed);
                          await loadSnapshot();
                        } catch (error) {
                          console.error(error);
                          setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to update highlight priority." });
                        }
                      }}
                    />
                    <button className="btn-secondary" style={{ fontSize: "0.75rem", background: "transparent", cursor: "pointer" }} onClick={async () => { setFeedback(null); try { await setArticleHighlightAction(article.id, !article.isHighlighted, article.highlightPriority || 0); await loadSnapshot(); setFeedback({ type: "success", message: article.isHighlighted ? "Article removed from highlights." : "Article added to highlights." }); } catch (error) { console.error(error); setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to update highlight state." }); } }}>
                      {article.isHighlighted ? "Unhighlight" : "Highlight"}
                    </button>
                  </div>
                ) : null}
                {canPublish ? (
                  <button className="btn-secondary" style={{ fontSize: "0.75rem", background: "transparent", cursor: "pointer", borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }} onClick={async () => { if (pendingDeleteArticleId !== article.id) { setFeedback(null); setPendingDeleteArticleId(article.id); return; } setFeedback(null); try { await softDeleteArticleAction(article.id); setPendingDeleteArticleId(null); await loadSnapshot(); setFeedback({ type: "success", message: `Article "${article.title}" moved out of the active queue.` }); } catch (error) { console.error(error); setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to delete article." }); } }}>
                    {pendingDeleteArticleId === article.id ? "Confirm Delete" : "Delete"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {filteredArticles.length === 0 ? (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No articles in this queue.</p>
          ) : null}
        </div>
      )}
    </>
  );
}
