"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { deriveDashboardRole } from "@/lib/module-access";
import { formatDateStable } from "@/lib/format-date";
import { getPublishedObservationsAction } from "@/app/actions/observations-engine";
import { getCollection, updateDocument } from "@/lib/db";
import { useToast } from "@/components/ToastProvider";

export default function DashboardObservationsPage() {
  const { user, roleName, isAdmin, permissions } = useAuth();
  const dashboardRole = deriveDashboardRole({ roleName, isAdmin, permissions });
  const { toastSuccess, toastError } = useToast();

  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "approved" | "pending">("all");

  useEffect(() => {
    const load = async () => {
      try {
        // Core/Admin see all observations, Members see published only
        let data: any[];
        if (dashboardRole === "core" || dashboardRole === "admin" || dashboardRole === "finance_head") {
          data = await getCollection("observations");
        } else {
          data = await getPublishedObservationsAction();
        }
        setObservations(data);
      } catch (err) {
        console.error("[DashboardObservations] Load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dashboardRole]);

  const filtered = useMemo(() => {
    return observations.filter((o) => {
      const matchesSearch =
        search.trim() === "" ||
        o.title?.toLowerCase().includes(search.toLowerCase()) ||
        o.celestialTarget?.toLowerCase().includes(search.toLowerCase()) ||
        o.observerName?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || o.category === categoryFilter;

      let matchesApproval = true;
      if (approvalFilter === "approved") matchesApproval = o.isApproved !== false;
      if (approvalFilter === "pending") matchesApproval = o.isApproved === false;

      return matchesSearch && matchesCategory && matchesApproval;
    }).sort((a, b) => new Date(b.capturedAt || b.date || 0).getTime() - new Date(a.capturedAt || a.date || 0).getTime());
  }, [observations, search, categoryFilter, approvalFilter]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    observations.forEach((o) => { if (o.category) cats.add(o.category); });
    return Array.from(cats).sort();
  }, [observations]);

  const toggleApproval = async (id: string, current: boolean) => {
    try {
      await updateDocument("observations", id, { isApproved: !current });
      setObservations((prev) => prev.map((o) => o.id === id ? { ...o, isApproved: !current } : o));
      toastSuccess(current ? "Unapproved" : "Approved");
    } catch {
      toastError("Failed to update status");
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await updateDocument("observations", id, { isFeatured: !current });
      setObservations((prev) => prev.map((o) => o.id === id ? { ...o, isFeatured: !current } : o));
      toastSuccess(current ? "Unfeatured" : "Featured");
    } catch {
      toastError("Failed to update status");
    }
  };

  const categoryFormats: Record<string, { label: string; color: string; icon: string }> = {
    Lunar: { label: "Lunar", color: "#f1f5f9", icon: "🌙" },
    Planetary: { label: "Planetary", color: "#fb923c", icon: "🪐" },
    "Deep Sky": { label: "Deep Sky", color: "#818cf8", icon: "🌌" },
    Solar: { label: "Solar", color: "#facc15", icon: "☀️" },
    "Widefield / Milky Way": { label: "Widefield", color: "#c084fc", icon: "✨" },
  };

  const getCat = (cat: string) => categoryFormats[cat] || { label: cat, color: "#fff", icon: "🔭" };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Observations</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.3rem 0 0" }}>
            {filtered.length} observation{filtered.length !== 1 ? "s" : ""} · <Link href="/observations" style={{ color: "var(--gold)", textDecoration: "none" }}>View Public Page →</Link>
          </p>
        </div>
        <Link href="/portal/observations" style={{
          padding: "0.6rem 1rem", borderRadius: "8px", background: "var(--gold)", color: "#0c1222",
          textDecoration: "none", fontSize: "0.85rem", fontWeight: 600
        }}>
          + Submit Observation
        </Link>
      </div>

      {/* Filters */}
      <div className="dash-filter-bar">
        <input
          type="text" placeholder="Search by title, target, observer..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="dash-filter-input" style={{ flex: "1 1 200px" }}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="dash-filter-input">
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{getCat(c).icon} {getCat(c).label}</option>)}
        </select>
        {(dashboardRole !== "member") && (
          <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value as any)} className="dash-filter-input">
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="dash-stagger">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-row">
              <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "6px" }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-bar skeleton-bar-md" style={{ marginBottom: "6px" }} />
                  <div className="skeleton skeleton-bar skeleton-bar-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "rgba(15,22,40,0.35)", border: "1px solid var(--border-subtle)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 0.8fr 1fr", gap: "1rem", padding: "0.8rem 1.2rem",
            borderBottom: "1px solid var(--border-subtle)", fontSize: "0.7rem", textTransform: "uppercase",
            letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 600
          }}>
            <span>Observation</span>
            <span>Category</span>
            <span>Date</span>
            <span>Status</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔭</div>
              <div className="empty-state-title">No observations found</div>
              <div className="empty-state-desc">Try adjusting your filters or search terms.</div>
            </div>
          ) : (
            <div className="dash-stagger">
              {filtered.map((obs) => {
                const cat = getCat(obs.category);
                const isApproved = obs.isApproved !== false;
                return (
                  <div key={obs.id} className="dash-row" style={{
                    display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 0.8fr 1fr", gap: "1rem", padding: "0.9rem 1.2rem",
                    borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center"
                  }}>
                    <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                      {(obs.imageThumbnailUrl || obs.imageOriginalUrl || obs.imageCompressedUrl) ? (
                        <img
                          src={obs.imageThumbnailUrl || obs.imageCompressedUrl || obs.imageOriginalUrl}
                          alt=""
                          loading="lazy"
                          style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                          className="dash-fade-in"
                        />
                      ) : (
                        <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                          🌌
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>{obs.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          by {obs.observerName || obs.observerId?.slice(0, 8) || "Unknown"}
                          {obs.isFeatured && <span style={{ color: "var(--gold)", marginLeft: "0.4rem" }}>★ Featured</span>}
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: "0.78rem", color: cat.color }}>{cat.icon} {cat.label}</span>

                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {formatDateStable(obs.capturedAt || obs.date)}
                    </span>

                    <span style={{
                      fontSize: "0.72rem", padding: "0.25rem 0.6rem", borderRadius: "12px",
                      background: isApproved ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                      color: isApproved ? "#22c55e" : "#f59e0b", fontWeight: 600, display: "inline-block"
                    }}>
                      {isApproved ? "Approved" : "Pending"}
                    </span>

                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <Link href={`/observations/${obs.id}`} className="btn-ghost">View</Link>
                      {(dashboardRole === "core" || dashboardRole === "admin" || dashboardRole === "finance_head") && (
                        <>
                          <button onClick={() => toggleApproval(obs.id, isApproved)} className="btn-action">
                            {isApproved ? "Reject" : "Approve"}
                          </button>
                          <button onClick={() => toggleFeatured(obs.id, !!obs.isFeatured)} className="btn-action" style={{ background: obs.isFeatured ? "rgba(201,168,76,0.15)" : undefined }}>
                            ★
                          </button>
                        </>
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
