"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  canAccessDashboardModule,
  deriveDashboardRole,
  getAccessibleDashboardModules,
  getDashboardRouteModule,
  getDefaultDashboardHref,
} from "@/lib/module-access";
import DeprecationBanner from "@/components/DeprecationBanner";

function SidebarBadge({ label }: { label: string }) {
  return (
    <span
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    isAdmin,
    roleName,
    permissions,
    loading,
    authError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
  } = useAuth();

  const dashboardRole = deriveDashboardRole({ roleName, isAdmin, permissions });
  const sidebarModules = getAccessibleDashboardModules(dashboardRole);
  const currentRouteModule = getDashboardRouteModule(pathname);
  const isAllowedRoute = currentRouteModule
    ? canAccessDashboardModule(currentRouteModule, dashboardRole)
    : true;
  const fallbackHref = getDefaultDashboardHref(dashboardRole);

  useEffect(() => {
    if (!user || !currentRouteModule || isAllowedRoute) {
      return;
    }

    router.replace(fallbackHref);
  }, [currentRouteModule, fallbackHref, isAllowedRoute, router, user]);

  if (loading) {
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
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <DashboardLoginGate
        callbackURL={pathname}
        authError={authError}
        signInWithGoogle={signInWithGoogle}
        signInWithEmail={signInWithEmail}
        signUpWithEmail={signUpWithEmail}
      />
    );
  }

  if (!isAllowedRoute) {
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
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Redirecting to your accessible workspace...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 80px)" }}>
      <DeprecationBanner currentPath="/dashboard" />
      <div style={{ display: "flex", flex: 1 }}>
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

        {sidebarModules.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
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
            href="/dashboard/profile"
            prefetch={false}
            className={`sidebar-link${isActive("/dashboard/profile") ? " sidebar-link-active" : ""}`}
            style={{
              color: isActive("/dashboard/profile") ? undefined : "var(--text-secondary)",
              fontWeight: isActive("/dashboard/profile") ? undefined : 400,
            }}
          >
            <SidebarBadge label="PF" />
            Profile
          </Link>
        </div>

        <div style={{ marginTop: "auto", padding: "1rem 1.25rem", borderTop: "1px solid var(--border-subtle)" }}>
          <Link
            href="/portal"
            prefetch={false}
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
            Back to Portal
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

      <div className="dash-fade-in" style={{ flex: 1, padding: "2rem", minWidth: 0, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function DashboardLoginGate({
  callbackURL,
  authError,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
}: {
  callbackURL: string;
  authError?: string | null;
  signInWithGoogle: (callbackURL?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
}) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const inputStyle = {
    padding: "0.7rem 1rem",
    background: "rgba(15, 22, 40, 0.5)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    color: "var(--text-primary)",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    width: "100%",
  };

  const handleSubmit = async () => {
    setError(null);

    try {
      if (authMode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    }
  };

  return (
    <div
      className="login-gate"
      style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
    >
      <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1.8rem", marginBottom: "0.5rem" }}>
        <span className="gradient-text">Dashboard</span>
      </h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", maxWidth: "400px" }}>
        Sign in to access your personalized dashboard.
      </p>

      <div style={{ width: "100%", maxWidth: "380px", display: "grid", gap: "0.8rem" }}>
        <button
          onClick={() => void signInWithGoogle(callbackURL)}
          className="btn-secondary"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            fontFamily: "inherit",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          or
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
        </div>

        {authMode === "signup" && (
          <input type="text" placeholder="Full Name" value={name} onChange={(event) => setName(event.target.value)} style={inputStyle} />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={inputStyle}
          onKeyDown={(event) => event.key === "Enter" && void handleSubmit()}
        />

        {(error || authError) && (
          <div
            style={{
              color: "#fca5a5",
              fontSize: "0.82rem",
              background: "rgba(239,68,68,0.08)",
              padding: "0.6rem 0.8rem",
              borderRadius: "6px",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {error || authError}
          </div>
        )}

        <button onClick={() => void handleSubmit()} className="btn-primary" style={{ width: "100%", fontFamily: "inherit" }}>
          {authMode === "login" ? "Sign In" : "Create Account"}
        </button>

        <button
          onClick={() => {
            setAuthMode(authMode === "login" ? "signup" : "login");
            setError(null);
          }}
          style={{ background: "transparent", border: "none", color: "var(--gold)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}
        >
          {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
