"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import { getDocument } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, getEventStats, registerForEvent, applyForVolunteer, getEventParticipants } from "@/app/actions/events";

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';

  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Dynamic State
  const [profile, setProfile] = useState<{ status: string, roleName: string, canManageEvents: boolean } | null>(null);
  const [stats, setStats] = useState({ totalRegistrations: 0, volunteers: 0, backupVolunteers: 0, userRegistered: false, userVolunteered: false });
  const [participants, setParticipants] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Public Registration State
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [showParticipantModal, setShowParticipantModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDocument("events", id).then((data) => {
      setEvent(data);
    }).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (event && user) {
      Promise.all([
        getUserProfile(),
        getEventStats(id),
        getEventParticipants(id) // Only returns data if core/admin
      ]).then(([prof, st, parts]) => {
        if (prof) setProfile(prof);
        if (st) setStats(st);
        if (parts) setParticipants(parts);
        setLoading(false);
      });
    } else if (event) {
      getEventStats(id).then(st => {
        setStats({ ...st, userVolunteered: st.userVolunteered || false });
        setLoading(false);
      });
    }
  }, [event, user, id]);

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

  // Access check
  if (!event.isPublic && !user) {
    return (
      <div style={{ textAlign: "center", padding: "8rem 2rem", minHeight: "80vh" }}>
        <div style={{ color: "#ef4444", fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Members Only</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>You must be logged in to view this private event.</p>
        <Link href="/admin" className="btn-primary">Login to Continue</Link>
      </div>
    );
  }

  const isOngoingOrUpcoming = event.status === "upcoming" || event.status === "ongoing";

  const formatDate = (dateString: string) => {
    const opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', opts);
  };

  const formatTime = (dateString: string) => {
    const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata', timeZoneName: 'short' };
    return new Date(dateString).toLocaleTimeString('en-US', opts);
  };

  const handleRegister = async () => {
    setIsProcessing(true);
    const res = await registerForEvent(id, guestName, guestEmail);
    setIsProcessing(false);
    
    if (res.success) {
      alert("Registration Successful!");
      const st = await getEventStats(id);
      setStats({ ...st, userVolunteered: st.userVolunteered || false });
      if (profile?.canManageEvents) {
        getEventParticipants(id).then(setParticipants);
      }
    } else {
      alert("Registration failed: " + res.error);
    }
  };

  const handleVolunteer = async () => {
    setIsProcessing(true);
    const res = await applyForVolunteer(id);
    setIsProcessing(false);
    
    if (res.success) {
      alert(res.message);
      const st = await getEventStats(id);
      setStats({ ...st, userVolunteered: st.userVolunteered || false });
      if (profile?.canManageEvents) {
        getEventParticipants(id).then(setParticipants);
      }
    } else {
      alert("Volunteer application failed: " + res.error);
    }
  };

  return (
    <div style={{ paddingBottom: "6rem" }}>
      
      {/* ── 1. HEADER & BANNER ───────────────────────── */}
      <div style={{ width: "100%", height: "50vh", minHeight: "400px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}>
          <img src={event.bannerImage || "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80"} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
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
                color: event.status === 'completed' ? 'var(--text-muted)' : '#22c55e', 
                background: event.status === 'completed' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(34, 197, 94, 0.15)', 
                padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" 
              }}>
                {event.status || 'upcoming'}
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
          
          <AnimatedSection>
            <h2 style={{ fontSize: "1.5rem", fontFamily: "'Cinzel', serif", marginBottom: "1.5rem", color: "var(--gold-light)" }}>About This Event</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.8, whiteSpace: "pre-line" }}>
              {event.fullDescription || event.description}
            </p>
          </AnimatedSection>

          {/* MEDIA (ONLY IF PAST EVENT) */}
          {event.status === "completed" && (
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
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No media uploaded for this event.</p>
                 </div>
               )}
            </AnimatedSection>
          )}

        </div>

        {/* ── RIGHT COLUMN: SIDEBAR ──────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* REGISTRATION MODULE */}
          <AnimatedSection delay={0.1}>
            <div style={{ background: "rgba(15, 22, 40, 0.4)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "2rem", textAlign: "center" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "1rem" }}>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Registered</p>
                  <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text-primary)" }}>{stats.totalRegistrations} <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "normal" }}>/ {event.maxParticipants || 50}</span></p>
                </div>
                {event.enableVolunteer && (
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Volunteers</p>
                    <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--gold)" }}>{stats.volunteers} <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "normal" }}>/ {event.volunteerLimit || 0}</span></p>
                  </div>
                )}
              </div>

              {event.status === "completed" ? (
                <>
                  <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>Event Completed</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Registration is officially closed.</p>
                  <button disabled className="btn-secondary" style={{ display: "block", width: "100%", fontSize: "1rem", padding: "0.8rem", opacity: 0.5, cursor: "not-allowed" }}>
                    Closed
                  </button>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem", color: "var(--gold-light)" }}>Secure Your Spot</h3>
                  
                  {stats.userRegistered ? (
                    <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "1rem", borderRadius: "8px", color: "#22c55e", marginTop: "1rem", marginBottom: "1rem" }}>
                      ✓ You are registered
                    </div>
                  ) : event.registrationType === 'external' ? (
                     <>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Registration is handled via an external portal.</p>
                        <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "block", width: "100%", fontSize: "1rem", padding: "0.8rem", textAlign: "center" }}>
                          Register Externally ↗
                        </a>
                     </>
                  ) : stats.totalRegistrations >= (event.maxParticipants || 50) ? (
                     <>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Sorry, we have reached maximum capacity.</p>
                        <button disabled className="btn-secondary" style={{ display: "block", width: "100%", fontSize: "1rem", padding: "0.8rem", opacity: 0.5, cursor: "not-allowed" }}>
                          Event Full
                        </button>
                     </>
                  ) : !user ? (
                     <>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Register as a guest or <Link href="/admin" style={{ color: "var(--gold)", textDecoration: "underline" }}>login</Link>.</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "1.5rem" }}>
                          <input type="text" placeholder="Full Name" value={guestName} onChange={e => setGuestName(e.target.value)} style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.3)", color: "white" }} />
                          <input type="email" placeholder="Email Address" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.3)", color: "white" }} />
                        </div>
                        <button onClick={handleRegister} disabled={isProcessing || !guestName || !guestEmail} className="btn-primary" style={{ display: "block", width: "100%", fontSize: "1rem", padding: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
                          {isProcessing ? "Processing..." : "Register Now"}
                        </button>
                     </>
                  ) : profile?.status !== 'approved' ? (
                     <>
                        <p style={{ fontSize: "0.85rem", color: "rgba(239, 68, 68, 0.8)", marginBottom: "1.5rem" }}>Your account is pending approval.</p>
                        <button disabled className="btn-secondary" style={{ display: "block", width: "100%", fontSize: "1rem", padding: "0.8rem", opacity: 0.5, cursor: "not-allowed" }}>
                          Pending Verification
                        </button>
                     </>
                  ) : (
                    <>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Click below to confirm your attendance.</p>
                      <button onClick={handleRegister} disabled={isProcessing} className="btn-primary" style={{ display: "block", width: "100%", fontSize: "1rem", padding: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
                        {isProcessing ? "Processing..." : "Confirm Registration"}
                      </button>
                    </>
                  )}
                  
                  {/* VOLUNTEER SECTION */}
                  {event.enableVolunteer && user && (
                    <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {stats.userVolunteered ? (
                         <div style={{ background: "rgba(201, 168, 76, 0.1)", border: "1px solid rgba(201, 168, 76, 0.3)", padding: "0.8rem", borderRadius: "8px", color: "var(--gold)" }}>
                            You are a volunteer!
                         </div>
                      ) : stats.volunteers < event.volunteerLimit ? (
                        <button onClick={handleVolunteer} disabled={isProcessing} className="btn-secondary" style={{ display: "block", width: "100%", fontSize: "0.9rem", padding: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
                          {isProcessing ? "Processing..." : "Apply as Volunteer"}
                        </button>
                      ) : (
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Volunteer slots full.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </AnimatedSection>
          
          {/* ADMIN / CORE PANEL */}
          {profile?.canManageEvents && (
            <AnimatedSection delay={0.2}>
              <div style={{ background: "rgba(0, 0, 0, 0.4)", border: "1px solid var(--gold)", borderRadius: "16px", padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", color: "var(--gold)", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span>🛡️</span> Core Panel
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  <button onClick={() => setShowParticipantModal(true)} className="btn-secondary" style={{ fontSize: "0.85rem", background: "rgba(201,168,76,0.1)", borderColor: "var(--gold-dark)", color: "var(--gold-light)" }}>
                    Manage Participants ({stats.totalRegistrations})
                  </button>
                  
                  {event.internalNotes && (
                    <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Internal Notes</p>
                      <p style={{ fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>{event.internalNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedSection>
          )}

        </div>
      </div>

      {/* PARTICIPANT MODAL FOR CORE */}
      <AnimatePresence>
        {showParticipantModal && participants && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: "rgba(15, 22, 40, 1)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "2.5rem", maxWidth: "800px", width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", color: "var(--gold)" }}>Participant Management</h2>
                <button onClick={() => setShowParticipantModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.5rem" }}>✕</button>
              </div>
              
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>Registered ({participants.registrations?.length || 0})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
                {participants.registrations?.map((r: any) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.8rem", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}>
                    <div>
                      <p style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{r.name || "Unknown"}</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{r.email || "No email"}</p>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "right" }}>
                      Registered: {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {event.enableVolunteer && (
                <>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>Volunteers ({participants.volunteers?.length || 0})</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {participants.volunteers?.map((v: any) => (
                      <div key={v.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.8rem", background: "rgba(201,168,76,0.05)", borderRadius: "6px", border: "1px solid rgba(201,168,76,0.2)" }}>
                        <div>
                          <p style={{ fontWeight: "bold", fontSize: "0.95rem", color: "var(--gold-light)" }}>User ID: {v.userId.substring(0,8)}...</p>
                          {v.isBackup && <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>Backup</span>}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "right" }}>
                          Applied: {new Date(v.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
