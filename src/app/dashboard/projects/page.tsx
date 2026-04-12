"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { subscribeToCollection, updateDocument, deleteDocument } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { deriveDashboardRole } from "@/lib/module-access";
import { useToast } from "@/components/ToastProvider";

export default function DashboardProjectsPage() {
  const { user, roleName, isAdmin, permissions } = useAuth();
  const dashboardRole = deriveDashboardRole({ roleName, isAdmin, permissions });
  const { toastSuccess, toastError } = useToast();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");

  useEffect(() => {
    const unsub = subscribeToCollection("projects", (data) => {
      setProjects(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((p) => (p.tags || []).forEach((t: string) => tags.add(t)));
    return ["All", ...Array.from(tags).sort()];
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((proj) => {
      // Members only see published
      if (dashboardRole === "member" && !proj.isPublished) return false;

      const matchesSearch =
        search.trim() === "" ||
        proj.title?.toLowerCase().includes(search.toLowerCase()) ||
        proj.description?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "All" || proj.status === statusFilter;
      const matchesTag = tagFilter === "All" || (proj.tags || []).includes(tagFilter);

      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [projects, search, statusFilter, tagFilter, dashboardRole]);

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await updateDocument("projects", id, { isPublished: !current });
      toastSuccess(current ? "Unpublished" : "Published");
    } catch {
      toastError("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project permanently?")) {
      try {
        await deleteDocument("projects", id);
        toastSuccess("Project deleted");
      } catch {
        toastError("Failed to delete project");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ongoing": return { color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
      case "Completed": return { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
      case "Planned": return { color: "#a855f7", bg: "rgba(168,85,247,0.12)" };
      default: return { color: "var(--gold)", bg: "rgba(201,168,76,0.12)" };
    }
  };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Projects</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.3rem 0 0" }}>
            {filtered.length} project{filtered.length !== 1 ? "s" : ""} · <Link href="/projects" style={{ color: "var(--gold)", textDecoration: "none" }}>View Public Page →</Link>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="dash-filter-bar">
        <input
          type="text" placeholder="Search projects..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="dash-filter-input" style={{ flex: "1 1 200px" }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dash-filter-input">
          <option value="All">All Status</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Planned">Planned</option>
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="dash-filter-input">
          {allTags.map((t) => <option key={t} value={t}>{t === "All" ? "All Tags" : t}</option>)}
        </select>
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
            display: "grid", gridTemplateColumns: "2fr 0.8fr 1fr 0.8fr 0.7fr 1fr", gap: "0.8rem", padding: "0.8rem 1.2rem",
            borderBottom: "1px solid var(--border-subtle)", fontSize: "0.7rem", textTransform: "uppercase",
            letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 600
          }}>
            <span>Project</span>
            <span>Status</span>
            <span>Progress</span>
            <span>Team</span>
            <span>Published</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚀</div>
              <div className="empty-state-title">No projects found</div>
              <div className="empty-state-desc">Try adjusting your filters or search terms.</div>
            </div>
          ) : (
            <div className="dash-stagger">
              {filtered.map((proj) => {
                const statusStyle = getStatusColor(proj.status);
                return (
                  <div key={proj.id} className="dash-row" style={{
                    display: "grid", gridTemplateColumns: "2fr 0.8fr 1fr 0.8fr 0.7fr 1fr", gap: "0.8rem", padding: "0.9rem 1.2rem",
                    borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center"
                  }}>
                    {/* Title + tags */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>{proj.title}</div>
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", overflow: "hidden" }}>
                        {(proj.tags || []).slice(0, 3).map((tag: string) => (
                          <span key={tag} style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", border: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <span style={{
                      fontSize: "0.72rem", padding: "0.25rem 0.5rem", borderRadius: "12px",
                      background: statusStyle.bg, color: statusStyle.color, fontWeight: 600, display: "inline-block"
                    }}>
                      {proj.status}
                    </span>

                    {/* Progress Bar */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{proj.progress || 0}%</span>
                      </div>
                      <div style={{ width: "100%", height: "5px", background: "var(--border-subtle)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${proj.progress || 0}%`, height: "100%", background: "linear-gradient(90deg, var(--gold-dark), var(--gold-light))", borderRadius: "3px", transition: "width 0.5s ease" }} />
                      </div>
                    </div>

                    {/* Team */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <div style={{ display: "flex" }}>
                        {(proj.team || []).slice(0, 3).map((member: any, idx: number) => (
                          <div key={idx} style={{
                            width: "22px", height: "22px", borderRadius: "50%", background: "var(--gold-dark)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem",
                            color: "#000", fontWeight: "bold", border: "1px solid #141e3c", marginLeft: idx > 0 ? "-6px" : "0"
                          }}>
                            {member.name?.charAt(0) || "?"}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{(proj.team || []).length}</span>
                    </div>

                    {/* Published */}
                    <span style={{
                      fontSize: "0.72rem", padding: "0.25rem 0.5rem", borderRadius: "12px",
                      background: proj.isPublished ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                      color: proj.isPublished ? "#22c55e" : "#f59e0b", fontWeight: 600, display: "inline-block"
                    }}>
                      {proj.isPublished ? "Yes" : "No"}
                    </span>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <Link href={`/projects/${proj.id}`} className="btn-ghost">View</Link>
                      {(dashboardRole === "core" || dashboardRole === "admin" || dashboardRole === "finance_head") && (
                        <button onClick={() => togglePublish(proj.id, proj.isPublished)} className="btn-action">
                          {proj.isPublished ? "Unpublish" : "Publish"}
                        </button>
                      )}
                      {dashboardRole === "admin" && (
                        <button onClick={() => handleDelete(proj.id)} className="btn-danger">
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
