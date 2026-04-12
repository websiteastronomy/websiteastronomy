"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { subscribeToCollection, updateDocument, deleteDocument } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { deriveDashboardRole } from "@/lib/module-access";
import { formatDateStable } from "@/lib/format-date";
import { useToast } from "@/components/ToastProvider";

export default function DashboardOutreachPage() {
  const { user, roleName, isAdmin, permissions } = useAuth();
  const dashboardRole = deriveDashboardRole({ roleName, isAdmin, permissions });

  const { toastSuccess, toastError } = useToast();

  const [outreachData, setOutreachData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "approved" | "pending">("all");

  useEffect(() => {
    const unsub = subscribeToCollection("outreach", (data) => {
      setOutreachData(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return outreachData.filter((o) => {
      // Members only see approved entries
      if (dashboardRole === "member" && !o.isApproved) return false;

      const matchesSearch =
        search.trim() === "" ||
        o.title?.toLowerCase().includes(search.toLowerCase()) ||
        o.location?.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || o.type === typeFilter;

      let matchesApproval = true;
      if (approvalFilter === "approved") matchesApproval = o.isApproved;
      if (approvalFilter === "pending") matchesApproval = !o.isApproved;

      return matchesSearch && matchesType && matchesApproval;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [outreachData, search, typeFilter, approvalFilter, dashboardRole]);

  const totalImpacted = useMemo(() => {
    return outreachData.filter((o) => o.isApproved).reduce((sum, item) => sum + (item.stats?.peopleReached || 0), 0);
  }, [outreachData]);

  const toggleApproval = async (id: string, current: boolean) => {
    try {
      await updateDocument("outreach", id, { isApproved: !current });
      toastSuccess(current ? "Approval revoked" : "Approved");
    } catch {
      toastError("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this outreach entry permanently?")) {
      try {
        await deleteDocument("outreach", id);
        toastSuccess("Entry deleted");
      } catch {
        toastError("Failed to delete entry");
      }
    }
  };

  const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
    school: { label: "School Visit", color: "#60a5fa", icon: "🎒" },
    public: { label: "Public Event", color: "#fb923c", icon: "🔭" },
    workshop: { label: "Workshop", color: "#a78bfa", icon: "🛠️" },
    ngo: { label: "NGO / Orphanage", color: "#34d399", icon: "🤝" },
  };

  const getType = (type: string) => typeConfig[type] || { label: type || "Initiative", color: "#fff", icon: "✨" };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header + Impact */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Outreach</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.3rem 0 0" }}>
            {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"} · <Link href="/outreach" style={{ color: "var(--gold)", textDecoration: "none" }}>View Public Page →</Link>
          </p>
        </div>
        <div style={{
          background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "10px",
          padding: "0.6rem 1.2rem", textAlign: "center"
        }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold-light)", marginBottom: "0.2rem" }}>Total Impact</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--gold)", fontFamily: "'Cinzel', serif" }}>{new Intl.NumberFormat("en-US").format(totalImpacted)}+</div>
        </div>
      </div>

      {/* Filters */}
      <div className="dash-filter-bar">
        <input
          type="text" placeholder="Search outreach..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="dash-filter-input" style={{ flex: "1 1 200px" }}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="dash-filter-input">
          <option value="all">All Types</option>
          {Object.entries(typeConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.icon} {config.label}</option>
          ))}
        </select>
        {dashboardRole !== "member" && (
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
              <div className="skeleton skeleton-bar skeleton-bar-md" style={{ marginBottom: "6px" }} />
              <div className="skeleton skeleton-bar skeleton-bar-sm" />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "rgba(15,22,40,0.35)", border: "1px solid var(--border-subtle)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.7fr 1fr", gap: "0.8rem", padding: "0.8rem 1.2rem",
            borderBottom: "1px solid var(--border-subtle)", fontSize: "0.7rem", textTransform: "uppercase",
            letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 600
          }}>
            <span>Initiative</span>
            <span>Type</span>
            <span>Date</span>
            <span>Reached</span>
            <span>Status</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌍</div>
              <div className="empty-state-title">No outreach entries found</div>
              <div className="empty-state-desc">Try adjusting your filters or search terms.</div>
            </div>
          ) : (
            <div className="dash-stagger">
              {filtered.map((item) => {
                const typeData = getType(item.type);
                return (
                  <div key={item.id} className="dash-row" style={{
                    display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.7fr 1fr", gap: "0.8rem", padding: "0.9rem 1.2rem",
                    borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center"
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>{item.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.location}</div>
                    </div>

                    <span style={{ fontSize: "0.78rem", color: typeData.color }}>{typeData.icon} {typeData.label}</span>

                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {formatDateStable(item.date)}
                    </span>

                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {item.stats?.peopleReached || 0}
                    </span>

                    <span style={{
                      fontSize: "0.72rem", padding: "0.25rem 0.5rem", borderRadius: "12px",
                      background: item.isApproved ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                      color: item.isApproved ? "#22c55e" : "#f59e0b", fontWeight: 600, display: "inline-block"
                    }}>
                      {item.isApproved ? "Approved" : "Pending"}
                    </span>

                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <Link href={`/outreach/${item.id}`} className="btn-ghost">View</Link>
                      {(dashboardRole === "core" || dashboardRole === "admin" || dashboardRole === "finance_head") && (
                        <button onClick={() => toggleApproval(item.id, item.isApproved)} className="btn-action">
                          {item.isApproved ? "Revoke" : "Approve"}
                        </button>
                      )}
                      {dashboardRole === "admin" && (
                        <button onClick={() => handleDelete(item.id)} className="btn-danger">
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
