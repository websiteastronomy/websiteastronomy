"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import { getDocument } from "@/lib/db";

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [proj, setProj] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDocument("projects", id).then((data) => {
      setProj(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // Mock flag for Layer 1 to simulate a logged-in team member viewing the page
  const [isTeamMember] = useState(true);
  const [showAddUpdate, setShowAddUpdate] = useState(false);

  
  // Mock form state
  const [updateForm, setUpdateForm] = useState({ title: "", description: "" });

  if (loading) {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "var(--gold)" }}>Loading project...</p></div>;
  }

  if (!proj) {
    return (
      <div style={{ textAlign: "center", padding: "8rem 2rem", minHeight: "80vh" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Project Not Found</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>The project you are looking for does not exist or has been removed.</p>
        <Link href="/projects" className="btn-secondary">← Back to Projects</Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Ongoing': return '#22c55e';
      case 'Completed': return '#3b82f6';
      case 'Planned': return '#a855f7';
      default: return 'var(--gold)';
    }
  };
  const getStatusBg = (status: string) => {
    switch(status) {
      case 'Ongoing': return 'rgba(34, 197, 94, 0.15)'; 
      case 'Completed': return 'rgba(59, 130, 246, 0.15)'; 
      case 'Planned': return 'rgba(168, 85, 247, 0.15)'; 
      default: return 'rgba(201, 168, 76, 0.15)';
    }
  };

  return (
    <div style={{ paddingBottom: "6rem" }}>
      
      {/* ── 1. HEADER & COVER ───────────────────────── */}
      <div style={{ width: "100%", height: "50vh", minHeight: "350px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
          <img src={proj.coverImage} alt={proj.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "70%", background: "linear-gradient(to top, rgba(8,12,22,1) 0%, rgba(8,12,22,0.8) 40%, transparent 100%)" }} />
        </div>
        
        <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
          <motion.button 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            style={{ position: "absolute", top: "2rem", background: "rgba(15,22,40,0.6)", backdropFilter: "blur(8px)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            ← Back
          </motion.button>
          
          <AnimatedSection>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ color: getStatusColor(proj.status), background: getStatusBg(proj.status), padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {proj.status}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Last updated {proj.lastUpdated}
              </span>
              {proj.isFeatured && (
                <span style={{ color: "#000", background: "var(--gold)", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>Featured</span>
              )}
            </div>
            
            <h1 className="page-title" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "0.5rem", textAlign: "left" }}>
              <span className="gradient-text">{proj.title}</span>
            </h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
              {(proj.tags || []).map((t: string) => (
                <span key={t} style={{ color: 'var(--text-primary)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.08)', backdropFilter: "blur(4px)", padding: '0.3rem 0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {t}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem", display: "grid", gridTemplateColumns: "1fr 300px", gap: "3rem", alignItems: "start" }}>
        
        {/* ── LEFT COLUMN: INFO & UPDATES ──────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
          
          {/* 2. DESCRIPTION */}
          <AnimatedSection>
            <h2 style={{ fontSize: "1.4rem", fontFamily: "'Cinzel', serif", marginBottom: "1rem", color: "var(--gold-light)" }}>Mission Objective</h2>
            <p style={{ fontSize: "1.1rem", lineHeight: 1.7, fontWeight: 300, marginBottom: "2rem", borderLeft: "3px solid var(--gold)", paddingLeft: "1.5rem", background: "linear-gradient(90deg, rgba(201,168,76,0.05), transparent)", padding: "1rem 1.5rem" }}>
              {proj.objective}
            </p>
            
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.8rem" }}>Project Details</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.8 }}>
              {proj.fullDescription}
            </p>
          </AnimatedSection>

          {/* 5. UPDATES (LOGS) */}
          <AnimatedSection delay={0.1}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.4rem", fontFamily: "'Cinzel', serif" }}>Chronological Log</h2>
              
              {/* MEMBER VIEW: Add Update Toggle */}
              {isTeamMember && (
                <button 
                  onClick={() => setShowAddUpdate(!showAddUpdate)}
                  className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                >
                  {showAddUpdate ? "Cancel" : "+ Add Update"}
                </button>
              )}
            </div>

            {/* Simulated Add Update Form */}
            {isTeamMember && showAddUpdate && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                style={{ background: "rgba(15,22,40,0.6)", border: "1px dashed var(--gold)", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}
              >
                <h4 style={{ color: "var(--gold-light)", marginBottom: "1rem", fontSize: "0.9rem", textTransform: "uppercase" }}>Post New Update</h4>
                <input placeholder="Update Title" value={updateForm.title} onChange={e => setUpdateForm({...updateForm, title: e.target.value})} style={{ width: "100%", padding: "0.8rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", marginBottom: "1rem", fontFamily: "inherit" }} />
                <textarea rows={4} placeholder="Describe the progress..." value={updateForm.description} onChange={e => setUpdateForm({...updateForm, description: e.target.value})} style={{ width: "100%", padding: "0.8rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", marginBottom: "1rem", fontFamily: "inherit", resize: "vertical" }} />
                <button className="btn-secondary" style={{ padding: "0.5rem 1.5rem", fontSize: "0.8rem", width: "100%" }} onClick={() => setShowAddUpdate(false)}>Submit Log (Mock)</button>
              </motion.div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", position: "relative" }}>
               {/* Vertical Timeline Line */}
               {(proj.updates || []).length > 0 && (
                 <div style={{ position: "absolute", top: "10px", bottom: "10px", left: "14px", width: "2px", background: "var(--border-subtle)", zIndex: 0 }} />
               )}

               {(proj.updates || []).length === 0 ? (
                 <p style={{ color: "var(--text-muted)", fontStyle: "italic", marginLeft: "2rem" }}>Work in progress... No logs posted yet.</p>
               ) : (
                 (proj.updates || []).map((update: any, idx: number) => (
                   <motion.div key={update.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} style={{ position: "relative", zIndex: 1, paddingLeft: "3rem" }}>
                     {/* Timeline Node */}
                     <div style={{ position: "absolute", left: "6px", top: "6px", width: "18px", height: "18px", borderRadius: "50%", background: "var(--gold)", border: "4px solid rgba(8,12,22,1)" }} />
                     
                     <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
                        <span style={{ display: "block", color: "var(--gold)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{update.date}</span>
                        <h4 style={{ fontSize: "1.1rem", marginBottom: "0.8rem" }}>{update.title}</h4>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{update.description}</p>
                        
                        {update.images && update.images.length > 0 && (
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                            {update.images.map((img: string, i: number) => (
                              <img key={i} src={img} alt="Update" style={{ height: "120px", width: "auto", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.05)" }} />
                            ))}
                          </div>
                        )}
                     </div>
                   </motion.div>
                 ))
               )}
            </div>
          </AnimatedSection>
        </div>

        {/* ── RIGHT COLUMN: SIDEBAR ──────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* EXTRA: Progress */}
          <AnimatedSection>
            <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Est. Progress</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--gold-light)" }}>{proj.progress}%</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${proj.progress}%`, height: "100%", background: "linear-gradient(90deg, var(--gold-dark), var(--gold))", borderRadius: "3px", transition: "width 1s ease" }} />
              </div>
            </div>
          </AnimatedSection>

          {/* 3. TEAM */}
          <AnimatedSection delay={0.1}>
            <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "1.2rem", color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>Project Team</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(proj.team || []).map((member: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--gold-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: "0.8rem" }}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.9rem", margin: 0 }}>{member.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* 6. MEDIA & 7. DOCUMENTS (Placeholders) */}
          <AnimatedSection delay={0.2}>
            <div style={{ border: "1px dashed var(--border-subtle)", borderRadius: "12px", padding: "1.5rem", textAlign: "center", opacity: 0.6 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 0.5rem" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <h3 style={{ fontSize: "0.9rem", marginBottom: "0.3rem" }}>Documents & Media</h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No files attached to this project.</p>
            </div>
          </AnimatedSection>

        </div>
      </div>
    </div>
  );
}
