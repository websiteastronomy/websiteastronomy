"use client";

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { useState, useEffect } from 'react';
import { subscribeToCollection } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { formatDateStable } from '@/lib/format-date';

export default function Events() {
  const now = new Date();
  const { user } = useAuth();

  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const unsub = subscribeToCollection('events', (data) => {
      setEvents(data);
    });
    return () => unsub();
  }, []);

  // 1. Separate & Sort Logic (Enforced by Spec)
  // Filter out private events if user is not logged in
  const visibleEvents = events.filter(e => e.isPublished && (e.isPublic !== false || !!user));

  const upcomingEvents = visibleEvents
    .filter(e => e.status !== "completed" && new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ascending

  const pastEvents = visibleEvents
    .filter(e => e.status === "completed" || new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Descending

  const formatDate = (dateString: string) => {
    return formatDateStable(dateString);
  };

  const formatTime = (dateString: string) => {
    const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata', timeZoneName: 'short' };
    return new Date(dateString).toLocaleTimeString('en-US', opts);
  };

  return (
    <div style={{ padding: "4rem 1rem", maxWidth: "1000px", margin: "0 auto", minHeight: "80vh", display: "flex", flexDirection: "column", gap: "4rem" }}>
      
      {/* HEADER */}
      <AnimatedSection>
        <div style={{ textAlign: "center" }}>
          <p className="section-title">Get Involved</p>
          <h1 className="page-title"><span className="gradient-text">Club Events</span></h1>
          <p className="page-subtitle" style={{ maxWidth: "600px", margin: "0 auto" }}>
            Stargazing sessions, guest lectures, and rocketry workshops. See what&apos;s happening next.
          </p>
        </div>
      </AnimatedSection>

      {/* ── UPCOMING EVENTS (TOP PRIORITY) ── */}
      <section>
        <AnimatedSection delay={0.1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontFamily: "'Cinzel', serif" }}>Upcoming Events</h2>
            <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
          </div>
        </AnimatedSection>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {upcomingEvents.length === 0 ? (
            <AnimatedSection delay={0.2}>
              <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(15, 22, 40, 0.4)", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "2.5rem", opacity: 0.5, marginBottom: "1rem" }}>🗓️</div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>No upcoming events scheduled</h3>
                <p style={{ color: "var(--text-muted)" }}>Check back later or follow our social channels for updates.</p>
              </div>
            </AnimatedSection>
          ) : (
            upcomingEvents.map((event, i) => (
              <AnimatedSection key={event.id} direction="up" delay={i * 0.1}>
                {/* UPCOMING CARD UI */}
                <div style={{ 
                  display: "flex", flexWrap: "wrap", background: "rgba(15, 22, 40, 0.5)", border: "1px solid var(--gold-dark)", 
                  borderRadius: "16px", overflow: "hidden", position: "relative" 
                }}>
                  <div style={{ flex: "1 1 300px", minHeight: "250px" }}>
                     <img src={event.bannerImage} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: "2 1 min(100%, 400px)", padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold-light)", fontWeight: 700, marginBottom: "0.5rem", display: "block" }}>{event.type}</span>
                    <h3 style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", marginBottom: "1rem", lineHeight: 1.2 }}>{event.title}</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {formatDate(event.date)} at {formatTime(event.date)}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {event.location}
                      </span>
                    </div>
                    
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                      {event.description}
                    </p>
                    
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "auto" }}>
                      <Link href={`/events/${event.id}`} className="btn-secondary" style={{ padding: "0.7rem 1.5rem" }}>
                        View Details
                      </Link>
                      {event.registrationLink && (
                        <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: "0.7rem 1.5rem" }}>
                          Register Now
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))
          )}
        </div>
      </section>

      {/* ── PAST EVENTS (ARCHIVE) ── */}
      <AnimatePresence>
        {pastEvents.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', color: "var(--text-secondary)", fontFamily: "'Cinzel', serif" }}>Past Archive</h2>
              <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "1.5rem" }}>
              {pastEvents.map((event, i) => (
                <div key={event.id} style={{ 
                  background: "rgba(15, 22, 40, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "12px", 
                  overflow: "hidden", display: "flex", flexDirection: "column", opacity: 0.8, transition: "opacity 0.2s ease" 
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                >
                  <div style={{ width: "100%", height: "140px", overflow: "hidden" }}>
                    <img src={event.bannerImage} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(40%)" }} />
                  </div>
                  <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                      <h4 style={{ fontSize: "1.05rem", lineHeight: 1.3 }}>{event.title}</h4>
                    </div>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                       {formatDate(event.date)}
                    </span>
                    <Link href={`/events/${event.id}`} style={{ marginTop: "auto", fontSize: "0.85rem", color: "var(--gold)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      View Details & Media <span style={{ fontSize: "1.2em" }}>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      
    </div>
  );
}
