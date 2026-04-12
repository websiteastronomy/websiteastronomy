"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { deriveDashboardRole, getAccessibleDashboardModules, type DashboardRole, type DashboardModuleKey } from "@/lib/module-access";

function SidebarBadge({ label }: { label: string }) {
  return (
    <span
      className="sidebar-badge"
      style={{
        width: "28px",
        minWidth: "28px",
        height: "20px",
        borderRadius: "999px",
        border: "1px solid var(--border-subtle)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.6rem",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </span>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, roleName, permissions, loading, logout } = useAuth();

  const dashboardRole = deriveDashboardRole({ roleName, isAdmin, permissions });
  
  // Custom sidebar config for Unified /app structure
  let sidebarLinks: { label: string; shortLabel: string; href: string }[] = [];

  if (dashboardRole === "admin") {
    sidebarLinks = [
      { label: "Overview", shortLabel: "OV", href: "/app/overview" },
      { label: "Events", shortLabel: "EV", href: "/app/events" },
      { label: "Directory & Approvals", shortLabel: "MB", href: "/app/members" },
      { label: "Articles & Facts", shortLabel: "AR", href: "/app/articles" },
      { label: "Projects", shortLabel: "PR", href: "/app/projects" },
      { label: "Documentation", shortLabel: "DC", href: "/app/documentation" },
      { label: "Observations", shortLabel: "OB", href: "/app/observations" },
      { label: "Quizzes", shortLabel: "QZ", href: "/app/quizzes" },
      { label: "Outreach", shortLabel: "OT", href: "/app/outreach" },
      { label: "Achievements", shortLabel: "AC", href: "/app/achievements" },
      { label: "Night Sky", shortLabel: "NS", href: "/app/night-sky" },
      { label: "Announcements", shortLabel: "AN", href: "/app/announcements" },
      { label: "Finance", shortLabel: "FN", href: "/app/finance" },
      { label: "Activity Logs", shortLabel: "LG", href: "/app/activity-logs" },
      { label: "System Control", shortLabel: "SC", href: "/app/system-control" },
      { label: "Site Settings", shortLabel: "ST", href: "/app/site-settings" },
      { label: "System Storage", shortLabel: "SS", href: "/app/storage" },
    ];
  } else if (dashboardRole === "core") {
    sidebarLinks = [
      { label: "Overview", shortLabel: "OV", href: "/app/overview" },
      { label: "Projects", shortLabel: "PR", href: "/app/projects" },
      { label: "Documentation", shortLabel: "DC", href: "/app/documentation" },
      { label: "Events (Manage)", shortLabel: "EV", href: "/app/events" },
      { label: "Observations (Review)", shortLabel: "OB", href: "/app/observations" },
      { label: "Announcements", shortLabel: "AN", href: "/app/announcements" },
      { label: "Activity", shortLabel: "AC", href: "/app/activity-logs" },
    ];
  } else if (dashboardRole === "finance_head") {
    sidebarLinks = [
      { label: "Overview", shortLabel: "OV", href: "/app/overview" },
      { label: "Finance Workspace", shortLabel: "FN", href: "/app/finance" },
      { label: "Projects", shortLabel: "PR", href: "/app/projects" },
      { label: "Events", shortLabel: "EV", href: "/app/events" },
      { label: "Announcements", shortLabel: "AN", href: "/app/announcements" },
      { label: "Activity Logs", shortLabel: "LG", href: "/app/activity-logs" },
    ];
  } else {
    sidebarLinks = [
      { label: "Overview", shortLabel: "OV", href: "/app/overview" },
      { label: "My Projects", shortLabel: "PR", href: "/app/projects" },
      { label: "Documentation", shortLabel: "DC", href: "/app/documentation" },
      { label: "Forms", shortLabel: "FM", href: "/app/forms" },
      { label: "Activity", shortLabel: "AC", href: "/app/activity-logs" },
    ];
  }

  useEffect(() => {
    if (!loading && !user && pathname.startsWith("/app")) {
      router.replace(`/?login=true&redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "2px solid var(--border-subtle)",
              borderTopColor: "var(--gold)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading workspace...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
      <aside
        style={{
          width: "240px",
          minWidth: "240px",
          background: "rgba(11, 16, 30, 0.95)",
          borderRight: "1px solid var(--border-subtle)",
          padding: "1.5rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          position: "sticky",
          top: "64px",
          height: "calc(100vh - 64px)",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "0 1.25rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--gold-dark), var(--gold))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#0c1222",
                overflow: "hidden",
              }}
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || "Member"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                (user.name || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name || "Member"}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {roleName || user.email}
              </div>
            </div>
          </div>
        </div>

        {sidebarLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link${isActive(item.href) ? " sidebar-link-active" : ""}`}
            style={{
              color: isActive(item.href) ? undefined : "var(--text-secondary)",
              fontWeight: isActive(item.href) ? undefined : 400,
            }}
          >
            <SidebarBadge label={item.shortLabel} />
            {item.label}
          </Link>
        ))}

        <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
          <Link
            href="/app/settings"
            className={`sidebar-link${isActive("/app/settings") ? " sidebar-link-active" : ""}`}
            style={{
              color: isActive("/app/settings") ? undefined : "var(--text-secondary)",
              fontWeight: isActive("/app/settings") ? undefined : 400,
            }}
          >
            <SidebarBadge label="PF" />
            Profile & Settings
          </Link>
        </div>

        <div style={{ marginTop: "auto", padding: "1rem 1.25rem", borderTop: "1px solid var(--border-subtle)" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.6rem 0",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            Back to Public Site
          </Link>
          <button
            onClick={() => void logout()}
            style={{
              width: "100%",
              marginTop: "0.5rem",
              padding: "0.6rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "8px",
              color: "#fca5a5",
              fontSize: "0.8rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="dash-fade-in" style={{ flex: 1, padding: "2rem", minWidth: 0, overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
