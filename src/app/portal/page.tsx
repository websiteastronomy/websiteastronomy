"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import AnimatedSection from "@/components/AnimatedSection";
import { useAuth } from "@/context/AuthContext";

export default function Portal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    loading,
    authError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    isAdmin,
    userStatus,
  } = useAuth();

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const redirectTarget = searchParams.get("redirect");
  const safeRedirectTarget = redirectTarget?.startsWith("/") ? redirectTarget : null;

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

  // When user is authenticated and past all gates → redirect to /app
  useEffect(() => {
    if (!user || loading) return;
    // Don't redirect if user is pending / rejected (gates below handle those)
    if ((userStatus === "pending" || userStatus === "rejected") && !isAdmin) return;
    const target = safeRedirectTarget || "/app";
    router.replace(target);
  }, [user, loading, userStatus, isAdmin, safeRedirectTarget, router]);

  return (
    <div className="page-container">
      <AnimatedSection>
        <p className="section-title" style={{ textAlign: "center" }}>
          Welcome Back
        </p>
        <h1 className="page-title">
          <span className="gradient-text">Member Portal</span>
        </h1>
      </AnimatedSection>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--gold)" }}>
          <p>Initializing uplink...</p>
        </div>
      ) : !user ? (
        /* ── Auth Form ── */
        <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
          <AnimatedSection direction="up" delay={0.1}>
            <div className="feature-card" style={{ padding: "3rem", textAlign: "center", maxWidth: "400px", width: "100%" }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--gold-dark), var(--gold))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0c1222"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </motion.div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Astronomy Database</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
                Sign in to access announcements, project tracking, and internal logs.
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
                  {authError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "1.5rem" }}>
                {authMode === "signup" && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    style={inputStyle}
                  />
                )}
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  style={inputStyle}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  style={inputStyle}
                />
              </div>

              <button
                onClick={() =>
                  authMode === "login"
                    ? signInWithEmail(email, password)
                    : signUpWithEmail(email, password, name)
                }
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  marginBottom: "1rem",
                }}
              >
                {authMode === "login" ? "Login with Email" : "Create Member Account"}
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
                    background: "var(--bg-card)",
                    padding: "0 1rem",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                >
                  OR
                </span>
              </div>

              <button
                onClick={() => void signInWithGoogle(safeRedirectTarget || "/app")}
                className="btn-secondary"
                style={{
                  fontFamily: "inherit",
                  cursor: "pointer",
                  width: "100%",
                  fontSize: "0.9rem",
                  padding: "0.8rem",
                  background: "transparent",
                }}
              >
                Continue with Google
              </button>
            </div>
          </AnimatedSection>
        </div>
      ) : userStatus === "pending" && !isAdmin ? (
        /* ── Pending Approval Gate (only blocks non-admins) ── */
        <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
          <AnimatedSection direction="up" delay={0.1}>
            <div className="feature-card" style={{ padding: "3rem", textAlign: "center", maxWidth: "460px", width: "100%" }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(234,179,8,0.3), rgba(234,179,8,0.1))",
                  border: "2px solid rgba(234,179,8,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                  fontSize: "2rem",
                }}
              >
                ⏳
              </motion.div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem", color: "#eab308" }}>Account Pending Approval</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.7 }}>
                Your account has been registered. An administrator will review and approve your access shortly.
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "2rem", lineHeight: 1.6 }}>
                You are signed in as <strong style={{ color: "var(--gold)" }}>{user.email}</strong>.
                Once approved, you will be able to access the full member portal.
              </p>
              <button
                onClick={() => logout()}
                className="btn-secondary"
                style={{
                  fontFamily: "inherit",
                  cursor: "pointer",
                  width: "100%",
                  fontSize: "0.9rem",
                  padding: "0.75rem",
                }}
              >
                Sign Out
              </button>
            </div>
          </AnimatedSection>
        </div>
      ) : userStatus === "rejected" && !isAdmin ? (
        /* ── Rejected Account Gate (only blocks non-admins) ── */
        <div style={{ display: "flex", justifyContent: "center", marginTop: "3rem" }}>
          <AnimatedSection direction="up" delay={0.1}>
            <div className="feature-card" style={{ padding: "3rem", textAlign: "center", maxWidth: "460px", width: "100%" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚫</div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem", color: "#ef4444" }}>Access Not Approved</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.7 }}>
                Your account request was not approved. Please contact an administrator if you believe this is a mistake.
              </p>
              <button
                onClick={() => logout()}
                className="btn-secondary"
                style={{
                  fontFamily: "inherit",
                  cursor: "pointer",
                  width: "100%",
                  fontSize: "0.9rem",
                  padding: "0.75rem",
                }}
              >
                Sign Out
              </button>
            </div>
          </AnimatedSection>
        </div>
      ) : (
        /* ── Authenticated: Redirecting to /app ── */
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--gold)" }}>
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
          <p>Redirecting to your dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
