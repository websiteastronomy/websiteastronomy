"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import { getDocument } from "@/lib/db";

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMember] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<"none" | "going" | "interested">("none");

  useEffect(() => {
    if (!id) return;
    getDocument("events", id).then((data) => {
      setEvent(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "var(--gold)" }}>Loading event...</p></div>;
  }

  if (!event) {
    return (
      <div style={{ textAlign: "center", padding: "8rem 2rem", minHeight: "80vh" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Event Not Found</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>The event you are looking for does not exist or has been removed.</p>
        <Link href="/events" className="btn-secondary">← Back to Events</Link>
      </div>
    );
  }

  const isUpcoming = new Date(event.date) >= new Date();

  const formatDate = (dateString: string) => {
    const opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', opts);
  };

  const formatTime = (dateString: string) => {
    const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata', timeZoneName: 'short' };
    return new Date(dateString).toLocaleTimeString('en-US', opts);
  };

  return (
    <div style={{ paddingBottom: "6rem" }}>
      
      {/* ── 1. HEADER & BANNER ───────────────────────── */}
      <div style={{ width: "100%", height: "50vh", minHeight: "400px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
          <img src={event.bannerImage} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
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
              <span style={{ 
                color: isUpcoming ? '#22c55e' : 'var(--text-muted)', 
                background: isUpcoming ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
                padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" 
              }}>
                {isUpcoming ? 'upcoming' : 'completed'}
              </span>
              <span style={{ color: "var(--gold-light)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold" }}>
                {event.type}
              </span>
            </div>
            
            <h1 className="page-title" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", marginBottom: "1.5rem", textAlign: "left" }}>
              <span className="gradient-text">{event.title}</span>
            </h1>
            
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '1.5rem', color: "var(--text-primary)", fontSize: "1rem", alignItems: "center", background: "rgba(15,22,40,0.6)", backdropFilter: "blur(8px)", padding: "1rem 1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                 {formatDate(event.date)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1.5rem" }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                 {formatTime(event.date)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "1.5rem" }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                 {event.location}
              </span>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem", display: "grid", gridTemplateColumns: "1fr 340px", gap: "4rem", alignItems: "start" }}>
        
        {/* ── LEFT COLUMN ──────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
          
          {/* 2. DESCRIPTION */}
          <AnimatedSection>
            <h2 style={{ fontSize: "1.5rem", fontFamily: "'Cinzel', serif", marginBottom: "1.5rem", color: "var(--gold-light)" }}>About This Event</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.8, whiteSpace: "pre-line" }}>
              {event.fullDescription || event.description}
            </p>
          </AnimatedSection>

          {/* 4. MEDIA (ONLY IF PAST EVENT) */}
          {!isUpcoming && (
            <AnimatedSection delay={0.1}>
               <h2 style={{ fontSize: "1.5rem", fontFamily: "'Cinzel', serif", marginBottom: "1.5rem" }}>Event Gallery</h2>
               {event.media && event.media.length > 0 ? (
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                   {event.media.map((imgUrl: string, i: number) => (
                     <div key={i} style={{ borderRadius: "12px", overflow: "hidden", height: "180px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <img src={imgUrl} alt={`Gallery ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                     </div>
                   ))}
                 </div>
               ) : (
                 <div style={{ border: "1px dashed var(--border-subtle)", borderRadius: "12px", padding: "2rem", textAlign: "center", opacity: 0.6 }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No media uploaded for this past event.</p>
                 </div>
               )}
            </AnimatedSection>
          )}

        </div>

        {/* ── RIGHT COLUMN: SIDEBAR ──────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* 3. REGISTRATION MODULE (ONLY IF UPCOMING) */}
          {isUpcoming && (
            <AnimatedSection delay={0.1}>
              <div style={{ background: "rgba(201, 168, 76, 0.05)", border: "1px solid var(--gold-dark)", borderRadius: "16px", padding: "2rem", textAlign: "center" }}>
                <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem", color: "var(--gold-light)" }}>Secure Your Spot</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Registration is open to all students and faculty.</p>
                {event.registrationLink ? (
                  <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "block", width: "100%", fontSize: "1rem", padding: "0.8rem" }}>
                    Register Externally
                  </a>
                ) : (
                  <button className="btn-primary" style={{ display: "block", width: "100%", fontSize: "1rem", padding: "0.8rem" }}>
                    RSVP Internally
                  </button>
                )}
              </div>
            </AnimatedSection>
          )}

          {/* 5. MEMBER VIEW OVERLAY */}
          {isMember && (
            <AnimatedSection delay={0.2}>
              <div style={{ background: "rgba(15,22,40,0.6)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: "16px", padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gold)" }}>Member Internal</h3>
                </div>
                
                {isUpcoming && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.8rem" }}>Internal RSVP Sync:</p>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        onClick={() => setRsvpStatus("going")}
                        style={{ flex: 1, padding: "0.5rem", fontSize: "0.8rem", fontFamily: "inherit", borderRadius: "6px", cursor: "pointer", border: rsvpStatus === "going" ? "1px solid #22c55e" : "1px solid var(--border-subtle)", background: rsvpStatus === "going" ? "rgba(34,197,94,0.15)" : "transparent", color: rsvpStatus === "going" ? "#22c55e" : "var(--text-primary)", transition: "all 0.2s" }}>
                        ✓ Going
                      </button>
                      <button 
                         onClick={() => setRsvpStatus("interested")}
                        style={{ flex: 1, padding: "0.5rem", fontSize: "0.8rem", fontFamily: "inherit", borderRadius: "6px", cursor: "pointer", border: rsvpStatus === "interested" ? "1px solid #3b82f6" : "1px solid var(--border-subtle)", background: rsvpStatus === "interested" ? "rgba(59,130,246,0.15)" : "transparent", color: rsvpStatus === "interested" ? "#3b82f6" : "var(--text-primary)", transition: "all 0.2s" }}>
                        ★ Interested
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Coordination Notes:</p>
                  <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "6px", padding: "1rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                    {event.internalNotes ? (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{event.internalNotes}</p>
                    ) : (
                      <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic", margin: 0 }}>No internal notes attached.</p>
                    )}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          )}

        </div>
      </div>
    </div>
  );
}
