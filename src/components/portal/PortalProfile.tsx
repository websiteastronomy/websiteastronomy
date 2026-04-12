"use client";

import Link from "next/link";
import AnimatedSection from "@/components/AnimatedSection";
import {
  getFeatureDisplayName,
  type SystemControlSettings,
  type SystemFeatureFlags,
} from "@/lib/system-control";
import type { PortalUser } from "./types";

type FeedbackState = { type: "success" | "error"; message: string } | null;

type PortalProfileProps = {
  user: PortalUser;
  profileImageUrl: string | null;
  imgError: boolean;
  onImageError: () => void;
  onOpenCropper: () => void;
  quoteFeedback: FeedbackState;
  contactFeedback: FeedbackState;
  onQuoteFeedbackChange: (value: FeedbackState) => void;
  onContactFeedbackChange: (value: FeedbackState) => void;
  onLogout: () => Promise<void> | void;
  systemControl: SystemControlSettings | null;
  disabledFeatures: Array<keyof SystemFeatureFlags>;
  hasPermission: (permission: string) => boolean;
  canAccessAdminPage: boolean;
  showDashboardLink?: boolean;
};

const quickLinkStyle = {
  color: "var(--text-secondary)",
  fontSize: "0.85rem",
  fontWeight: 300,
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
} as const;

export default function PortalProfile({
  user,
  profileImageUrl,
  imgError,
  onImageError,
  onOpenCropper,
  quoteFeedback,
  contactFeedback,
  onQuoteFeedbackChange,
  onContactFeedbackChange,
  onLogout,
  systemControl,
  disabledFeatures,
  hasPermission,
  canAccessAdminPage,
  showDashboardLink = true,
}: PortalProfileProps) {
  if (!user) {
    return null;
  }

  return (
    <div className="portal-profile-sidebar" style={{ minWidth: 0 }}>
      <AnimatedSection direction="right" delay={0.1}>
        <div className="feature-card" style={{ padding: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
          {profileImageUrl && !imgError ? (
            <img
              src={profileImageUrl}
              alt="Avatar"
              onError={onImageError}
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                margin: "0 auto 1rem",
                border: "2px solid var(--gold)",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--gold-dark), var(--gold))",
                margin: "0 auto 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                color: "#000",
                fontWeight: 700,
              }}
            >
              {(user.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>{user.name || "Club Member"}</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", overflowWrap: "anywhere", wordBreak: "break-word" }}>{user.email}</p>

          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={onOpenCropper}
              style={{
                display: "inline-block",
                background: "transparent",
                fontSize: "0.78rem",
                color: "var(--gold)",
                cursor: "pointer",
                padding: "0.4rem 0.8rem",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: "6px",
                transition: "all 0.2s",
              }}
            >
              Upload Photo
            </button>

            <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
              JPG, PNG, WebP • Max 2MB
            </p>
          </div>

          <div style={{ marginTop: "1rem", textAlign: "left" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                marginBottom: "0.4rem",
              }}
            >
              Your Quote
            </label>
            {quoteFeedback && (
              <div
                style={{
                  marginBottom: "0.6rem",
                  padding: "0.55rem 0.7rem",
                  borderRadius: "6px",
                  border:
                    quoteFeedback.type === "success"
                      ? "1px solid rgba(34,197,94,0.35)"
                      : "1px solid rgba(239,68,68,0.35)",
                  background:
                    quoteFeedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  color: quoteFeedback.type === "success" ? "#86efac" : "#fca5a5",
                  fontSize: "0.75rem",
                }}
              >
                {quoteFeedback.message}
              </div>
            )}
            <div className="portal-quote-row" style={{ display: "flex", gap: "0.5rem" }}>
              <input
                id="user-quote"
                type="text"
                placeholder="e.g. Per aspera ad astra"
                defaultValue={user.quote || ""}
                style={{
                  flex: 1,
                  padding: "0.5rem 0.7rem",
                  background: "rgba(15, 22, 40, 0.6)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                  minWidth: 0,
                }}
              />
              <button
                onClick={async () => {
                  const input = document.getElementById("user-quote") as HTMLInputElement | null;
                  if (!input) return;

                  onQuoteFeedbackChange(null);

                  try {
                    const { updateUserProfileAction } = await import("@/app/actions/members");
                    await updateUserProfileAction({ quote: input.value });
                    onQuoteFeedbackChange({ type: "success", message: "Quote saved!" });
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Unknown error";
                    onQuoteFeedbackChange({ type: "error", message: `Failed: ${message}` });
                  }
                }}
                style={{
                  padding: "0.5rem 0.7rem",
                  background: "var(--gold-dark)",
                  color: "#000",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "inherit",
                }}
              >
                Save
              </button>
            </div>
          </div>

          <button
            onClick={() => void onLogout()}
            className="btn-secondary"
            style={{
              marginTop: "1.5rem",
              fontFamily: "inherit",
              cursor: "pointer",
              width: "100%",
              background: "transparent",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#ef4444",
            }}
          >
            Sign Out
          </button>
        </div>
      </AnimatedSection>

      <AnimatedSection direction="right" delay={0.2}>
        <div className="feature-card" style={{ padding: "1.5rem", textAlign: "left", marginBottom: "1.5rem" }}>
          <h4
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--gold)",
              marginBottom: "1.2rem",
            }}
          >
            Contact Admin
          </h4>
          {contactFeedback && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.7rem 0.85rem",
                borderRadius: "8px",
                border:
                  contactFeedback.type === "success"
                    ? "1px solid rgba(34,197,94,0.35)"
                    : "1px solid rgba(239,68,68,0.35)",
                background:
                  contactFeedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                color: contactFeedback.type === "success" ? "#86efac" : "#fca5a5",
                fontSize: "0.8rem",
              }}
            >
              {contactFeedback.message}
            </div>
          )}
          <form
            onSubmit={async (event) => {
              event.preventDefault();

              const form = event.target as HTMLFormElement;
              const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;
              if (!message) return;

              onContactFeedbackChange(null);

              const button = form.querySelector("button");
              if (button) {
                button.disabled = true;
              }

              try {
                const response = await fetch("/api/send-email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    flow: "member_contact",
                    to: "admin",
                    subject: `Message from Member: ${user.name || user.email}`,
                    replyTo: user.email,
                    html: `
                      <div style="font-family: sans-serif; padding: 20px; background: #0f1628; color: #fff; border: 1px solid #c9a84c; border-radius: 12px;">
                        <h2 style="color: #c9a84c;">New Member Message</h2>
                        <p><strong>From:</strong> ${user.name} (${user.email})</p>
                        <p><strong>Message:</strong></p>
                        <p style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; line-height: 1.6;">${message}</p>
                      </div>
                    `,
                  }),
                });

                if (!response.ok) {
                  throw new Error("Email request rejected");
                }

                onContactFeedbackChange({ type: "success", message: "Message sent to admin!" });
                form.reset();
              } catch (err) {
                console.error(err);
                onContactFeedbackChange({ type: "error", message: "Failed to send message." });
              } finally {
                if (button) {
                  button.disabled = false;
                }
              }
            }}
          >
            <textarea
              name="message"
              required
              placeholder="Ask a question or report an issue..."
              style={{
                width: "100%",
                background: "rgba(15, 22, 40, 0.6)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "0.8rem",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                minHeight: "100px",
                marginBottom: "1rem",
                resize: "none",
                outline: "none",
              }}
            />
            <button type="submit" className="btn-primary" style={{ width: "100%", fontSize: "0.8rem", padding: "0.7rem" }}>
              Send Message
            </button>
          </form>
        </div>
      </AnimatedSection>

      <AnimatedSection direction="right" delay={0.3}>
        <div className="feature-card" style={{ padding: "1.5rem", textAlign: "left" }}>
          <h4
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--gold)",
              marginBottom: "1rem",
            }}
          >
            Quick Links
          </h4>
          {systemControl && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.8rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                background: "rgba(8,12,22,0.35)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-muted)",
                }}
              >
                Feature Availability
              </p>
              <div
                style={{
                  marginTop: "0.5rem",
                  display: "grid",
                  gap: "0.35rem",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                }}
              >
                {disabledFeatures.map((feature) => (
                  <span key={feature}>{getFeatureDisplayName(feature)} is currently disabled.</span>
                ))}
                {disabledFeatures.length === 0 ? <span>All member modules are available.</span> : null}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {systemControl?.features?.quizzesEnabled !== false && (
              <Link href="/education/quizzes" style={quickLinkStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                Quizzes & Leaderboard
              </Link>
            )}
            {systemControl?.features?.quizzesEnabled !== false && (
              <Link href="/education/quizzes" style={quickLinkStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                Quiz
              </Link>
            )}
            {systemControl?.features?.observationsEnabled !== false && (
              <Link href="/portal/observations" style={quickLinkStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                Observation Feed
              </Link>
            )}
            {systemControl?.features?.observationsEnabled !== false && (
              <Link href="/observations" style={quickLinkStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                Log Observation
              </Link>
            )}
            {systemControl?.features?.observationsEnabled !== false && (
              <Link href="/observations" style={quickLinkStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                Observation
              </Link>
            )}
            {systemControl?.features?.eventsEnabled !== false && (
              <Link href="/events" style={quickLinkStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Upcoming Events
              </Link>
            )}
            {systemControl?.features?.eventsEnabled !== false && (
              <Link href="/events" style={quickLinkStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /></svg>
                Event
              </Link>
            )}
            <Link href="/documentation" style={quickLinkStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
              Documentation Hub
            </Link>
            <Link href="/finance" style={quickLinkStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" /></svg>
              Finance Workspace
            </Link>
            {hasPermission("manage_projects") && (
              <Link href="/core/observations" style={quickLinkStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><path d="M21 12c0 1.66-4.03 6-9 6s-9-4.34-9-6 4.03-6 9-6 9 4.34 9 6z" /></svg>
                Review Queue
              </Link>
            )}
            {canAccessAdminPage && (
              <Link href="/admin" style={quickLinkStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                Admin Dashboard
              </Link>
            )}
            {showDashboardLink && (
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.8rem", marginTop: "0.4rem" }}>
                <Link
                  href="/dashboard"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.6rem 1rem",
                    borderRadius: "8px",
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    color: "var(--gold-light)",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  ✨ Try New Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
