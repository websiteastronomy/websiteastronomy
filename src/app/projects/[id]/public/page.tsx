"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getDocument } from "@/lib/db";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TeamMember { name: string; role: string; image?: string; }
interface ProjectUpdate { title: string; description?: string; typeTag?: string; date?: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  Ongoing: "#22c55e", Completed: "#3b82f6", Planned: "#a855f7",
};
const STATUS_BG: Record<string, string> = {
  Ongoing: "rgba(34,197,94,0.15)", Completed: "rgba(59,130,246,0.15)", Planned: "rgba(168,85,247,0.15)",
};

function Pill({ label, color = "var(--gold)", bg = "rgba(201,168,76,0.12)" }: { label: string; color?: string; bg?: string }) {
  return (
    <span style={{ display: "inline-block", padding: "0.25rem 0.7rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", color, background: bg, border: `1px solid ${color}44`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "rgba(15,22,40,0.5)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "2rem", ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gold)", marginBottom: "0.8rem", fontWeight: 700 }}>
      {text}
    </p>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProjectPublicPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [proj, setProj] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDocument("projects", id)
      .then((data) => { setProj(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--gold)" }}>Loading project...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!proj || !proj.isPublished) {
    return (
      <div style={{ textAlign: "center", padding: "8rem 2rem", minHeight: "80vh" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Project Not Found</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>This project doesn&apos;t exist or isn&apos;t public yet.</p>
        <Link href="/projects" className="btn-secondary">← Back to Projects</Link>
      </div>
    );
  }

  /* ── Derived data ── */
  const teamMembers: TeamMember[] = proj.team || [];
  const allUpdates: ProjectUpdate[] = proj.updates || [];
  const achievements = allUpdates.filter(u => u.typeTag === "Success" || u.typeTag === "Milestone");
  const futurePlans = allUpdates.filter(u => u.typeTag === "Update" || !u.typeTag);
  const lead = teamMembers.find(m => m.role?.toLowerCase().includes("lead")) || teamMembers[0];
  const contributors = teamMembers.filter(m => m !== lead).slice(0, 2);
  const displayTeam = [lead, ...contributors].filter(Boolean) as TeamMember[];
  const statusColor = STATUS_COLOR[proj.status] || "var(--gold)";
  const statusBg = STATUS_BG[proj.status] || "rgba(201,168,76,0.15)";

  return (
    <div style={{ paddingBottom: "8rem" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        .pub-cta-btn {
          padding: 0.85rem 2rem; border-radius: 10px; font-size: 0.9rem; font-weight: 700;
          cursor: pointer; font-family: inherit; transition: all 0.25s ease; letter-spacing: 0.03em;
        }
        .pub-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .achievement-card:hover { border-color: rgba(201,168,76,0.4) !important; transform: translateY(-2px); }
        .tag-chip:hover { background: rgba(201,168,76,0.15) !important; color: var(--gold-light) !important; }
      `}</style>

      {/* ── 1. HERO ── */}
      <div style={{ width: "100%", height: "65vh", minHeight: "420px", position: "relative", overflow: "hidden" }}>
        <img src={proj.coverImage} alt={proj.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,12,22,1) 0%, rgba(8,12,22,0.65) 50%, rgba(8,12,22,0.25) 100%)" }} />

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/projects")}
          style={{ position: "absolute", top: "2rem", left: "2rem", background: "rgba(15,22,40,0.6)", backdropFilter: "blur(8px)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem" }}
        >← All Projects</motion.button>

        {/* Hero content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, maxWidth: "1100px", margin: "0 auto", padding: "3rem 2rem" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {/* Badges row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
              <span className="status-pulse" style={{ color: statusColor, background: statusBg, padding: "0.3rem 0.9rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ● {proj.status}
              </span>
              {proj.isFeatured && <span style={{ color: "#000", background: "var(--gold)", padding: "0.25rem 0.7rem", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>⭐ Featured</span>}
            </div>

            {/* Title */}
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontFamily: "'Cinzel', serif", marginBottom: "1rem", letterSpacing: "0.04em", lineHeight: 1.1 }}>
              <span className="gradient-text">{proj.title}</span>
            </h1>

            {/* One-line mission statement */}
            <p style={{ fontSize: "clamp(0.95rem, 2vw, 1.15rem)", color: "var(--text-secondary)", maxWidth: "680px", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              {proj.objective || proj.description}
            </p>

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "2rem" }}>
              {(proj.tags || []).map((t: string) => (
                <span key={t} className="tag-chip" style={{ color: "var(--text-secondary)", fontSize: "0.78rem", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(4px)", padding: "0.3rem 0.8rem", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", cursor: "default", transition: "all 0.2s" }}>{t}</span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href="/join" className="pub-cta-btn btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                🚀 Join the Club
              </Link>
              {proj.githubUrl && (
                <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="pub-cta-btn" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", textDecoration: "none", display: "inline-block" }}>
                  ⭐ View on GitHub
                </a>
              )}
              <Link href="/contact" className="pub-cta-btn" style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.4)", color: "var(--gold)", textDecoration: "none", display: "inline-block" }}>
                🤝 Collaborate
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 2rem", display: "grid", gridTemplateColumns: "1fr 340px", gap: "2.5rem", alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* 2. Mission Objective */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <SectionCard>
              <SectionLabel text="Mission Objective" />
              <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--text-secondary)", borderLeft: "3px solid var(--gold)", paddingLeft: "1.2rem" }}>
                {proj.objective || proj.fullDescription || proj.description}
              </p>
            </SectionCard>
          </motion.div>

          {/* 3. Key Achievements */}
          {achievements.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <SectionCard>
                <SectionLabel text="Key Achievements" />
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {achievements.map((a, i) => {
                    const isSuccess = a.typeTag === "Success";
                    const tagColor = isSuccess ? "#22c55e" : "var(--gold)";
                    return (
                      <motion.div
                        key={i}
                        className="achievement-card"
                        whileHover={{ y: -2 }}
                        style={{ display: "flex", gap: "1rem", padding: "1rem 1.2rem", background: "rgba(0,0,0,0.2)", border: `1px solid ${tagColor}33`, borderRadius: "10px", transition: "all 0.2s" }}
                      >
                        <div style={{ fontSize: "1.4rem", flexShrink: 0, marginTop: "0.1rem" }}>{isSuccess ? "✅" : "🏆"}</div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.3rem", color: tagColor }}>{a.title}</p>
                          {a.description && <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{a.description}</p>}
                          {a.date && <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>📅 {a.date}</p>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* 4. Project Overview */}
          {(proj.fullDescription || proj.description) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <SectionCard>
                <SectionLabel text="Project Overview" />
                <p style={{ fontSize: "0.95rem", lineHeight: 1.8, color: "var(--text-secondary)" }}>
                  {proj.fullDescription || proj.description}
                </p>
              </SectionCard>
            </motion.div>
          )}

          {/* 5. Tech Stack / Domains */}
          {(proj.tags || []).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <SectionCard>
                <SectionLabel text="Tech Stack & Domains" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                  {proj.tags.map((tag: string) => (
                    <Pill key={tag} label={tag} />
                  ))}
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* 8. Impact / Purpose */}
          {proj.objective && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <SectionCard style={{ background: "rgba(201,168,76,0.05)", borderColor: "rgba(201,168,76,0.2)" }}>
                <SectionLabel text="Impact & Purpose" />
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ fontSize: "2rem", flexShrink: 0, animation: "float 3s ease-in-out infinite" }}>🌌</div>
                  <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--text-secondary)", fontStyle: "italic" }}>
                    &quot;{proj.objective}&quot;
                  </p>
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* 9. Future Plans */}
          {futurePlans.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <SectionCard>
                <SectionLabel text="Future Plans & Roadmap" />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {futurePlans.slice(0, 4).map((plan, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.8rem", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "8px" }}>
                      <span style={{ fontSize: "1rem", flexShrink: 0 }}>🔭</span>
                      <div>
                        <p style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.2rem" }}>{plan.title}</p>
                        {plan.description && <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{plan.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* 10. Call to Action — Bottom Banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <div style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(168,85,247,0.08) 100%)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "16px", padding: "2.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gold)", marginBottom: "0.75rem", fontWeight: 700 }}>Get Involved</p>
              <h2 style={{ fontSize: "clamp(1.3rem, 3vw, 1.9rem)", fontFamily: "'Cinzel', serif", marginBottom: "0.75rem" }}>
                Want to be part of something extraordinary?
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "480px", margin: "0 auto 1.75rem", lineHeight: 1.7 }}>
                Join our team, collaborate on active projects, or support our mission as a sponsor. Every contribution helps us reach the stars.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/join" className="pub-cta-btn btn-primary" style={{ textDecoration: "none" }}>🚀 Join the Club</Link>
                <Link href="/contact" className="pub-cta-btn" style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.4)", color: "var(--gold)", textDecoration: "none" }}>💬 Collaborate</Link>
                <Link href="/contact?subject=sponsor" className="pub-cta-btn" style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", textDecoration: "none" }}>💎 Sponsor</Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "sticky", top: "5rem" }}>

          {/* Progress */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <SectionCard>
              <SectionLabel text="Project Progress" />
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Completion</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--gold-light)" }}>{proj.progress ?? 0}%</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${proj.progress ?? 0}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                    style={{ height: "100%", background: "linear-gradient(90deg, var(--gold-dark), var(--gold))", borderRadius: "3px" }}
                  />
                </div>
              </div>
              {[
                { icon: "📅", label: "Deadline", value: proj.endDate || "TBD" },
                { icon: "🚀", label: "Started", value: proj.startDate || "—" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: "0.82rem", fontWeight: 500, margin: 0 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </SectionCard>
          </motion.div>

          {/* 6. Team (limited) */}
          {displayTeam.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <SectionCard>
                <SectionLabel text="Core Team" />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                  {displayTeam.map((member, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: i === 0 ? "var(--gold-dark)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", color: i === 0 ? "#000" : "var(--text-secondary)", flexShrink: 0, border: i === 0 ? "2px solid var(--gold)" : "1px solid var(--border-subtle)", overflow: "hidden" }}>
                        {member.image ? <img src={member.image} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : member.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: "0.85rem", margin: 0, fontWeight: 600 }}>{member.name}</p>
                        {i === 0 && <p style={{ fontSize: "0.65rem", color: "var(--gold)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Project Lead</p>}
                      </div>
                    </div>
                  ))}
                  {teamMembers.length > displayTeam.length && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      + {teamMembers.length - displayTeam.length} more members
                    </p>
                  )}
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* GitHub Link */}
          {proj.githubUrl && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(15,22,40,0.5)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1rem 1.25rem", color: "var(--text-secondary)", transition: "all 0.2s ease", textDecoration: "none" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)"; (e.currentTarget as HTMLElement).style.color = "var(--gold-light)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" /></svg>
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>View on GitHub</span>
              </a>
            </motion.div>
          )}

          {/* Member access CTA */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <div style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", marginBottom: "0.5rem", fontWeight: 700 }}>🔐 Member Access</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1rem" }}>Sign in to view the full task board, files, and team discussion.</p>
              <Link href="/login" style={{ display: "block", padding: "0.6rem 1rem", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.35)", borderRadius: "8px", color: "#a855f7", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600, transition: "all 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(168,85,247,0.25)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(168,85,247,0.15)")}
              >
                Sign In →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
