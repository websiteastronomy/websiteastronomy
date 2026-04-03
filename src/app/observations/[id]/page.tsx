"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import { getSingleObservationAction, reportObservationAction } from "@/app/actions/observations-engine";

export default function ObservationDetail() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [obs, setObs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getSingleObservationAction(id).then((data) => {
      setObs(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleReport = async () => {
    const reason = prompt("Please provide a reason for reporting this observation:");
    if (!reason) return;

    setIsReporting(true);
    try {
      const res = await reportObservationAction(id, reason);
      alert(res.flagged 
        ? "This observation has been flagged for immediate moderator review." 
        : "Thank you for your report. Our team will look into it."
      );
      if (res.flagged) router.push("/observations");
    } catch (err) {
      alert("Failed to send report.");
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "var(--gold)" }}>Loading observation...</p></div>;
  }

  if (!obs || (obs.status !== 'Published' && !obs.isApproved)) { // isApproved for backward compatibility if any
    return (
      <div style={{ textAlign: "center", padding: "8rem 2rem", minHeight: "80vh" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Observation Not Found</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>This observation may have been removed or is pending administrator approval.</p>
        <Link href="/observations" className="btn-secondary">← Back to Archive</Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', opts);
  };

  const categoryFormats: Record<string, { label: string, color: string, bg: string, icon: string }> = {
    Lunar: { label: "Lunar", color: "#f1f5f9", bg: "rgba(241,245,249,0.1)", icon: "🌙" },
    Planetary: { label: "Planetary", color: "#fb923c", bg: "rgba(251,146,60,0.1)", icon: "🪐" },
    "Deep Sky": { label: "Deep Sky", color: "#818cf8", bg: "rgba(129,140,248,0.1)", icon: "🌌" },
    Solar: { label: "Solar", color: "#facc15", bg: "rgba(250,204,21,0.1)", icon: "☀️" },
    "Widefield / Milky Way": { label: "Widefield", color: "#c084fc", bg: "rgba(192,132,252,0.1)", icon: "✨" }
  };

  const cat = categoryFormats[obs.category] || { label: obs.category, color: "#fff", bg: "rgba(255,255,255,0.1)", icon: "🔭" };

  return (
    <div style={{ paddingBottom: "6rem" }}>
      
      {/* ── MASSIVE IMAGE VIEWER (MAIN FOCUS) ── */}
      <div style={{ width: "100%", height: "70vh", minHeight: "500px", position: "relative", backgroundColor: "#000", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <img 
          src={obs.imageCompressedUrl || obs.imageOriginalUrl} 
          alt={obs.title} 
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", zIndex: 2 }} 
        />
        
        {/* Blurred Background for ambiance */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1, overflow: "hidden", opacity: 0.3 }}>
           <img src={obs.imageCompressedUrl || obs.imageOriginalUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px)" }} />
        </div>

        {/* Action Buttons Overlay */}
        <div style={{ position: "absolute", top: "2rem", left: "2rem", zIndex: 10, display: "flex", gap: "1rem" }}>
          <motion.button 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            style={{ background: "rgba(15,22,40,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}
          >
            ← Back
          </motion.button>
        </div>

        {obs.imageOriginalUrl && (
          <div style={{ position: "absolute", bottom: "2rem", right: "2rem", zIndex: 10 }}>
            <a href={obs.imageOriginalUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ backdropFilter: "blur(8px)", background: "rgba(15,22,40,0.6)", padding: "0.5rem 1rem", fontSize: "0.8rem" }}>
              View Original Resolution ↗
            </a>
          </div>
        )}
      </div>

      {/* ── CONTENT GRID ── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "5rem", alignItems: "start" }}>
        
        {/* ── LEFT COLUMN (STORY & DETAILS) ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          
          <AnimatedSection>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
               <span style={{ fontSize: "0.85rem", padding: "0.4rem 1rem", borderRadius: "20px", background: cat.bg, color: cat.color, border: `1px solid ${cat.color}40`, fontWeight: "bold" }}>
                  {cat.icon} {cat.label}
               </span>
               {obs.status !== 'Published' && (
                  <span style={{ fontSize: "0.85rem", padding: "0.4rem 1rem", borderRadius: "20px", background: "rgba(251,146,60,0.1)", color: "#fb923c", border: `1px solid rgba(251,146,60,0.4)`, fontWeight: "bold" }}>
                    ⚠️ {obs.status.replace('_', ' ')}
                  </span>
               )}
            </div>
            
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", marginBottom: "1rem", lineHeight: 1.1, fontFamily: "'Cinzel', serif" }}>
              {obs.title}
            </h1>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", color: "var(--text-secondary)" }}>
              <p style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Captured {formatDate(obs.capturedAt)}
              </p>
              <p style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Observer ID: <strong style={{ color: "var(--text-primary)" }}>{obs.observerId.slice(0,8)}</strong>
              </p>
              <p style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Location: {obs.location}
              </p>
              <p style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Target: <strong style={{ color: "var(--text-primary)" }}>{obs.celestialTarget}</strong>
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h3 style={{ fontSize: "1.3rem", color: "var(--gold-light)", marginBottom: "1rem", fontFamily: "'Cinzel', serif" }}>Observation Description</h3>
            <div style={{ background: "rgba(15,22,40,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "2rem" }}>
              <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: "var(--text-primary)", whiteSpace: "pre-line", margin: 0 }}>
                {obs.description || "No further description provided."}
              </p>
            </div>
          </AnimatedSection>

        </div>

        {/* ── RIGHT COLUMN (TECHNICAL SETTINGS) ── */}
        <AnimatedSection delay={0.2}>
           <div style={{ position: "sticky", top: "100px", background: "rgba(15,22,40,0.6)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "2rem", overflow: "hidden" }}>
             
             {/* Glow Accent */}
             <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, var(--gold-dark), var(--gold-light))" }} />

             <h3 style={{ fontSize: "1.2rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Technical Data
             </h3>

             <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "1.5rem" }}>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Equipment</span>
                  <strong style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>{obs.equipment || "Standard Setup"}</strong>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "1.5rem" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Exposure</span>
                    <strong style={{ fontSize: "1.05rem", color: "var(--gold-light)" }}>{obs.exposureTime || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>ISO/Gain</span>
                    <strong style={{ fontSize: "1.05rem", color: "var(--gold-light)" }}>{obs.iso || "N/A"}</strong>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "1.5rem" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Focal Length</span>
                    <strong style={{ fontSize: "1.05rem", color: "var(--gold-light)" }}>{obs.focalLength || "N/A"}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Bortle Scale</span>
                    <strong style={{ fontSize: "1.05rem", color: "var(--gold-light)" }}>{obs.bortleScale ? `Class ${obs.bortleScale}` : "N/A"}</strong>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "1.5rem" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Frames</span>
                    <strong style={{ fontSize: "1.05rem", color: "var(--gold-light)" }}>{obs.framesCount || "1"}</strong>
                  </div>
                  <div>
                     <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Software</span>
                     <strong style={{ fontSize: "1.05rem", color: "var(--gold-light)" }}>{obs.processingSoftware || "Untracked"}</strong>
                  </div>
                </div>

                {obs.filtersUsed && (
                  <div>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Filters</span>
                    <strong style={{ fontSize: "1.05rem", color: "var(--gold-light)" }}>{obs.filtersUsed}</strong>
                  </div>
                )}

             </div>

             <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <button 
                  className="btn-secondary" 
                  onClick={handleReport}
                  disabled={isReporting}
                  style={{ width: "100%", fontSize: "0.85rem", borderColor: "rgba(239, 68, 68, 0.4)", color: "#fca5a5" }}
                >
                  {isReporting ? "Reporting..." : "Report Problem"}
                </button>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "center" }}>
                   v{obs.versionNumber} · ID: {obs.id.slice(0,12).toUpperCase()}
                </p>
             </div>
           </div>
        </AnimatedSection>
        
      </div>
    </div>
  );
}
