"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { subscribeToCollection, addDocument } from '@/lib/db';

export default function Observations() {
  const [observations, setObservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Mock member auth logic for adding observations
  const [isMember] = useState(true); 
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCollection('observations', (data) => setObservations(data));
    return () => unsub();
  }, []);

  // Core Data Flow logic: Only show approved
  const approvedObs = useMemo(() => observations.filter(o => o.isApproved), [observations]);
  const featuredObs = useMemo(() => approvedObs.find(o => o.isFeatured), [approvedObs]);

  const filteredObservations = useMemo(() => {
    let result = approvedObs;
    if (filterCategory !== 'all') {
      result = result.filter(o => o.category === filterCategory);
    }
    if (searchQuery.trim() !== '') {
      result = result.filter(o => o.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    // Sort Date Descending
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [approvedObs, filterCategory, searchQuery]);

  const formatDate = (dateString: string) => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', opts);
  };

  const categoryFormats: Record<string, { label: string, color: string, bg: string, icon: string }> = {
    moon: { label: "Moon", color: "#f1f5f9", bg: "rgba(241,245,249,0.1)", icon: "🌙" },
    planet: { label: "Planets", color: "#fb923c", bg: "rgba(251,146,60,0.1)", icon: "🪐" },
    deep_sky: { label: "Deep Sky", color: "#818cf8", bg: "rgba(129,140,248,0.1)", icon: "🌌" }
  };

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto", minHeight: "80vh", display: "flex", flexDirection: "column", gap: "4rem" }}>
      
      {/* ── HEADER & SEARCH CONTROLS ── */}
      <AnimatedSection>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 400px" }}>
            <p className="section-title">Astro Archive</p>
            <h1 className="page-title" style={{ fontSize: "3rem", margin: 0 }}><span className="gradient-text">Observations</span></h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "1rem", maxWidth: "500px" }}>Explore captured images, techniques, and data shared by our club members.</p>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", width: "250px" }}>
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
              <option value="moon">🌙 Moon</option>
              <option value="planet">🪐 Planets</option>
              <option value="deep_sky">🌌 Deep Sky</option>
            </select>

            {isMember && (
              <button className="btn-primary" onClick={() => setShowAddForm(true)} style={{ padding: "0.8rem 1.5rem" }}>
                + Add Observation
              </button>
            )}
          </div>
        </div>
      </AnimatedSection>

      {/* ── FEATURED OBSERVATION (OPTIONAL HIGH VALUE) ── */}
      {featuredObs && filterCategory === "all" && searchQuery === "" && (
        <AnimatedSection delay={0.1}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1rem", fontFamily: "'Cinzel', serif", color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Observation of the Week</h2>
            <div style={{ 
              display: "flex", flexWrap: "wrap", background: "rgba(8,12,22,0.8)", border: "1px solid var(--gold-dark)", 
              borderRadius: "16px", overflow: "hidden", position: "relative" 
            }}>
              <div style={{ flex: "1 1 500px", minHeight: "400px" }}>
                 <img src={Array.isArray(featuredObs.images) ? featuredObs.images[0] : featuredObs.imageUrl} alt={featuredObs.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: "1 1 400px", padding: "3rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1rem" }}>
                   <span style={{ fontSize: "0.75rem", padding: "0.3rem 0.8rem", borderRadius: "12px", background: categoryFormats[featuredObs.category].bg, color: categoryFormats[featuredObs.category].color, fontWeight: "bold" }}>
                      {categoryFormats[featuredObs.category].icon} {categoryFormats[featuredObs.category].label}
                   </span>
                </div>
                <h3 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", lineHeight: 1.1 }}>{featuredObs.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "2rem" }}>
                  Captured by <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>{featuredObs.observerName}</span> on {formatDate(featuredObs.date)}
                </p>
                
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2.5rem" }}>
                  {featuredObs.notes}
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
      <AnimatedSection delay={0.2}>
         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
            {filteredObservations.map((obs) => {
              const cat = categoryFormats[obs.category];
              return (
                <div key={obs.id} style={{ 
                  background: "rgba(15, 22, 40, 0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", 
                  overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s, box-shadow 0.2s" 
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
                    <img src={Array.isArray(obs.images) ? obs.images[0] : obs.imageUrl} alt={obs.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
                       <span style={{ fontSize: "0.7rem", padding: "0.3rem 0.8rem", borderRadius: "12px", background: "rgba(0,0,0,0.7)", color: cat.color, border: `1px solid ${cat.color}40`, backdropFilter: "blur(4px)" }}>
                          {cat.icon} {cat.label}
                       </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h4 style={{ fontSize: "1.2rem", marginBottom: "0.3rem", lineHeight: 1.3 }}>{obs.title}</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>{formatDate(obs.date)} · by {obs.observerName}</p>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", display: "-webkit-box" }}>
                      {obs.notes}
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
             <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>No observations found</h3>
             <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Try adjusting your search or category filters.</p>
           </div>
         )}
      </AnimatedSection>

      {/* ── MEMBER UPLOAD MOCK MODAL ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: "#080c16", border: "1px solid var(--border-subtle)", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "2.5rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.5rem" }}>Submit Observation</h3>
                <button onClick={() => setShowAddForm(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
              </div>

              <div style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.3)", padding: "1rem", borderRadius: "8px", marginBottom: "2rem" }}>
                 <p style={{ fontSize: "0.85rem", color: "#fb923c", margin: 0, lineHeight: 1.5 }}>
                   <strong>Moderation Queue:</strong> Your observation will be reviewed by an Admin before appearing on the public archive. Images and precise dates are strictly required.
                 </p>
              </div>

              <div id="observation-form" style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Title</label>
                  <input name="title" type="text" placeholder="e.g. Orion Nebula Core" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Category</label>
                    <select name="category" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit", cursor: "pointer", appearance: "none" }}>
                      <option value="moon">Moon</option>
                      <option value="planet">Planet</option>
                      <option value="deep_sky">Deep Sky</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Date</label>
                    <input name="date" type="date" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Image URL (Required)</label>
                  <input name="imageUrl" type="url" placeholder="https://..." style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "1rem 0", paddingTop: "1rem" }}>
                  <h4 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Technical Setup</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <input name="equipment" type="text" placeholder="Equipment (Telescope / Camera)" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                    <input name="exposure" type="text" placeholder="Exposure (e.g. 30s)" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit", fontSize: "0.8rem" }} />
                    <input name="iso" type="text" placeholder="ISO / Gain" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit", fontSize: "0.8rem" }} />
                    <input name="focal" type="text" placeholder="Focal L. (e.g. 1200mm)" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit", fontSize: "0.8rem" }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Observer Name</label>
                  <input name="observerName" type="text" placeholder="Your Name" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Observation Notes</label>
                  <textarea name="notes" rows={4} placeholder="Conditions, findings, processing steps..." style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit", resize: "vertical" }} />
                </div>

                <button 
                  disabled={isSubmitting}
                  className="btn-primary" 
                  onClick={async () => {
                    setIsSubmitting(true);
                    const container = document.getElementById('observation-form');
                    if (!container) return;
                    const inputs = container.querySelectorAll('input, select, textarea');
                    const data: any = { isApproved: false, images: [] };
                    inputs.forEach((i: any) => { if (i.name) data[i.name] = i.value; });
                    if (data.imageUrl) data.images = [data.imageUrl];
                    
                    try {
                      await addDocument('observations', data);
                      alert("Observation submitted! An admin will review it soon.");
                      setShowAddForm(false);
                    } catch (e) {
                      alert("Failed to submit observation.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }} 
                  style={{ marginTop: "1rem", padding: "1rem", fontSize: "1rem", opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
