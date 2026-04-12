"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { deriveDashboardRole } from "@/lib/module-access";
import { formatDateStable } from "@/lib/format-date";
import { getPublishedArticlesAction } from "@/app/actions/articles";
import { getCollection, updateDocument, deleteDocument } from "@/lib/db";
import { useToast } from "@/components/ToastProvider";

export default function DashboardEducationPage() {
  const { user, roleName, isAdmin, permissions } = useAuth();
  const dashboardRole = deriveDashboardRole({ roleName, isAdmin, permissions });
  const { toastSuccess, toastError } = useToast();

  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "review" | "draft">("all");

  useEffect(() => {
    const load = async () => {
      try {
        let data: any[];
        if (dashboardRole === "core" || dashboardRole === "admin" || dashboardRole === "finance_head") {
          data = await getCollection("articles");
        } else {
          data = await getPublishedArticlesAction();
        }
        setArticles(data);
      } catch (err) {
        console.error("[DashboardEducation] Load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dashboardRole]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        search.trim() === "" ||
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        a.authorName?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || a.contentType === typeFilter;

      let matchesStatus = true;
      if (statusFilter === "published") matchesStatus = a.status === "published";
      else if (statusFilter === "review") matchesStatus = a.status === "review";
      else if (statusFilter === "draft") matchesStatus = a.status === "draft";

      return matchesSearch && matchesType && matchesStatus;
    }).sort((a, b) => new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime());
  }, [articles, search, typeFilter, statusFilter]);

  const togglePublish = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      await updateDocument("articles", id, { status: newStatus });
      setArticles((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
      toastSuccess(newStatus === "published" ? "Published" : "Moved to draft");
    } catch {
      toastError("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this article permanently?")) {
      try {
        await deleteDocument("articles", id);
        setArticles((prev) => prev.filter((a) => a.id !== id));
        toastSuccess("Article deleted");
      } catch {
        toastError("Failed to delete article");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published": return { label: "Published", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
      case "review": return { label: "In Review", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
      case "draft": return { label: "Draft", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
      default: return { label: status || "Unknown", color: "#64748b", bg: "rgba(100,116,139,0.12)" };
    }
  };

  const typeLabels: Record<string, string> = { article: "Article", guide: "Guide", fact: "Fact" };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Articles & Facts</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.3rem 0 0" }}>
            {filtered.length} item{filtered.length !== 1 ? "s" : ""} · <Link href="/education" style={{ color: "var(--gold)", textDecoration: "none" }}>View Public Page →</Link>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="dash-filter-bar">
        <input
          type="text" placeholder="Search by title or author..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="dash-filter-input" style={{ flex: "1 1 200px" }}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="dash-filter-input">
          <option value="all">All Types</option>
          <option value="article">Articles</option>
          <option value="guide">Guides</option>
          <option value="fact">Facts</option>
        </select>
        {dashboardRole !== "member" && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="dash-filter-input">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="review">In Review</option>
            <option value="draft">Draft</option>
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="dash-stagger">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton skeleton-bar skeleton-bar-md" style={{ marginBottom: "6px" }} />
              <div className="skeleton skeleton-bar skeleton-bar-sm" />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "rgba(15,22,40,0.35)", border: "1px solid var(--border-subtle)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "2.5fr 0.8fr 1fr 0.8fr 1fr", gap: "1rem", padding: "0.8rem 1.2rem",
            borderBottom: "1px solid var(--border-subtle)", fontSize: "0.7rem", textTransform: "uppercase",
            letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 600
          }}>
            <span>Article</span>
            <span>Type</span>
            <span>Author</span>
            <span>Status</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-title">No articles found</div>
              <div className="empty-state-desc">Try adjusting your filters or search terms.</div>
            </div>
          ) : (
            <div className="dash-stagger">
              {filtered.map((article) => {
                const badge = getStatusBadge(article.status);
                return (
                  <div key={article.id} className="dash-row" style={{
                    display: "grid", gridTemplateColumns: "2.5fr 0.8fr 1fr 0.8fr 1fr", gap: "1rem", padding: "0.9rem 1.2rem",
                    borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center"
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>{article.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {article.knowledgeCategory || "General"} · {formatDateStable(article.publishedAt || article.createdAt)}
                        {article.isFeatured && <span style={{ color: "var(--gold)", marginLeft: "0.4rem" }}>★ Featured</span>}
                      </div>
                    </div>

                    <span style={{
                      fontSize: "0.72rem", padding: "0.25rem 0.6rem", borderRadius: "12px",
                      background: "rgba(201,168,76,0.08)", color: "var(--gold-light)", fontWeight: 600,
                      textTransform: "capitalize"
                    }}>
                      {typeLabels[article.contentType] || article.contentType}
                    </span>

                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {article.authorName || "Unknown"}
                    </span>

                    <span style={{
                      fontSize: "0.72rem", padding: "0.25rem 0.6rem", borderRadius: "12px",
                      background: badge.bg, color: badge.color, fontWeight: 600, display: "inline-block"
                    }}>
                      {badge.label}
                    </span>

                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <Link href={`/education/${article.slug || article.id}`} className="btn-ghost">View</Link>
                      {(dashboardRole === "core" || dashboardRole === "admin" || dashboardRole === "finance_head") && (
                        <button onClick={() => togglePublish(article.id, article.status)} className="btn-action">
                          {article.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                      )}
                      {dashboardRole === "admin" && (
                        <button onClick={() => handleDelete(article.id)} className="btn-danger">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
