"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const QrScannerClient = dynamic(() => import("./QrScannerClient"), {
  ssr: false,
  loading: () => (
    <div style={{ textAlign: "center", padding: "3rem", color: "#667788" }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
      Loading camera…
    </div>
  ),
});

interface Session {
  id: string;
  name: string;
  date: string;
  createdAt: string;
}

type AdminView = "login" | "home" | "invite" | "scan" | "export";

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#080d1a",
    fontFamily: "'Outfit', 'Segoe UI', sans-serif",
    color: "#e0e0f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "1.5rem",
    position: "relative",
    overflow: "hidden",
  },
  card: {
    background: "rgba(12,18,36,0.95)",
    border: "1px solid rgba(201,168,76,0.18)",
    borderRadius: "20px",
    padding: "2rem 1.8rem",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 0 60px rgba(201,168,76,0.06), 0 20px 40px rgba(0,0,0,0.5)",
    backdropFilter: "blur(20px)",
    marginTop: "1.5rem",
  },
  logo: { textAlign: "center", marginBottom: "1.5rem" },
  logoH1: {
    fontFamily: "'Cinzel', serif",
    color: "#c9a84c",
    fontSize: "1.1rem",
    margin: "0 0 0.3rem",
    letterSpacing: "0.05em",
  },
  logoSub: { color: "#667788", fontSize: "0.78rem", margin: 0 },
  title: { fontSize: "1.3rem", fontWeight: 700, color: "#e8e8f0", marginBottom: "0.3rem", textAlign: "center" },
  sub: { fontSize: "0.85rem", color: "#667788", textAlign: "center", marginBottom: "1.5rem" },
  label: { display: "block", fontSize: "0.78rem", color: "#8899aa", marginBottom: "0.35rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  input: {
    width: "100%", padding: "0.85rem 1rem",
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(201,168,76,0.15)",
    borderRadius: "10px",
    color: "#e0e0f0",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
    minHeight: "48px",
  },
  btnPrimary: {
    width: "100%", padding: "0.9rem",
    background: "linear-gradient(135deg, #c9a84c, #b8942f)",
    color: "#080d1a",
    border: "none",
    borderRadius: "10px",
    fontSize: "0.95rem",
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    minHeight: "48px",
    marginTop: "0.5rem",
  },
  btnSecondary: {
    padding: "0.8rem 1.2rem",
    background: "rgba(255,255,255,0.04)",
    color: "#c9a84c",
    border: "1.5px solid rgba(201,168,76,0.25)",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    minHeight: "48px",
  },
  field: { marginBottom: "1.1rem" },
  error: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: "8px",
    padding: "0.65rem 1rem",
    color: "#ef4444",
    fontSize: "0.85rem",
    marginBottom: "1rem",
  },
  success: {
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: "8px",
    padding: "0.7rem 1rem",
    color: "#22c55e",
    fontSize: "0.85rem",
    marginBottom: "1rem",
  },
  navGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginTop: "1rem" },
  navCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1.5px solid rgba(201,168,76,0.15)",
    borderRadius: "14px",
    padding: "1.3rem 1rem",
    cursor: "pointer",
    textAlign: "center" as const,
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "inherit",
    color: "inherit",
    minHeight: "90px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#8899aa",
    fontSize: "0.85rem",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "0.3rem 0",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  divider: { height: "1px", background: "rgba(201,168,76,0.1)", margin: "1.2rem 0" },
  sessionItem: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,168,76,0.12)",
    borderRadius: "10px",
    padding: "0.9rem 1rem",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.6rem",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
    color: "inherit",
    width: "100%",
  },
};

export default function AttendanceAdminPage() {
  const [view, setView] = useState<AdminView>("login");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionDate, setNewSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sessionMsg, setSessionMsg] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [exportSessionId, setExportSessionId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("att_admin_pw");
    if (saved) {
      setAdminPassword(saved);
      setView("home");
      void fetchSessions(saved);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    // Verify password against API
    const res = await fetch(`/api/attendance/sessions?adminPassword=${encodeURIComponent(password)}`);
    if (res.status === 401) {
      setLoginError("Incorrect password.");
      return;
    }
    sessionStorage.setItem("att_admin_pw", password);
    setAdminPassword(password);
    const data = await res.json() as { sessions: Session[] };
    setSessions(data.sessions || []);
    setView("home");
  };

  const fetchSessions = async (pw?: string) => {
    const p = pw || adminPassword;
    const res = await fetch(`/api/attendance/sessions?adminPassword=${encodeURIComponent(p)}`);
    if (res.ok) {
      const data = await res.json() as { sessions: Session[] };
      setSessions(data.sessions || []);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionMsg("");
    const res = await fetch("/api/attendance/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSessionName, date: newSessionDate, adminPassword }),
    });
    const data = await res.json() as { session?: Session; error?: string };
    if (res.ok && data.session) {
      setSessions((prev) => [data.session!, ...prev]);
      setActiveSession(data.session!);
      setNewSessionName("");
      setSessionMsg("Session created! Starting scanner…");
      setTimeout(() => { setView("scan"); setSessionMsg(""); }, 800);
    } else {
      setSessionMsg(data.error || "Failed to create session.");
    }
  };

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg("");
    setInviteLoading(true);
    const emails = inviteEmails.split(/[\n,]/).map((e) => e.trim()).filter(Boolean);
    if (!emails.length) { setInviteMsg("Enter at least one email."); setInviteLoading(false); return; }
    const res = await fetch("/api/attendance/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails, adminPassword }),
    });
    const data = await res.json() as { results?: { email: string; status: string }[]; error?: string };
    if (res.ok) {
      const created = data.results?.filter((r) => r.status === "created").length ?? 0;
      const existing = data.results?.filter((r) => r.status === "existing" || r.status?.startsWith("existing")).length ?? 0;
      setInviteMsg(`✅ Sent ${created} new invite(s). ${existing} already invited.`);
      setInviteEmails("");
    } else {
      setInviteMsg(data.error || "Failed to send invites.");
    }
    setInviteLoading(false);
  };

  const handleExport = () => {
    const params = new URLSearchParams({ adminPassword });
    if (exportSessionId) params.set("sessionId", exportSessionId);
    window.open(`/api/attendance/export?${params.toString()}`, "_blank");
  };

  const handleClear = async () => {
    if (!confirm("This will delete ALL attendance records permanently. Users and tokens will be preserved. Continue?")) return;
    setClearing(true);
    setClearMsg("");
    const res = await fetch("/api/attendance/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword }),
    });
    const data = await res.json() as { message?: string; error?: string };
    setClearMsg(res.ok ? ("✅ " + (data.message || "Cleared.")) : ("❌ " + (data.error || "Failed.")));
    setClearing(false);
  };

  const logout = () => {
    sessionStorage.removeItem("att_admin_pw");
    setAdminPassword("");
    setPassword("");
    setView("login");
  };

  if (view === "login") return (
    <div style={S.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Cinzel:wght@600&display=swap');`}</style>
      <div style={S.card}>
        <div style={S.logo}>
          <h1 style={S.logoH1}>🔭 Astronomy Club</h1>
          <p style={S.logoSub}>Attendance Admin</p>
        </div>
        <h2 style={S.title}>Admin Login</h2>
        <p style={S.sub}>Enter your attendance admin password to continue.</p>
        {loginError && <div style={S.error}>⚠️ {loginError}</div>}
        <form onSubmit={(e) => { void handleLogin(e); }}>
          <div style={S.field}>
            <label htmlFor="att-admin-pw" style={S.label}>Admin Password</label>
            <input
              id="att-admin-pw"
              type="password"
              style={S.input}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button id="att-admin-login-btn" type="submit" style={S.btnPrimary}>Login →</button>
        </form>
      </div>
    </div>
  );

  if (view === "home") return (
    <div style={S.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Cinzel:wght@600&display=swap');`}</style>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ ...S.logoH1, fontFamily: "'Cinzel', serif", fontSize: "1rem" }}>🔭 Attendance Admin</h1>
            <p style={S.logoSub}>MVJCE Astronomy Club</p>
          </div>
          <button style={{ ...S.btnSecondary, padding: "0.5rem 0.8rem", fontSize: "0.8rem", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }} onClick={logout}>
            Sign Out
          </button>
        </div>

        <div style={S.navGrid}>
          {[
            { id: "nav-invite", icon: "📧", label: "Send Invites", view: "invite" as AdminView },
            { id: "nav-scan", icon: "📷", label: "Start Scanning", view: "scan" as AdminView },
            { id: "nav-export", icon: "📊", label: "Export CSV", view: "export" as AdminView },
          ].map((item) => (
            <button
              key={item.view}
              id={item.id}
              style={S.navCard}
              onClick={() => { if (item.view === "scan") { setActiveSession(null); } setView(item.view); }}
            >
              <span style={{ fontSize: "1.8rem" }}>{item.icon}</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#c9a84c" }}>{item.label}</span>
            </button>
          ))}
          <button id="nav-clear" style={{ ...S.navCard, borderColor: "rgba(239,68,68,0.2)" }} onClick={() => { void handleClear(); }}>
            <span style={{ fontSize: "1.8rem" }}>🗑️</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#ef4444" }}>Clear Records</span>
          </button>
        </div>

        {clearMsg && <div style={{ ...(/✅/.test(clearMsg) ? S.success : S.error), marginTop: "1rem" }}>{clearMsg}</div>}

        <div style={S.divider} />
        <div style={{ fontSize: "0.85rem", color: "#8899aa", marginBottom: "0.6rem", fontWeight: 600 }}>Recent Sessions</div>
        {sessions.length === 0 && <div style={{ color: "#445566", fontSize: "0.85rem" }}>No sessions yet.</div>}
        {sessions.slice(0, 5).map((s) => (
          <button
            key={s.id}
            style={S.sessionItem}
            onClick={() => { setActiveSession(s); setView("scan"); }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</div>
              <div style={{ color: "#667788", fontSize: "0.78rem", marginTop: "0.2rem" }}>{s.date}</div>
            </div>
            <span style={{ color: "#c9a84c", fontSize: "0.8rem" }}>Scan →</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (view === "invite") return (
    <div style={S.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Cinzel:wght@600&display=swap');`}</style>
      <div style={S.card}>
        <button style={S.backBtn} onClick={() => setView("home")}>← Back</button>
        <h2 style={S.title}>Send Invites</h2>
        <p style={S.sub}>Enter email addresses to send personal QR verification links.</p>
        {inviteMsg && <div style={/✅/.test(inviteMsg) ? S.success : S.error}>{inviteMsg}</div>}
        <form onSubmit={(e) => { void handleSendInvites(e); }}>
          <div style={S.field}>
            <label htmlFor="att-emails" style={S.label}>Email Addresses (one per line or comma-separated)</label>
            <textarea
              id="att-emails"
              rows={6}
              style={{ ...S.input, resize: "vertical", minHeight: "120px", lineHeight: 1.5 }}
              placeholder={"student1@example.com\nstudent2@example.com"}
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
            />
          </div>
          <button id="att-send-invites-btn" type="submit" style={S.btnPrimary} disabled={inviteLoading}>
            {inviteLoading ? "Sending…" : "📧 Send Invites"}
          </button>
        </form>
      </div>
    </div>
  );

  if (view === "scan") return (
    <div style={S.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Cinzel:wght@600&display=swap'); @keyframes att-fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
      <div style={S.card}>
        <button style={S.backBtn} onClick={() => setView("home")}>← Back</button>

        {!activeSession ? (
          // Session setup
          <>
            <h2 style={S.title}>Start a Session</h2>
            <p style={S.sub}>Create a new session or pick an existing one to begin scanning.</p>

            {sessionMsg && <div style={/Session created/.test(sessionMsg) ? S.success : S.error}>{sessionMsg}</div>}

            <form onSubmit={(e) => { void handleCreateSession(e); }}>
              <div style={S.field}>
                <label htmlFor="att-session-name" style={S.label}>Session Name</label>
                <input
                  id="att-session-name"
                  type="text"
                  style={S.input}
                  placeholder="e.g. Night Sky Workshop — April 2026"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  required
                />
              </div>
              <div style={S.field}>
                <label htmlFor="att-session-date" style={S.label}>Date</label>
                <input
                  id="att-session-date"
                  type="date"
                  style={S.input}
                  value={newSessionDate}
                  onChange={(e) => setNewSessionDate(e.target.value)}
                  required
                />
              </div>
              <button id="att-create-session-btn" type="submit" style={S.btnPrimary}>📷 Start Scanning</button>
            </form>

            {sessions.length > 0 && (
              <>
                <div style={S.divider} />
                <div style={{ fontSize: "0.82rem", color: "#8899aa", marginBottom: "0.6rem", fontWeight: 600 }}>Or continue a previous session:</div>
                {sessions.slice(0, 4).map((s) => (
                  <button key={s.id} style={S.sessionItem} onClick={() => setActiveSession(s)}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</div>
                      <div style={{ color: "#667788", fontSize: "0.78rem" }}>{s.date}</div>
                    </div>
                    <span style={{ color: "#c9a84c", fontSize: "0.8rem" }}>Select →</span>
                  </button>
                ))}
              </>
            )}
          </>
        ) : (
          // Active scanner
          <QrScannerClient
            sessionId={activeSession.id}
            sessionName={activeSession.name}
            adminPassword={adminPassword}
            onClose={() => { setActiveSession(null); setView("home"); }}
          />
        )}
      </div>
    </div>
  );

  if (view === "export") return (
    <div style={S.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Cinzel:wght@600&display=swap');`}</style>
      <div style={S.card}>
        <button style={S.backBtn} onClick={() => setView("home")}>← Back</button>
        <h2 style={S.title}>Export & Manage</h2>
        <p style={S.sub}>Download attendance data as CSV or clear records.</p>

        <div style={{ marginBottom: "1.2rem" }}>
          <label htmlFor="att-export-session" style={S.label}>Filter by Session (optional)</label>
          <select
            id="att-export-session"
            style={{ ...S.input, color: exportSessionId ? "#e0e0f0" : "#445566", appearance: "none" }}
            value={exportSessionId}
            onChange={(e) => setExportSessionId(e.target.value)}
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.date}</option>
            ))}
          </select>
        </div>

        <button id="att-export-csv-btn" style={S.btnPrimary} onClick={handleExport}>
          ⬇ Export CSV
        </button>

        <div style={S.divider} />

        <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "12px", padding: "1.2rem" }}>
          <div style={{ fontWeight: 700, color: "#ef4444", marginBottom: "0.5rem", fontSize: "0.95rem" }}>⚠️ Danger Zone</div>
          <p style={{ color: "#8899aa", fontSize: "0.82rem", lineHeight: 1.5, margin: "0 0 1rem" }}>
            Clears ALL attendance records. User tokens and sessions are preserved.
          </p>
          <button
            id="att-clear-btn"
            style={{ ...S.btnPrimary, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", marginTop: 0 }}
            onClick={() => { void handleClear(); }}
            disabled={clearing}
          >
            {clearing ? "Clearing…" : "🗑️ Clear All Attendance Records"}
          </button>
          {clearMsg && <div style={{ ...(/✅/.test(clearMsg) ? S.success : S.error), marginTop: "0.8rem", marginBottom: 0 }}>{clearMsg}</div>}
        </div>
      </div>
    </div>
  );

  return null;
}
