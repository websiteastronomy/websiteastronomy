"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Notification = { id: string; type: string; title: string; message: string; isRead: boolean; link: string | null; createdAt: string };
type MyProject = { id: string; name: string; status: string; role: string; progress: number };

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [myProjects, setMyProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [
        { getMyNotificationsAction, getMyProjectsAction },
      ] = await Promise.all([
        import("@/app/actions/notifications"),
      ]);
      const [notifs, projects] = await Promise.all([
        getMyNotificationsAction(),
        getMyProjectsAction(),
      ]);
      setNotifications(notifs as Notification[]);
      setMyProjects(projects as MyProject[]);
    } catch (e) {
      console.error("[DashboardOverview] load error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const activeProjects = myProjects.filter((p) => p.status === "Ongoing");
  const completedProjects = myProjects.filter((p) => p.status === "Completed");

  return (
    <div style={{ maxWidth: "900px" }}>
      <h1 style={{ fontSize: "1.6rem", fontFamily: "'Cinzel', serif", marginBottom: "0.4rem" }}>
        <span className="gradient-text">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</span>
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        Here&apos;s a snapshot of your club activity.
      </p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "My Projects", value: String(myProjects.length), icon: "🚀" },
          { label: "Active", value: String(activeProjects.length), icon: "⚡" },
          { label: "Completed", value: String(completedProjects.length), icon: "✅" },
          { label: "Unread Notifications", value: String(unreadCount), icon: "🔔" },
        ].map((card) => (
          <div key={card.label} style={{ padding: "1.1rem", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>{card.icon}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{card.label}</span>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)" }}>{loading ? "—" : card.value}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        {/* My Projects */}
        <div style={{ padding: "1.2rem", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", margin: 0 }}>My Projects</h2>
            <Link href="/dashboard/projects" style={{ color: "var(--gold)", fontSize: "0.78rem" }}>View all →</Link>
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {loading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading...</div>
            ) : myProjects.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No projects assigned yet.</div>
            ) : (
              myProjects.slice(0, 5).map((project) => (
                <div key={project.id} style={{ padding: "0.8rem", borderRadius: "10px", background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <strong style={{ fontSize: "0.85rem" }}>{project.name}</strong>
                    <span style={{ fontSize: "0.7rem", color: project.status === "Ongoing" ? "#22c55e" : project.status === "Completed" ? "#3b82f6" : "var(--text-muted)", fontWeight: 600 }}>{project.status}</span>
                  </div>
                  <div style={{ marginTop: "0.5rem", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${project.progress}%`, background: "linear-gradient(90deg, var(--gold-dark), var(--gold))", borderRadius: "2px", transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{project.role}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--gold-light)" }}>{project.progress}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div style={{ padding: "1.2rem", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", margin: 0 }}>Recent Notifications</h2>
            <Link href="/dashboard/notifications" style={{ color: "var(--gold)", fontSize: "0.78rem" }}>View all →</Link>
          </div>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {loading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No notifications yet.</div>
            ) : (
              notifications.slice(0, 6).map((notif) => (
                <div key={notif.id} style={{ padding: "0.7rem 0.8rem", borderRadius: "8px", background: notif.isRead ? "transparent" : "rgba(201,168,76,0.04)", border: notif.isRead ? "1px solid transparent" : "1px solid rgba(201,168,76,0.12)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: notif.isRead ? 400 : 600, color: "var(--text-primary)" }}>{notif.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{notif.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick navigation */}
      <div style={{ marginTop: "1.5rem", padding: "1.2rem", borderRadius: "14px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Quick Actions</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {[
            { label: "Documentation", href: "/dashboard/documentation", icon: "📚" },
            { label: "Finance", href: "/dashboard/finance", icon: "💰" },
            { label: "Activity Log", href: "/dashboard/activity", icon: "🧾" },
            { label: "Member Portal", href: "/portal", icon: "🏠" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.6rem 1rem", borderRadius: "8px",
                border: "1px solid var(--border-subtle)", background: "rgba(15,22,40,0.35)",
                color: "var(--text-secondary)", fontSize: "0.82rem", textDecoration: "none",
                transition: "border-color 0.2s",
              }}
            >
              <span>{action.icon}</span> {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
