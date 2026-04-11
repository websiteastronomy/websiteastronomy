"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToCollection } from "@/lib/db";

export default function DashboardProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const unsub = subscribeToCollection("projects", (data) => {
      setProjects(data);
    });
    return () => unsub();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (!proj.isPublished) return false;
      const matchesSearch = proj.title?.toLowerCase().includes(searchQuery.toLowerCase()) || proj.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || proj.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ongoing": return "#22c55e";
      case "Completed": return "#3b82f6";
      case "Planned": return "#a855f7";
      default: return "var(--gold)";
    }
  };

  return (
    <div style={{ maxWidth: "960px" }}>
      <h1 style={{ fontSize: "1.4rem", fontFamily: "'Cinzel', serif", marginBottom: "0.4rem" }}>
        <span className="gradient-text">Projects</span>
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Browse and access club projects.
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ flex: "1 1 250px" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
          style={{ flex: "0 1 160px" }}
        >
          <option value="All">All Statuses</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Planned">Planned</option>
        </select>
      </div>

      {/* Project list */}
      <div style={{ display: "grid", gap: "0.85rem" }}>
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((proj) => (
            <motion.div
              key={proj.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                padding: "1rem 1.2rem",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
                background: "rgba(12,18,34,0.55)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                  <strong style={{ fontSize: "0.92rem" }}>{proj.title}</strong>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                    color: getStatusColor(proj.status),
                    background: getStatusColor(proj.status) + "22",
                    padding: "0.15rem 0.5rem", borderRadius: "20px",
                  }}>{proj.status}</span>
                  {proj.isFeatured && <span style={{ fontSize: "0.6rem", background: "var(--gold)", color: "#000", padding: "0.1rem 0.4rem", borderRadius: "20px", fontWeight: 700 }}>Featured</span>}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {proj.description}
                </p>
                <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                  {(proj.tags || []).slice(0, 4).map((tag: string) => (
                    <span key={tag} style={{ fontSize: "0.68rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>{tag}</span>
                  ))}
                </div>
              </div>
              <Link href={`/projects/${proj.id}`} className="btn-secondary" style={{ padding: "0.45rem 0.9rem", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                Open →
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredProjects.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No projects found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
