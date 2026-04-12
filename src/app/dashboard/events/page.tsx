"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { subscribeToCollection, updateDocument, deleteDocument } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { deriveDashboardRole } from "@/lib/module-access";
import { formatDateStable } from "@/lib/format-date";
import { useToast } from "@/components/ToastProvider";
import { SectionHeader, TableContainer, EmptyState, StatusBadge } from "@/components/ui";

export default function DashboardEventsPage() {
  const { user, roleName, isAdmin, permissions } = useAuth();
  const dashboardRole = deriveDashboardRole({ roleName, isAdmin, permissions });

  const { toastSuccess, toastError } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "past" | "draft">("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const unsub = subscribeToCollection("events", (data) => {
      setEvents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const now = new Date();

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Members only see published, Core/Admin see all
      if (dashboardRole === "member" && !e.isPublished) return false;

      const matchesSearch =
        search.trim() === "" ||
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.location?.toLowerCase().includes(search.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "upcoming") {
        matchesStatus = e.isPublished && new Date(e.date) >= now && e.status !== "completed";
      } else if (statusFilter === "past") {
        matchesStatus = e.status === "completed" || new Date(e.date) < now;
      } else if (statusFilter === "draft") {
        matchesStatus = !e.isPublished;
      }

      const matchesType = typeFilter === "all" || e.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, search, statusFilter, typeFilter, dashboardRole, now]);

  const allTypes = useMemo(() => {
    const types = new Set<string>();
    events.forEach((e) => { if (e.type) types.add(e.type); });
    return Array.from(types).sort();
  }, [events]);

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await updateDocument("events", id, { isPublished: !current });
      toastSuccess(current ? "Event unpublished" : "Event published");
    } catch {
      toastError("Failed to update event");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this event permanently?")) {
      try {
        await deleteDocument("events", id);
        toastSuccess("Event deleted");
      } catch {
        toastError("Failed to delete event");
      }
    }
  };

  const getStatusBadge = (event: any) => {
    if (!event.isPublished) return { label: "Draft", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    if (event.status === "completed" || new Date(event.date) < now)
      return { label: "Past", color: "#64748b", bg: "rgba(100,116,139,0.12)" };
    return { label: "Upcoming", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <SectionHeader
        title="Events"
        subtitle={`${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""}`}
        action={<Link href="/events" style={{ color: "var(--gold)", textDecoration: "none", fontSize: "0.85rem" }}>View Public Page →</Link>}
      />

      {/* Filters */}
      <div className="dash-filter-bar">
        <input
          type="text" placeholder="Search events..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="dash-filter-input" style={{ flex: "1 1 200px" }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="dash-filter-input">
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          {dashboardRole !== "member" && <option value="draft">Draft</option>}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="dash-filter-input">
          <option value="all">All Types</option>
          {allTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <TableContainer>
        {/* Table Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr 1fr", gap: "1rem", padding: "0.8rem 1.2rem",
          borderBottom: "1px solid var(--border-subtle)", fontSize: "0.7rem", textTransform: "uppercase",
          letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 600
        }}>
          <span>Event</span>
          <span>Date</span>
          <span>Type</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>
        {loading ? (
          <div className="dash-stagger">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-row">
                <div className="skeleton skeleton-bar skeleton-bar-lg" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState icon="🗓️" title="No events found" description="Try adjusting your filters or search terms." />
        ) : (
          <div className="dash-stagger">
            {filteredEvents.map((event) => {
              const badge = getStatusBadge(event);
              return (
                <div key={event.id} className="dash-row" style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr 1fr", gap: "1rem", padding: "1rem 1.2rem",
                  borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center",
                }}>
                  {/* Title + Location */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem", color: "var(--text-primary)" }}>{event.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{event.location}</div>
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {formatDateStable(event.date)}
                  </div>

                  {/* Type */}
                  <div>
                    <span style={{
                      fontSize: "0.72rem", padding: "0.25rem 0.6rem", borderRadius: "12px",
                      background: "rgba(201,168,76,0.1)", color: "var(--gold-light)", fontWeight: 600
                    }}>
                      {event.type}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge label={badge.label} color={badge.color} bg={badge.bg} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <Link href={`/events/${event.id}`} className="btn-ghost">View</Link>
                    {(dashboardRole === "core" || dashboardRole === "admin" || dashboardRole === "finance_head") && (
                      <button onClick={() => togglePublish(event.id, event.isPublished)} className="btn-action">
                        {event.isPublished ? "Unpublish" : "Publish"}
                      </button>
                    )}
                    {dashboardRole === "admin" && (
                      <button onClick={() => handleDelete(event.id)} className="btn-danger">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TableContainer>
    </div>
  );
}
