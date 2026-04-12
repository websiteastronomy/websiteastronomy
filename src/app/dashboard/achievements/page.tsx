"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCollection, addDocument, deleteDocument } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { deriveDashboardRole } from "@/lib/module-access";
import { useToast } from "@/components/ToastProvider";

export default function DashboardAchievementsPage() {
  const { roleName, isAdmin, permissions } = useAuth();
  const dashboardRole = deriveDashboardRole({ roleName, isAdmin, permissions });
  const { toastSuccess, toastError } = useToast();

  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", year: "", imageUrl: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const data = await getCollection("achievements");
      setAchievements(data);
    } catch (err) {
      console.error("[DashboardAchievements] Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    if (!formData.title.trim() || !formData.year.trim()) {
      toastError("Title and year are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDocument("achievements", {
        title: formData.title,
        description: formData.description,
        year: formData.year,
        imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1446776858070-70c3d5ed6758?w=800&q=80",
      });
      setFormData({ title: "", description: "", year: "", imageUrl: "" });
      setShowAddForm(false);
      toastSuccess("Achievement added");
      await loadData();
    } catch (err) {
      toastError("Failed to add achievement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this achievement permanently?")) {
      try {
        await deleteDocument("achievements", id);
        setAchievements((prev) => prev.filter((a) => a.id !== id));
        toastSuccess("Achievement deleted");
      } catch {
        toastError("Failed to delete achievement");
      }
    }
  };

  const inputStyle = {
    padding: "0.7rem 0.9rem",
    background: "rgba(15,22,40,0.5)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
    fontFamily: "inherit",
    width: "100%",
  };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Achievements</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.3rem 0 0" }}>
            {achievements.length} achievement{achievements.length !== 1 ? "s" : ""} · <Link href="/about" style={{ color: "var(--gold)", textDecoration: "none" }}>View Public Page →</Link>
          </p>
        </div>
        {dashboardRole === "admin" && (
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
            {showAddForm ? "Cancel" : "+ Add Achievement"}
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && dashboardRole === "admin" && (
        <div style={{
          padding: "1.5rem", marginBottom: "1.5rem", background: "rgba(15,22,40,0.4)",
          border: "1px solid var(--gold-dark)", borderRadius: "12px", display: "grid", gap: "0.8rem"
        }}>
          <h3 style={{ fontSize: "1rem", margin: 0, color: "var(--gold)" }}>New Achievement</h3>
          <input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <input placeholder="Year (e.g. 2026)" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} style={inputStyle} />
            <input placeholder="Image URL (optional)" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} style={inputStyle} />
          </div>
          <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} className="dash-filter-input" />
          <button disabled={isSubmitting} onClick={handleAdd} className="btn-primary" style={{ border: "none" }}>
            {isSubmitting ? (
              <><span className="spinner-inline" style={{ marginRight: "8px" }} /> Saving...</>
            ) : "Save Achievement"}
          </button>
        </div>
      )}

      {/* Achievement Cards */}
      {loading ? (
        <div className="dash-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "300px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)" }} />
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <div className="empty-state-title">No achievements</div>
          <div className="empty-state-desc">The club's achievements will appear here.</div>
        </div>
      ) : (
        <div className="dash-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {achievements.map((ach) => (
            <div key={ach.id} className="dash-card" style={{
              background: "rgba(15,22,40,0.4)",
              borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column",
            }}>
              {ach.imageUrl && (
                <div style={{ width: "100%", height: "160px", position: "relative" }}>
                  <img src={ach.imageUrl} alt={ach.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} className="dash-fade-in" />
                  <div style={{
                    position: "absolute", top: "0.8rem", right: "0.8rem", background: "var(--gold)", color: "#0c1222",
                    padding: "0.2rem 0.6rem", borderRadius: "16px", fontSize: "0.75rem", fontWeight: 700
                  }}>
                    {ach.year}
                  </div>
                </div>
              )}
              <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", lineHeight: 1.3, color: "var(--text-primary)" }}>{ach.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, flex: 1 }}>
                  {ach.description}
                </p>
                {dashboardRole === "admin" && (
                  <div style={{ marginTop: "1rem", paddingTop: "0.8rem", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleDelete(ach.id)} className="btn-danger">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
