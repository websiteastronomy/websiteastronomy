"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  ADMIN_PAGE_PERMISSIONS,
  canAccessAdminPage as canAccessAdminDashboard,
} from "@/lib/admin-access";

import OverviewManager from "./components/OverviewManager";
import CoreObservationsManager from "./components/CoreObservationsManager";
import EventsManager from "./components/EventsManager";
import ObservationsManager from "./components/ObservationsManager";
import OutreachManager from "./components/OutreachManager";
import ArticlesManager from "./components/ArticlesManager";
import ProjectsManager from "./components/ProjectsManager";
import QuizzesManager from "./components/QuizzesManager";
import AchievementsManager from "./components/AchievementsManager";
import SettingsManager from "./components/SettingsManager";
import MembersManager from "./components/MembersManager";
import NightSkyManager from "./components/NightSkyManager";
import SystemSettingsManager from "./components/SystemSettingsManager";
import GlobalSearch from "./components/GlobalSearch";
import ApprovalsPanel from "./components/ApprovalsPanel";
import PublicMembersManager from "./components/PublicMembersManager";

type AdminTab = {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
};

export default function Admin() {
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

  const [activeTab, setActiveTab] = useState("overview");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const access = { isAdmin, hasPermission };
  const canAccessAdminPage = canAccessAdminDashboard(access);

  const tabs: AdminTab[] = [
    { id: "overview", label: "Overview", icon: "📊", visible: ADMIN_PAGE_PERMISSIONS.overview(access) },
    { id: "events", label: "Events", icon: "📅", visible: ADMIN_PAGE_PERMISSIONS.events(access) },
    { id: "members", label: "Directory & Approvals", icon: "👥", visible: ADMIN_PAGE_PERMISSIONS.members(access) },
    { id: "articles", label: "Articles & Facts", icon: "📝", visible: ADMIN_PAGE_PERMISSIONS.articles(access) },
    { id: "projects", label: "Projects", icon: "🚀", visible: ADMIN_PAGE_PERMISSIONS.projects(access) },
    { id: "observations", label: "Observations", icon: "🔭", visible: ADMIN_PAGE_PERMISSIONS.observations(access) },
    { id: "outreach", label: "Outreach", icon: "🤝", visible: ADMIN_PAGE_PERMISSIONS.outreach(access) },
    { id: "achievements", label: "Achievements", icon: "🏆", visible: ADMIN_PAGE_PERMISSIONS.achievements(access) },
    { id: "night-sky", label: "Night Sky", icon: "🌙", visible: ADMIN_PAGE_PERMISSIONS.nightSky(access) },
    { id: "settings", label: "Site Settings", icon: "⚙️", visible: ADMIN_PAGE_PERMISSIONS.settings(access) },
    { id: "system", label: "System Storage", icon: "💾", visible: ADMIN_PAGE_PERMISSIONS.system(access) },
  ].filter((tab) => tab.visible);

  const currentTab = tabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : (tabs[0]?.id ?? "overview");

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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--gold)" }}>Verifying credentials...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column" }}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            background: "rgba(12, 18, 34, 0.6)",
            padding: "3rem",
            borderRadius: "16px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          <div style={{ color: "#ef4444", fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Restricted Area</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.6 }}>
            You must be authenticated to access the administrative control panel.
          </p>

          {authError && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "0.8rem",
                borderRadius: "8px",
                color: "#ef4444",
                fontSize: "0.85rem",
                marginBottom: "1.5rem",
              }}
            >
              Warning: {authError}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "1.5rem" }}>
            {authMode === "signup" && (
              <input type="text" placeholder="Full Name" value={name} onChange={(event) => setName(event.target.value)} style={inputStyle} />
            )}
            <input type="email" placeholder="Email Address" value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} />
          </div>

          <button
            onClick={() => (authMode === "login" ? signInWithEmail(email, password) : signUpWithEmail(email, password, name))}
            className="btn-primary"
            style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", cursor: "pointer", fontFamily: "inherit", marginBottom: "1rem" }}
          >
            {authMode === "login" ? "Login with Email" : "Create Admin Account"}
          </button>

          <button
            onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
            style={{
              background: "none",
              border: "none",
              color: "var(--gold)",
              fontSize: "0.85rem",
              cursor: "pointer",
              textDecoration: "underline",
              marginBottom: "1.5rem",
              display: "block",
              margin: "0 auto",
            }}
          >
            {authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>

          <div style={{ position: "relative", margin: "1.5rem 0", textAlign: "center" }}>
            <hr style={{ border: "0", borderTop: "1px solid var(--border-subtle)" }} />
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgb(12, 18, 34)",
                padding: "0 1rem",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              OR
            </span>
          </div>

          <button
            onClick={signInWithGoogle}
            className="btn-secondary"
            style={{ width: "100%", padding: "0.8rem", fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit", background: "transparent" }}
          >
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  if (!canAccessAdminPage) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", flexDirection: "column" }}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            background: "rgba(12, 18, 34, 0.6)",
            padding: "3rem",
            borderRadius: "16px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          <div style={{ color: "#ef4444", fontSize: "3rem", marginBottom: "1rem" }}>⛔</div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>Permission Denied</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem", lineHeight: 1.6 }}>
            Your account (<strong>{user.email}</strong>) does not have the permissions required to access this area.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "2rem" }}>
            Please contact the club president if you believe this is an error.
          </p>
          <button
            onClick={logout}
            className="btn-secondary"
            style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", cursor: "pointer", fontFamily: "inherit" }}
          >
            Sign Out & Try Another Account
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
      <aside style={{ width: "220px", background: "rgba(8, 12, 22, 0.6)", borderRight: "1px solid var(--border-subtle)", padding: "2rem 0", flexShrink: 0 }}>
        <div style={{ padding: "0 1.5rem", marginBottom: "2rem" }}>
          <h3 className="gradient-text" style={{ fontFamily: "'Cinzel', serif", fontSize: "1rem", letterSpacing: "0.08em" }}>
            Admin Panel
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "0.3rem" }}>
            {isAdmin ? "Manage everything" : `${roleName || "Core"} access`}
          </p>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.8rem",
                padding: "0.7rem 1.5rem",
                background: currentTab === tab.id ? "rgba(201, 168, 76, 0.08)" : "transparent",
                border: "none",
                borderLeft: currentTab === tab.id ? "2px solid var(--gold)" : "2px solid transparent",
                color: currentTab === tab.id ? "var(--gold-light)" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "all 0.2s ease",
                width: "100%",
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, padding: "2rem 3rem", maxWidth: "900px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.6rem", color: "var(--text-primary)", flexShrink: 0 }}>Admin Dashboard</h2>

          <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 2rem" }}>
            <GlobalSearch />
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "bold" }}>{user.email}</span>
            <button
              onClick={logout}
              className="btn-secondary"
              style={{
                padding: "0.4rem 1rem",
                fontSize: "0.8rem",
                background: "transparent",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {currentTab === "overview" && <OverviewManager onNavigate={setActiveTab} />}

        {currentTab === "events" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <EventsManager />
          </div>
        )}

        {currentTab === "members" && (
          <div style={{ animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", gap: "3rem" }}>
            <ApprovalsPanel userRole={roleName} userId={user.id} />
            <MembersManager />
            <div style={{ height: "1px", background: "var(--border-subtle)", margin: "1rem 0" }} />
            <PublicMembersManager />
          </div>
        )}

        {currentTab === "observations" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {isAdmin ? <ObservationsManager /> : <CoreObservationsManager />}
          </div>
        )}

        {currentTab === "outreach" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <OutreachManager />
          </div>
        )}

        {currentTab === "articles" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <ArticlesManager />
          </div>
        )}

        {currentTab === "projects" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <ProjectsManager />
          </div>
        )}

        {currentTab === "achievements" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <AchievementsManager />
          </div>
        )}

        {currentTab === "settings" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <SettingsManager />
          </div>
        )}

        {currentTab === "system" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <SystemSettingsManager />
          </div>
        )}

        {currentTab === "night-sky" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <NightSkyManager />
          </div>
        )}

        {currentTab === "quizzes" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <QuizzesManager />
          </div>
        )}
      </div>
    </div>
  );
}
