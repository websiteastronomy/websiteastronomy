"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type LoginGateProps = {
  redirectTarget?: string | null;
};

export default function LoginGate({ redirectTarget }: LoginGateProps) {
  const router = useRouter();
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
  const safeRedirectTarget = redirectTarget?.startsWith("/") ? redirectTarget : null;
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (!user || loading || redirected) return;
    if ((userStatus === "pending" || userStatus === "rejected") && !isAdmin) return;
    const target = safeRedirectTarget || "/app";
    setRedirected(true);
    router.replace(target);
  }, [user, loading, userStatus, isAdmin, safeRedirectTarget, router, redirected]);

  const handleCredentialsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (authMode === "login") {
      void signInWithEmail(email, password);
      return;
    }
    void signUpWithEmail(email, password, name);
  };

  return (
    <div className="astronomy-login-page">
      {loading ? (
        <div className="astronomy-login-state">
          <div className="astronomy-login-spinner" />
          <p>Initializing uplink...</p>
        </div>
      ) : !user ? (
        <>
          <img className="astronomy-login-moon-large" src="/figma/astronomy1/login/moon-large.png" alt="" aria-hidden="true" />
          <img className="astronomy-login-crescent" src="/figma/astronomy1/login/crescent.png" alt="" aria-hidden="true" />
          <section className="astronomy-login-card" aria-labelledby="login-title">
            <div className="astronomy-login-brand">
              <img src="/figma/astronomy1/login/club-badge.png" alt="Astronomy Club" />
            </div>
            <h1 id="login-title">Login To Your Account</h1>
            <div className="astronomy-login-title-line" />
            <p className="astronomy-login-subtitle">
              Sign in to access announcements, project tracking, and internal logs.
            </p>

            {authError ? (
              <div className="astronomy-login-alert">
                {authError}
              </div>
            ) : null}

            <form className="astronomy-login-form" onSubmit={handleCredentialsSubmit}>
              <div className="astronomy-login-fields">
                {authMode === "signup" ? (
                  <label className="astronomy-login-field-group">
                    <span>Full Name</span>
                    <div className="astronomy-login-input-shell">
                      <span className="astronomy-login-input-icon" aria-hidden="true">A</span>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="name"
                      />
                    </div>
                  </label>
                ) : null}

                <label className="astronomy-login-field-group">
                  <span>Email Address</span>
                  <div className="astronomy-login-input-shell">
                    <img src="/figma/astronomy1/login/email-icon.png" alt="" aria-hidden="true" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label className="astronomy-login-field-group">
                  <span>Password</span>
                  <div className="astronomy-login-input-shell">
                    <img src="/figma/astronomy1/login/password-icon.png" alt="" aria-hidden="true" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    />
                  </div>
                </label>
              </div>

              {authMode === "login" ? (
                <div className="astronomy-login-forgot">Forget Password ?</div>
              ) : null}

              <button type="submit" className="astronomy-login-primary">
                {authMode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
              </button>

              <button type="button" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} className="astronomy-login-toggle">
                {authMode === "login" ? "Don't have an account ? " : "Already have an account ? "}
                <span>{authMode === "login" ? "Sign Up" : "Login"}</span>
              </button>

              <div className="astronomy-login-divider">
                <span />
                <strong>or</strong>
                <span />
              </div>

              <button
                type="button"
                onClick={() => void signInWithGoogle(safeRedirectTarget || "/app")}
                className="astronomy-login-google"
              >
                <img src="/figma/astronomy1/login/google-icon.png" alt="" aria-hidden="true" />
                Continue with Google
              </button>
            </form>
          </section>
        </>
      ) : userStatus === "pending" && !isAdmin ? (
        <div className="astronomy-login-status-wrap">
          <div className="feature-card astronomy-login-status-card">
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
              ...
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
        </div>
      ) : userStatus === "rejected" && !isAdmin ? (
        <div className="astronomy-login-status-wrap">
          <div className="feature-card astronomy-login-status-card">
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>X</div>
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
        </div>
      ) : (
        <div className="astronomy-login-state">
          <div className="astronomy-login-spinner" />
          <p>Redirecting to your dashboard...</p>
        </div>
      )}
    </div>
  );
}
