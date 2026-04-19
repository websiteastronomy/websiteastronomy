"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  canAccessAdmin,
  getAdminRouteIdFromPathname,
  getVisibleAdminNavItems,
} from "@/app/admin/admin-config";

const GlobalSearch = dynamic(() => import("./components/GlobalSearch"));

const inputStyle: CSSProperties = {
  padding: "0.7rem 1rem",
  background: "rgba(15, 22, 40, 0.5)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "6px",
  color: "var(--text-primary)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  width: "100%",
};

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const {
    user,
    isAdmin,
    roleName,
    loading,
    authError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    hasPermission,
  } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isSidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  if (pathname.startsWith("/admin/forms/")) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--gold)" }}>Verifying credentials...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column", padding: "1rem" }}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ background: "rgba(12, 18, 34, 0.6)", padding: "3rem", borderRadius: "16px", border: "1px solid rgba(239, 68, 68, 0.3)", textAlign: "center", maxWidth: "420px", width: "100%" }}
        >
          <div style={{ color: "#ef4444", fontSize: "3rem", marginBottom: "1rem" }}>Locked</div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Restricted Area</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.6 }}>
            You must be authenticated to access the administrative control panel.
          </p>

          {authError ? (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.8rem", borderRadius: "8px", color: "#ef4444", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Warning: {authError}
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "1.5rem" }}>
            {authMode === "signup" ? (
              <input type="text" placeholder="Full Name" value={name} onChange={(event) => setName(event.target.value)} style={inputStyle} />
            ) : null}
            <input type="email" placeholder="Email Address" value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} />
          </div>

          <button onClick={() => (authMode === "login" ? signInWithEmail(email, password) : signUpWithEmail(email, password, name))} className="btn-primary" style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", cursor: "pointer", fontFamily: "inherit", marginBottom: "1rem" }}>
            {authMode === "login" ? "Login with Email" : "Create Admin Account"}
          </button>

          <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline", marginBottom: "1.5rem", display: "block", marginInline: "auto" }}>
            {authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>

          <div style={{ position: "relative", margin: "1.5rem 0", textAlign: "center" }}>
            <hr style={{ border: 0, borderTop: "1px solid var(--border-subtle)" }} />
            <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgb(12, 18, 34)", padding: "0 1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              OR
            </span>
          </div>

          <button onClick={() => void signInWithGoogle("/admin/overview")} className="btn-secondary" style={{ width: "100%", padding: "0.8rem", fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit", background: "transparent" }}>
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const access = { isAdmin, hasPermission };
  const canAccessAdminPage = canAccessAdmin(access);
  const navItems = getVisibleAdminNavItems(access);
  const currentRouteId = getAdminRouteIdFromPathname(pathname);
  const canAccessCurrentRoute = currentRouteId ? navItems.some((item) => item.id === currentRouteId) : true;

  if (!canAccessAdminPage || !canAccessCurrentRoute) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column", padding: "1rem" }}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ background: "rgba(12, 18, 34, 0.6)", padding: "3rem", borderRadius: "16px", border: "1px solid rgba(239, 68, 68, 0.3)", textAlign: "center", maxWidth: "420px", width: "100%" }}
        >
          <div style={{ color: "#ef4444", fontSize: "3rem", marginBottom: "1rem" }}>Denied</div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Permission Denied</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem", lineHeight: 1.6 }}>
            Your account (<strong>{user.email}</strong>) does not have the permissions required to access this area.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "2rem" }}>
            Please contact the club president if you believe this is an error.
          </p>
          <button onClick={logout} className="btn-secondary" style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", cursor: "pointer", fontFamily: "inherit" }}>
            Sign Out & Try Another Account
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`dashboard-root workspace-root admin-dashboard-shell${isSidebarOpen ? " admin-mobile-sidebar-open" : ""}`}
      style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)" }}
    >
      <div
        className="mobile-nav-toggle workspace-mobile-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          padding: "0.9rem 1rem",
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(11, 16, 30, 0.95)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <button
          type="button"
          className="workspace-mobile-menu-button auto-width"
          aria-label={isSidebarOpen ? "Close admin navigation" : "Open admin navigation"}
          aria-expanded={isSidebarOpen}
          aria-controls="admin-sidebar"
          onClick={() => setIsSidebarOpen((open) => !open)}
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "999px",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: "0.8rem 0.95rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSidebarOpen ? "Close" : "Menu"}
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: "1.1rem", margin: 0, color: "var(--text-primary)" }}>Admin Control</h1>
          <p
            style={{
              margin: "0.18rem 0 0",
              color: "var(--text-muted)",
              fontSize: "0.72rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Mobile Panel
          </p>
        </div>
      </div>

      <div className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`} onClick={() => setIsSidebarOpen(false)} />

      <div className="workspace-shell" style={{ display: "flex", flex: 1, position: "relative", minHeight: 0 }}>
        <aside
          id="admin-sidebar"
          className={`sidebar-container ${isSidebarOpen ? "open" : ""}`}
          style={{
            width: "220px",
            minWidth: "220px",
            background: "rgba(8, 12, 22, 0.95)",
            borderRight: "1px solid var(--border-subtle)",
            padding: "2rem 0",
            flexShrink: 0,
            overflowY: "auto",
            height: "calc(100vh - 60px)",
            position: "sticky",
            top: "60px",
            zIndex: 20,
          }}
        >
          <div className="admin-sidebar-header" style={{ padding: "0 1.5rem", marginBottom: "2rem" }}>
            <h3 className="gradient-text" style={{ fontFamily: "'Cinzel', serif", fontSize: "1rem", letterSpacing: "0.08em" }}>Admin Panel</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "0.3rem" }}>
              {isAdmin ? "Manage everything" : `${roleName || "Core"} access`}
            </p>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="admin-sidebar-tab"
                data-active={currentRouteId === item.id ? "true" : "false"}
                onClick={() => setIsSidebarOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 1.5rem", background: currentRouteId === item.id ? "rgba(201, 168, 76, 0.08)" : "transparent", border: "none", borderLeft: currentRouteId === item.id ? "2px solid var(--gold)" : "2px solid transparent", color: currentRouteId === item.id ? "var(--gold-light)" : "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit", textAlign: "left", width: "100%", textDecoration: "none" }}
              >
                <span style={{ flexShrink: 0, minWidth: "3.5rem", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="workspace-main admin-main" style={{ flex: 1, padding: "2rem 3rem", maxWidth: "960px", minWidth: 0 }}>
          <div className="admin-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.6rem", color: "var(--text-primary)", flexShrink: 0 }}>Admin Dashboard</h2>
            <div className="admin-search-wrap" style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 2rem", minWidth: 0 }}>
              <GlobalSearch />
            </div>
            <div className="admin-toolbar-actions" style={{ display: "flex", gap: "1rem", alignItems: "center", flexShrink: 0, minWidth: 0 }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold", overflowWrap: "anywhere" }}>{user.email}</span>
              <button onClick={logout} className="btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", background: "transparent", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.4)", cursor: "pointer", fontFamily: "inherit" }}>
                Sign Out
              </button>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
