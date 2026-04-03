"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import AnimatedSection from "@/components/AnimatedSection";
import { loadSiteSettingsClient } from "@/data/siteSettingsStatic";

// Field definitions — admin will eventually control these via Firestore
const DEPARTMENTS = ["Computer Science", "Electronics & Communication", "Mechanical", "Information Science", "Civil", "Electrical", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const INTERESTS = ["Astrophotography", "Telescope Operations", "Rocketry", "Research & Writing", "Outreach Events", "Software & Data"];

interface FormData {
  name: string;
  email: string;
  rollNo: string;
  department: string;
  year: string;
  phone: string;
  interests: string[];
  reason: string;
  experience: string;
}

const defaultForm: FormData = {
  name: "", email: "", rollNo: "", department: "", year: "",
  phone: "", interests: [], reason: "", experience: "",
};

type Status = "idle" | "submitting" | "success" | "error";

export default function JoinPage() {
  const searchParams = useSearchParams();
  const [isRecruiting, setIsRecruiting] = useState(() => loadSiteSettingsClient().isRecruiting);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [status, setStatus] = useState<Status>("idle");
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const showClosedNotice = searchParams.get("closed") === "1" || !isRecruiting;

  useEffect(() => {
    const syncRecruitmentStatus = () => {
      setIsRecruiting(loadSiteSettingsClient().isRecruiting);
    };

    syncRecruitmentStatus();

    const handleFocus = () => syncRecruitmentStatus();
    const handleStorage = () => syncRecruitmentStatus();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const set = (key: keyof FormData, val: string | string[]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const validate = () => {
    const required: (keyof FormData)[] = ["name", "email", "rollNo", "department", "year", "reason"];
    return required.every((k) => String(form[k]).trim() !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      (["name","email","rollNo","department","year","reason"] as (keyof FormData)[]).map((k) => [k, true])
    ) as Partial<Record<keyof FormData, boolean>>;
    setTouched(allTouched);
    if (!validate()) return;

    setStatus("submitting");
    try {
      // 1. Send Application to Admin
      const adminRes = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow: "join_application_admin",
          to: "admin", // Replaced hardcoded email with alias
          subject: `New Membership Application: ${form.name}`,
          replyTo: form.email,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #c9a84c; border-radius: 12px; background: #0f1628; color: #fff;">
              <h2 style="color: #c9a84c;">New Application Received</h2>
              <p><strong>Name:</strong> ${form.name}</p>
              <p><strong>Email:</strong> ${form.email}</p>
              <p><strong>Roll No:</strong> ${form.rollNo}</p>
              <p><strong>Department:</strong> ${form.department} (${form.year})</p>
              <p><strong>Phone:</strong> ${form.phone || 'N/A'}</p>
              <p><strong>Interests:</strong> ${form.interests.join(", ")}</p>
              <p><strong>Reason for joining:</strong></p>
              <p style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">${form.reason}</p>
              <p><strong>Experience:</strong></p>
              <p style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">${form.experience || 'None listed'}</p>
              <hr style="border: 0.5px solid #c9a84c; margin: 20px 0;">
              <p style="font-size: 0.8rem; color: #888;">This email was automated through the club website.</p>
            </div>
          `,
        }),
      });
      if (!adminRes.ok) {
        throw new Error("Failed to notify admin");
      }

      // 2. Send Confirmation to User
      const confirmRes = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow: "join_application_confirmation",
          to: form.email,
          applicantEmail: form.email,
          subject: "Application Received - MVJCE Astronomy Club",
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #c9a84c; border-radius: 12px; background: #0f1628; color: #fff;">
              <h2 style="color: #c9a84c;">Hi ${form.name}!</h2>
              <p>Thanks for applying to the <strong>MVJCE Astronomy Club</strong>.</p>
              <p>We've received your application and our team will review it shortly. You can expect to hear from us within 2–3 days.</p>
              <p>Keep looking up!</p>
              <br>
              <p>Clear Skies,</p>
              <p><strong>MVJCE Astronomy Club Team</strong></p>
            </div>
          `,
        }),
      });
      if (!confirmRes.ok) {
        throw new Error("Failed to send confirmation");
      }

      setStatus("success");
    } catch (error) {
      console.error("Submission Error:", error);
      setStatus("error");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(15, 22, 40, 0.6)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "8px",
    padding: "0.85rem 1rem",
    color: "var(--text-primary)",
    fontSize: "0.95rem",
    fontFamily: "'Space Grotesk', sans-serif",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--gold)",
    fontWeight: 600,
    display: "block",
    marginBottom: "0.5rem",
  };

  const fieldErr = (key: keyof FormData) =>
    touched[key] && String(form[key]).trim() === "";

    return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6rem 2rem 4rem" }}>
      <div style={{ width: "100%", maxWidth: "720px" }}>

        {/* Header */}
        <AnimatedSection>
          <p className="section-title" style={{ textAlign: "center" }}>Membership Application</p>
          <h1 className="page-title"><span className="gradient-text">Join the Club</span></h1>
          {isRecruiting ? (
            <p className="page-subtitle">
              Open to all MVJCE students. Fill in the form below and our team will reach out within 2–3 days.
            </p>
          ) : (
             <p className="page-subtitle">
              Registrations are currently closed. Please come back again during the next recruitment window.
            </p>
          )}
        </AnimatedSection>

        {showClosedNotice && (
          <AnimatedSection delay={0.1}>
            <div style={{ padding: "3rem", textAlign: "center", background: "rgba(15,22,40,0.5)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>🔒</div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Registrations Closed</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Registrations are closed right now. Please come back again when the next recruitment window opens.</p>
            </div>
          </AnimatedSection>
        )}

        {/* Success state */}
        <AnimatePresence>
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ padding: "3rem", textAlign: "center", background: "rgba(15,22,40,0.5)", borderRadius: "16px", border: "1px solid rgba(201,168,76,0.2)", marginBottom: "2rem" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold-dark), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0c1222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </motion.div>
              <h2 style={{ fontSize: "1.8rem", fontFamily: "'Cinzel', serif", marginBottom: "0.75rem" }}>Application Received!</h2>
              <p style={{ color: "var(--text-secondary)", fontWeight: 300, lineHeight: 1.7, maxWidth: "420px", margin: "0 auto" }}>
                Thanks, <strong style={{ color: "var(--gold-light)" }}>{form.name}</strong>. We&apos;ll review your application and get back to you at <strong style={{ color: "var(--gold-light)" }}>{form.email}</strong> within 2–3 days.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {isRecruiting && status !== "success" && (
          <AnimatedSection delay={0.1}>
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Name + Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    style={{ ...inputStyle, borderColor: fieldErr("name") ? "rgba(220,50,50,0.5)" : undefined }}
                    placeholder="e.g. Shashank Reddy"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                  />
                  {fieldErr("name") && <p style={{ color: "rgba(220,100,80,0.9)", fontSize: "0.75rem", marginTop: "0.3rem" }}>Required</p>}
                </div>
                <div>
                  <label style={labelStyle}>College Email *</label>
                  <input
                    type="email"
                    style={{ ...inputStyle, borderColor: fieldErr("email") ? "rgba(220,50,50,0.5)" : undefined }}
                    placeholder="name@mvjce.edu.in"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                  />
                  {fieldErr("email") && <p style={{ color: "rgba(220,100,80,0.9)", fontSize: "0.75rem", marginTop: "0.3rem" }}>Required</p>}
                </div>
              </div>

              {/* Roll No + Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div>
                  <label style={labelStyle}>Roll Number *</label>
                  <input
                    style={{ ...inputStyle, borderColor: fieldErr("rollNo") ? "rgba(220,50,50,0.5)" : undefined }}
                    placeholder="e.g. 1MV22CS042"
                    value={form.rollNo}
                    onChange={(e) => set("rollNo", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, rollNo: true }))}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                  />
                  {fieldErr("rollNo") && <p style={{ color: "rgba(220,100,80,0.9)", fontSize: "0.75rem", marginTop: "0.3rem" }}>Required</p>}
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="tel"
                    style={inputStyle}
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
                  />
                </div>
              </div>

              {/* Department + Year */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div>
                  <label style={labelStyle}>Department *</label>
                  <select
                    style={{ ...inputStyle, borderColor: fieldErr("department") ? "rgba(220,50,50,0.5)" : undefined, cursor: "pointer" }}
                    value={form.department}
                    onChange={(e) => set("department", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, department: true }))}
                  >
                    <option value="" disabled>Select department</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {fieldErr("department") && <p style={{ color: "rgba(220,100,80,0.9)", fontSize: "0.75rem", marginTop: "0.3rem" }}>Required</p>}
                </div>
                <div>
                  <label style={labelStyle}>Year of Study *</label>
                  <select
                    style={{ ...inputStyle, borderColor: fieldErr("year") ? "rgba(220,50,50,0.5)" : undefined, cursor: "pointer" }}
                    value={form.year}
                    onChange={(e) => set("year", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, year: true }))}
                  >
                    <option value="" disabled>Select year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {fieldErr("year") && <p style={{ color: "rgba(220,100,80,0.9)", fontSize: "0.75rem", marginTop: "0.3rem" }}>Required</p>}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label style={labelStyle}>Areas of Interest</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                  {INTERESTS.map((interest) => {
                    const selected = form.interests.includes(interest);
                    return (
                      <motion.button
                        key={interest} type="button"
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        onClick={() => toggleInterest(interest)}
                        style={{
                          padding: "0.5rem 1rem", borderRadius: "20px", fontSize: "0.8rem", cursor: "pointer",
                          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500,
                          background: selected ? "linear-gradient(135deg, var(--gold-dark), var(--gold))" : "rgba(15,22,40,0.6)",
                          border: selected ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
                          color: selected ? "#0c1222" : "var(--text-secondary)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {interest}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={labelStyle}>Why do you want to join? *</label>
                <textarea
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", borderColor: fieldErr("reason") ? "rgba(220,50,50,0.5)" : undefined }}
                  placeholder="Tell us what excites you about astronomy and what you hope to gain from the club..."
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, reason: true }))}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                />
                {fieldErr("reason") && <p style={{ color: "rgba(220,100,80,0.9)", fontSize: "0.75rem", marginTop: "0.3rem" }}>Required</p>}
              </div>

              {/* Prior Experience */}
              <div>
                <label style={labelStyle}>Any prior astronomy / science experience? <span style={{ color: "var(--text-muted)", textTransform: "none", fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Projects, telescopes you've used, courses, competitions — anything relevant"
                  value={form.experience}
                  onChange={(e) => set("experience", e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
                />
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={status === "submitting"}
                whileHover={{ scale: status === "submitting" ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%", padding: "1rem", borderRadius: "8px", border: "none", cursor: status === "submitting" ? "not-allowed" : "pointer",
                  background: status === "submitting" ? "rgba(201,168,76,0.3)" : "linear-gradient(135deg, var(--gold), var(--gold-dark))",
                  color: status === "submitting" ? "var(--text-muted)" : "#0c1222",
                  font: "600 0.9rem/1 'Space Grotesk', sans-serif",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  transition: "all 0.3s ease",
                }}
              >
                {status === "submitting" ? "Submitting…" : "Submit Application"}
              </motion.button>

              {status === "error" && (
                <p style={{ textAlign: "center", color: "rgba(220,100,80,0.9)", fontSize: "0.85rem" }}>
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
}
