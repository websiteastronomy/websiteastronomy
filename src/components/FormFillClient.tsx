"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getPublicFormAction, submitFormResponseAction, type FormContent } from "@/app/actions/files";

type Props = {
  formId: string;
};

type ExternalDetails = {
  name: string;
  email: string;
  phone: string;
};

export default function FormFillClient({ formId }: Props) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<{ id: string; title: string; config: FormContent } | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [details, setDetails] = useState<ExternalDetails>({ name: "", email: "", phone: "" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPublicFormAction(formId)
      .then((data) => {
        if (!active) return;
        setForm(data);
        setError(null);
      })
      .catch((reason: any) => {
        if (!active) return;
        setError(reason?.message || "Failed to load form.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [formId]);

  const showDetails = useMemo(() => {
    if (!form) return false;
    if (form.config.mode === "external") return true;
    if (form.config.mode === "hybrid" && !user) return true;
    return false;
  }, [form, user]);

  const requiresLogin = useMemo(() => {
    if (!form) return false;
    return form.config.mode === "internal" || form.config.settings.requireLogin;
  }, [form]);

  const handleSubmit = async () => {
    if (!form) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await submitFormResponseAction(form.id, {
        answers,
        externalDetails: showDetails ? details : undefined,
      });
      if (result.requiresPayment) {
        setSuccess(`Response saved. Payment is marked pending for Rs. ${result.amount}.`);
      } else {
        setSuccess("Response submitted successfully.");
      }
      setAnswers({});
      if (showDetails) {
        setDetails({ name: "", email: "", phone: "" });
      }
    } catch (reason: any) {
      setError(reason?.message || "Failed to submit form.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)" }}>Loading form...</div>;
  }

  if (!form) {
    return <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fca5a5" }}>{error || "Form not found."}</div>;
  }

  return (
    <div className="page-container" style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "820px" }}>
      <div style={{ background: "linear-gradient(180deg, rgba(16,22,40,0.98), rgba(9,14,28,0.98))", border: "1px solid var(--border-subtle)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ height: "10px", background: "linear-gradient(90deg, var(--gold), #60a5fa, #22c55e)" }} />
        <div style={{ padding: "2rem" }}>
          <p className="section-title" style={{ marginBottom: "0.75rem" }}>Form Submission</p>
          <h1 style={{ fontSize: "2rem", margin: 0, color: "var(--text-primary)" }}>{form.config.title || form.title}</h1>
          {form.config.description ? <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginTop: "0.85rem" }}>{form.config.description}</p> : null}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1rem" }}>
            <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "rgba(201,168,76,0.12)", color: "var(--gold)", fontSize: "0.75rem", textTransform: "capitalize" }}>{form.config.mode}</span>
            {form.config.settings.paymentEnabled ? <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "rgba(34,197,94,0.12)", color: "#86efac", fontSize: "0.75rem" }}>Payment placeholder: Rs. {form.config.settings.amount}</span> : null}
            {requiresLogin ? <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "rgba(59,130,246,0.12)", color: "#93c5fd", fontSize: "0.75rem" }}>Login required</span> : null}
          </div>
        </div>
      </div>

      {requiresLogin && !user ? (
        <div style={{ marginTop: "1.5rem", background: "rgba(15,22,40,0.75)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "1.5rem" }}>
          <h2 style={{ marginTop: 0, color: "var(--gold-light)" }}>Sign in required</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>This form accepts internal submissions only. Please sign in to continue.</p>
          <button onClick={() => void signInWithGoogle()} className="btn-primary">Continue with Google</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
          {showDetails ? (
            <div style={{ background: "rgba(15,22,40,0.8)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "1.25rem" }}>
              <h2 style={{ marginTop: 0, fontSize: "1.1rem", color: "var(--gold-light)" }}>Your Details</h2>
              <div style={{ display: "grid", gap: "0.85rem" }}>
                <input value={details.name} onChange={(event) => setDetails((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" style={{ padding: "0.9rem 1rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "10px", color: "white" }} />
                <input value={details.email} onChange={(event) => setDetails((current) => ({ ...current, email: event.target.value }))} placeholder="Email address" style={{ padding: "0.9rem 1rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "10px", color: "white" }} />
                <input value={details.phone} onChange={(event) => setDetails((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" style={{ padding: "0.9rem 1rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "10px", color: "white" }} />
              </div>
            </div>
          ) : user ? (
            <div style={{ background: "rgba(15,22,40,0.8)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "1rem 1.25rem", color: "var(--text-secondary)" }}>
              Submitting as <strong style={{ color: "var(--text-primary)" }}>{user.name || user.email}</strong>
            </div>
          ) : null}

          {form.config.fields.map((field, index) => (
            <div key={field.id} style={{ background: "rgba(15,22,40,0.88)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "1.35rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", marginBottom: "0.85rem" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-primary)" }}>{index + 1}. {field.label}</h3>
                {field.required ? <span style={{ color: "#fca5a5", fontSize: "0.85rem" }}>* Required</span> : null}
              </div>
              {field.type === "paragraph" ? (
                <textarea value={String(answers[field.id] || "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))} rows={5} style={{ width: "100%", padding: "0.95rem 1rem", background: "rgba(0,0,0,0.22)", border: "1px solid var(--border-subtle)", borderRadius: "10px", color: "white", resize: "vertical" }} />
              ) : field.type === "multiple_choice" ? (
                <div style={{ display: "grid", gap: "0.65rem" }}>
                  {field.options?.map((option) => (
                    <label key={option} style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.18)", cursor: "pointer" }}>
                      <input type="radio" name={field.id} checked={answers[field.id] === option} onChange={() => setAnswers((current) => ({ ...current, [field.id]: option }))} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : field.type === "checkbox" ? (
                <label style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.18)", cursor: "pointer" }}>
                  <input type="checkbox" checked={Boolean(answers[field.id])} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.checked }))} />
                  <span>Yes</span>
                </label>
              ) : (
                <input value={String(answers[field.id] || "")} onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))} style={{ width: "100%", padding: "0.95rem 1rem", background: "rgba(0,0,0,0.22)", border: "1px solid var(--border-subtle)", borderRadius: "10px", color: "white" }} />
              )}
            </div>
          ))}

          {error ? <div style={{ border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.1)", color: "#fca5a5", borderRadius: "12px", padding: "0.9rem 1rem" }}>{error}</div> : null}
          {success ? <div style={{ border: "1px solid rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.1)", color: "#86efac", borderRadius: "12px", padding: "0.9rem 1rem" }}>{success}</div> : null}

          <div style={{ position: "sticky", bottom: "1rem", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", padding: "1rem 1.25rem", background: "rgba(8,12,22,0.92)", border: "1px solid var(--border-subtle)", borderRadius: "16px", backdropFilter: "blur(8px)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              {form.config.settings.paymentEnabled ? `Submitting will create a pending payment placeholder for Rs. ${form.config.settings.amount}.` : "Review your answers before submitting."}
            </div>
            <button onClick={() => void handleSubmit()} className="btn-primary" disabled={submitting} style={{ opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Submitting..." : form.config.settings.paymentEnabled ? "Continue to Payment" : "Submit"}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Back to site</Link>
      </div>
    </div>
  );
}
