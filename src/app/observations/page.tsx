"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { getPublishedObservationsAction } from '@/app/actions/observations-engine';
import { useAuth } from '@/context/AuthContext';
import { formatDateStable } from '@/lib/format-date';

export default function Observations() {
  const [observations, setObservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth(); // If they want to post, direct them to portal

  useEffect(() => {
    getPublishedObservationsAction().then(data => {
      setObservations(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const featuredObs = useMemo(() => observations.find(o => o.isFeatured), [observations]);

  const filteredObservations = useMemo(() => {
    let result = observations;
    if (filterCategory !== 'all') {
      result = result.filter(o => o.category === filterCategory);
    }
    if (searchQuery.trim() !== '') {
      result = result.filter(o => o.title.toLowerCase().includes(searchQuery.toLowerCase()) || o.celestialTarget.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result; // ALready sorted from DB
  }, [observations, filterCategory, searchQuery]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDateStable(dateString);
  };

  const categoryFormats: Record<string, { label: string, color: string, bg: string, icon: string }> = {
    Lunar: { label: "Lunar", color: "#f1f5f9", bg: "rgba(241,245,249,0.1)", icon: "🌙" },
    Planetary: { label: "Planetary", color: "#fb923c", bg: "rgba(251,146,60,0.1)", icon: "🪐" },
    "Deep Sky": { label: "Deep Sky", color: "#818cf8", bg: "rgba(129,140,248,0.1)", icon: "🌌" },
    Solar: { label: "Solar", color: "#facc15", bg: "rgba(250,204,21,0.1)", icon: "☀️" },
    "Widefield / Milky Way": { label: "Widefield", color: "#c084fc", bg: "rgba(192,132,252,0.1)", icon: "✨" }
  };

  const getCategoryFormat = (cat: string) => {
    return categoryFormats[cat] || { label: cat, color: "#fff", bg: "rgba(255,255,255,0.1)", icon: "🔭" };
  };

  return (
    <div style={{ padding: "4rem 1rem", maxWidth: "1200px", margin: "0 auto", minHeight: "80vh", display: "flex", flexDirection: "column", gap: "4rem" }}>
      
      {/* ── HEADER & SEARCH CONTROLS ── */}
      <AnimatedSection>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 400px" }}>
            <p className="section-title">Astro Archive</p>
            <h1 className="page-title" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: 0 }}><span className="gradient-text">Observations</span></h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "1rem", maxWidth: "500px" }}>Explore captured images, techniques, and data shared by our club members.</p>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "250px", minWidth: "0" }}>
              <input 
                type="text" 
                placeholder="Search observations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "0.8rem 1rem 0.8rem 2.5rem", background: "rgba(15,22,40,0.6)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.9rem", fontFamily: "inherit" }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ padding: "0.8rem 1rem", background: "rgba(15,22,40,0.6)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", cursor: "pointer", appearance: "none", minWidth: "150px", fontSize: "0.9rem", fontFamily: "inherit" }}
            >
              <option value="all">All Categories</option>
              <option value="Lunar">🌙 Lunar</option>
              <option value="Planetary">🪐 Planetary</option>
              <option value="Deep Sky">🌌 Deep Sky</option>
              <option value="Solar">☀️ Solar</option>
              <option value="Widefield / Milky Way">✨ Widefield</option>
            </select>

            <Link href="/portal/observations" className="btn-primary" style={{ padding: "0.8rem 1.5rem" }}>
              {user ? "+ My Observations" : "+ Submit Observation"}
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {loading && (
        <div style={{ textAlign: "center", padding: "6rem", color: "var(--gold)", fontSize: "1.2rem" }}>Loading Telemetry...</div>
      )}

      {/* ── FEATURED OBSERVATION ── */}
      {!loading && featuredObs && filterCategory === "all" && searchQuery === "" && (
        <AnimatedSection delay={0.1}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1rem", fontFamily: "'Cinzel', serif", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", background: "var(--gold)", borderRadius: "50%", boxShadow: "0 0 10px var(--gold)" }}></span>
              Observation of the Week
            </h2>
            <div style={{ 
              display: "flex", flexWrap: "wrap", background: "rgba(8,12,22,0.8)", border: "1px solid var(--gold-dark)", 
              borderRadius: "16px", overflow: "hidden", position: "relative" 
            }}>
              <div style={{ flex: "1 1 min(100%, 500px)", minHeight: "300px" }}>
                 <img src={featuredObs.imageCompressedUrl || featuredObs.imageOriginalUrl} alt={featuredObs.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: "1 1 min(100%, 400px)", padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1rem" }}>
                   <span style={{ fontSize: "0.75rem", padding: "0.3rem 0.8rem", borderRadius: "12px", background: getCategoryFormat(featuredObs.category).bg, color: getCategoryFormat(featuredObs.category).color, fontWeight: "bold" }}>
                      {getCategoryFormat(featuredObs.category).icon} {getCategoryFormat(featuredObs.category).label}
                   </span>
                </div>
                <h3 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", marginBottom: "0.5rem", lineHeight: 1.1 }}>{featuredObs.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "1rem" }}>
                  Target: <strong style={{color:"#fff"}}>{featuredObs.celestialTarget}</strong><br/>
                  Captured by <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>{featuredObs.observerId.slice(0,8)}</span> on {formatDate(featuredObs.capturedAt)}
                </p>
                
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2.5rem" }}>
                  {featuredObs.description}
                </p>
                
                <Link href={`/observations/${featuredObs.id}`} className="btn-secondary" style={{ alignSelf: "flex-start", padding: "0.8rem 2rem" }}>
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ── OBSERVATIONS GRID ── */}
      {!loading && (
        <AnimatedSection delay={0.2}>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "2rem" }}>
              {filteredObservations.map((obs) => {
                const cat = getCategoryFormat(obs.category);
                return (
                  <div key={obs.id} style={{ 
                    background: "rgba(15, 22, 40, 0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", 
                    overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s, box-shadow 0.2s",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <div style={{ width: "100%", height: "240px", overflow: "hidden", position: "relative" }}>
                      {/* Using the 400px thumbnail WebP variants from the backend to save bandwidth */}
                      <img src={obs.imageThumbnailUrl || obs.imageOriginalUrl} alt={obs.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
                         <span style={{ fontSize: "0.7rem", padding: "0.3rem 0.8rem", borderRadius: "12px", background: "rgba(0,0,0,0.7)", color: cat.color, border: `1px solid ${cat.color}40`, backdropFilter: "blur(4px)" }}>
                            {cat.icon} {cat.label}
                         </span>
                      </div>
                    </div>
                    
                    <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                      <h4 style={{ fontSize: "1.2rem", marginBottom: "0.3rem", lineHeight: 1.3 }}>{obs.title}</h4>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>{formatDate(obs.capturedAt)} · {obs.location}</p>
                      
                      {/* EXIF Quick Bar */}
                      <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                        {obs.equipment && <span style={{ background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.4rem", borderRadius: "4px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"120px" }}>🔭 {obs.equipment}</span>}
                        {obs.exposureTime && <span style={{ background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>⏱️ {obs.exposureTime}</span>}
                      </div>

                      <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", display: "-webkit-box" }}>
                        {obs.description}
                      </p>
                      
                      <Link href={`/observations/${obs.id}`} style={{ marginTop: "auto", fontSize: "0.85rem", color: "var(--gold)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        View Details <span style={{ fontSize: "1.2em" }}>→</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
           </div>

           {filteredObservations.length === 0 && (
             <div style={{ textAlign: "center", padding: "6rem 2rem", background: "rgba(15, 22, 40, 0.2)", borderRadius: "12px", border: "1px dashed var(--border-subtle)" }}>
               <p style={{ fontSize: "2rem", marginBottom: "1rem", opacity: 0.5 }}>🔭</p>
               <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>No observations published yet.</h3>
               <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Be the first to submit a high-quality capture for the archive.</p>
             </div>
           )}
        </AnimatedSection>
      )}
    </div>
  );
}
