"use client";

import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AnimatedSection from "@/components/AnimatedSection";
import { useAuth } from "@/context/AuthContext";

type FeedbackState = { type: "success" | "error"; message: string } | null;

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.85rem 1rem",
  background: "rgba(8, 12, 22, 0.75)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "0.95rem",
  fontFamily: "inherit",
};

export default function ContactPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const defaultMessage = useMemo(() => {
    const subject = searchParams.get("subject");
    if (subject === "sponsor") {
      return "Hello, I would like to learn more about sponsoring an Astronomy Club initiative.";
    }

    return "";
  }, [searchParams]);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState(defaultMessage);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow: "member_contact",
          to: "admin",
          subject: "Contact Form Message",
          text: `${name.trim()}\n${email.trim()}\n\n${message.trim()}`,
          replyTo: email.trim(),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage =
          response.status === 401
            ? "Please sign in through the portal before sending a contact message."
            : typeof payload?.error === "string"
              ? payload.error
              : "Failed to send your message.";
        throw new Error(errorMessage);
      }

      setFeedback({ type: "success", message: "Your message has been sent." });
      setMessage(defaultMessage);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send your message.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1rem", minHeight: "80vh" }}>
      <AnimatedSection>
        <p className="section-title">Get In Touch</p>
        <h1 className="page-title">
          <span className="gradient-text">Contact</span>
        </h1>
        <p className="page-subtitle" style={{ maxWidth: "560px" }}>
          Send a message to the club team. Project collaboration and sponsorship CTAs now resolve here safely.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: "2rem",
            display: "grid",
            gap: "1rem",
            background: "rgba(15, 22, 40, 0.45)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
            padding: "1.5rem",
          }}
        >
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={inputStyle}
          />
          <textarea
            placeholder="Message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            rows={8}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          {feedback ? (
            <div
              style={{
                borderRadius: "10px",
                padding: "0.85rem 1rem",
                border:
                  feedback.type === "success"
                    ? "1px solid rgba(34,197,94,0.35)"
                    : "1px solid rgba(239,68,68,0.35)",
                background:
                  feedback.type === "success"
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(239,68,68,0.1)",
                color: feedback.type === "success" ? "#86efac" : "#fca5a5",
                fontSize: "0.9rem",
              }}
            >
              {feedback.message}
            </div>
          ) : null}

          <button type="submit" className="btn-primary" disabled={submitting} style={{ justifySelf: "start" }}>
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </AnimatedSection>
    </div>
  );
}
