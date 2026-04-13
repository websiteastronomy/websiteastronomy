"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { addDocument, getPublicCollection } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { formatDateStable } from '@/lib/format-date';

export default function OutreachPage() {
  const { isAdmin } = useAuth();
  const [outreachData, setOutreachData] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    getPublicCollection('outreach')
      .then((data) => setOutreachData(data))
      .catch((error) => console.error("[OutreachPage] Failed to load outreach:", error));
  }, []);

  // Filter approved only and calculate High Value Impact Stats
  const approvedOutreach = useMemo(() => outreachData.filter(o => o.isApproved), [outreachData]);
  
  const totalImpacted = useMemo(() => {
    return approvedOutreach.reduce((sum, item) => sum + (item.stats?.peopleReached || 0), 0);
  }, [approvedOutreach]);

  const formattedTotalImpacted = useMemo(() => new Intl.NumberFormat("en-US").format(totalImpacted), [totalImpacted]);

  // Apply filters and sorting
  const filteredOutreach = useMemo(() => {
    let result = approvedOutreach;
    if (filterType !== 'all') {
      result = result.filter(o => o.type === filterType);
    }
    // Sort Date Descending
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [approvedOutreach, filterType]);

  const formatDate = (dateString: string) => {
    try {
      return formatDateStable(dateString);
    } catch (e) {
      return dateString;
    }
  };

  const typeConfig: Record<string, { label: string, color: string, bg: string, icon: string }> = {
    school: { label: "School Visit", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", icon: "🎒" },
    public: { label: "Public Telescope Event", color: "#fb923c", bg: "rgba(251,146,60,0.1)", icon: "🔭" },
    workshop: { label: "Workshop", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: "🛠️" },
    ngo: { label: "NGO / Orphanage", color: "#34d399", bg: "rgba(52,211,153,0.1)", icon: "🤝" }
  };

  return (
    <div style={{ padding: "4rem 1rem", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "4rem", minHeight: "80vh" }}>
      
      {/* ── HEADER & IMPACT COUNTER (POWER MOVE) ── */}
      <AnimatedSection>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3rem", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: "1 1 400px" }}>
            <p className="section-title">Community Impact</p>
            <h1 className="page-title" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", margin: 0, lineHeight: 1.1 }}>
              <span className="gradient-text">Outreach</span>
            </h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "1rem", maxWidth: "500px", fontSize: "1.05rem" }}>
              Bringing the universe down to earth. Explore our educational initiatives, public events, and community impact records.
            </p>
          </div>

          <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid var(--gold-dark)", borderRadius: "16px", padding: "1.5rem 2rem", textAlign: "center", minWidth: "200px" }}>
             <p style={{ color: "var(--gold-light)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", fontWeight: "bold" }}>Total People Impacted</p>
             <h2 style={{ fontSize: "clamp(2rem, 6vw, 4rem)", margin: 0, color: "var(--gold)", fontFamily: "'Cinzel', serif", lineHeight: 1 }}>
               {formattedTotalImpacted}+
             </h2>
          </div>
        </div>
      </AnimatedSection>

      {feedback && (
        <div style={{ padding: "0.9rem 1rem", borderRadius: "10px", border: feedback.type === "success" ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)", background: feedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: feedback.type === "success" ? "#86efac" : "#fca5a5", fontSize: "0.9rem" }}>
          {feedback.message}
        </div>
      )}

      {/* ── FILTER & CONTROLS ── */}
      <AnimatedSection delay={0.1}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", alignItems: "center", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
             <button 
               onClick={() => setFilterType('all')} 
               style={{ padding: "0.5rem 1rem", borderRadius: "20px", background: filterType === 'all' ? "rgba(255,255,255,0.1)" : "transparent", border: filterType === 'all' ? "1px solid var(--text-primary)" : "1px solid var(--border-subtle)", color: filterType === 'all' ? "#fff" : "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap" }}
             >
               All Initiatives
             </button>
             {Object.entries(typeConfig).map(([key, config]) => (
               <button 
                 key={key}
                 onClick={() => setFilterType(key)} 
                 style={{ padding: "0.5rem 1rem", borderRadius: "20px", background: filterType === key ? config.bg : "transparent", border: filterType === key ? `1px solid ${config.color}50` : "1px solid var(--border-subtle)", color: filterType === key ? config.color : "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap", display: "flex", gap: "0.5rem", alignItems: "center" }}
               >
                 <span>{config.icon}</span> {config.label}
               </button>
             ))}
          </div>

          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowAddForm(true)} style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}>
              + Add Outreach Entry
            </button>
          )}
        </div>
      </AnimatedSection>

      {/* ── LIST/GRID VIEW ── */}
      <AnimatedSection delay={0.2}>
         {filteredOutreach.length > 0 ? (
           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "2rem" }}>
             {filteredOutreach.map(item => {
               const typeData = typeConfig[item.type] || { label: "Initiative", color: "#fff", bg: "transparent", icon: "✨" };
               return (
                 <motion.div 
                   key={item.id}
                   whileHover={{ y: -5 }}
                   style={{ background: "rgba(15,22,40,0.5)", border: "1px solid var(--border-subtle)", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}
                 >
                   <div style={{ width: "100%", height: "220px", position: "relative" }}>
                     <img src={Array.isArray(item.images) ? item.images[0] : item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                     <div style={{ position: "absolute", top: "1rem", left: "1rem" }}>
                        <span style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "20px", background: "rgba(0,0,0,0.8)", color: typeData.color, border: `1px solid ${typeData.color}40`, backdropFilter: "blur(4px)", fontWeight: "bold" }}>
                          {typeData.icon} {typeData.label}
                        </span>
                     </div>
                   </div>

                   <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1 }}>
                     <p style={{ fontSize: "0.85rem", color: "var(--gold-light)", marginBottom: "0.5rem", fontWeight: "bold", textTransform: "uppercase" }}>
                       {formatDate(item.date)}
                     </p>
                     <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", lineHeight: 1.2 }}>{item.title}</h3>
                     <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>
                       {item.description}
                     </p>

                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem", marginTop: "auto" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: "bold" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                          {item.stats?.peopleReached || 0} Reached
                        </div>
                        <Link href={`/outreach/${item.id}`} style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem", transition: "color 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.color="var(--gold)"} onMouseLeave={(e)=>e.currentTarget.style.color="var(--text-muted)"}>
                          View Details →
                        </Link>
                     </div>
                   </div>
                 </motion.div>
               );
             })}
           </div>
         ) : (
           <div style={{ textAlign: "center", padding: "6rem 2rem", background: "rgba(15, 22, 40, 0.2)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
             <p style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.8 }}>🚀</p>
             <h3 style={{ fontSize: "1.4rem", color: "var(--text-primary)" }}>We are planning new outreach initiatives</h3>
             <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", maxWidth: "400px", margin: "1rem auto 0" }}>Check back later or adjust your filters to see our past community impact.</p>
           </div>
         )}
      </AnimatedSection>

      {/* ── MEMBER ADD FORM OVERLAY ── */}
      <AnimatePresence>
        {showAddForm && isAdmin && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              style={{ background: "#080c16", border: "1px solid var(--border-subtle)", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", padding: "2.5rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.5rem" }}>Log Outreach Initiative</h3>
                <button onClick={() => setShowAddForm(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
              </div>

              <div style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.3)", padding: "1rem", borderRadius: "8px", marginBottom: "2rem" }}>
                 <p style={{ fontSize: "0.85rem", color: "#fb923c", margin: 0, lineHeight: 1.5 }}>
                   <strong>Moderation Rules:</strong> Images and impact stats are mandatory. An admin must approve this log before it appears publicly.
                 </p>
              </div>

              <div id="outreach-form" style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div>
                   <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Initiative Title</label>
                   <input name="title" type="text" placeholder="e.g. Apollo Middle School Visit" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                   <div>
                     <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Type</label>
                     <select name="type" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit", cursor: "pointer" }}>
                       <option value="school">School Visit</option>
                       <option value="public">Public Telescope Event</option>
                       <option value="workshop">Workshop</option>
                       <option value="ngo">NGO / Orphanage</option>
                     </select>
                   </div>
                   <div>
                     <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Date</label>
                     <input name="date" type="date" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                   </div>
                </div>

                <div>
                   <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Location</label>
                   <input name="location" type="text" placeholder="Where did this happen?" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                </div>

                <div>
                   <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Description</label>
                   <textarea name="description" rows={3} placeholder="What did you do?" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit", resize: "vertical" }} />
                </div>

                <div>
                   <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Image URL</label>
                   <input name="imageUrl" type="url" placeholder="https://..." style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "1rem 0", paddingTop: "1rem" }}>
                   <h4 style={{ fontSize: "1rem", marginBottom: "1rem", color: "var(--gold-light)" }}>Impact Statistics</h4>
                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))", gap: "1rem" }}>
                     <div>
                       <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>People Reached</label>
                       <input name="peopleReached" type="number" placeholder="150" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                     </div>
                     <div>
                       <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Duration</label>
                       <input name="duration" type="text" placeholder="3h" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                     </div>
                     <div>
                       <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Team Size</label>
                       <input name="teamSize" type="number" placeholder="5" style={{ width: "100%", padding: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontFamily: "inherit" }} />
                     </div>
                   </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  className="btn-primary" 
                  onClick={async () => {
                    setFeedback(null);
                    setIsSubmitting(true);
                    const container = document.getElementById('outreach-form');
                    if (!container) return;
                    const inputs = container.querySelectorAll('input, select, textarea');
                    const data: any = { isApproved: false, images: [], stats: {} };
                    inputs.forEach((i: any) => { 
                      if (i.name === 'peopleReached' || i.name === 'teamSize' || i.name === 'duration') {
                        data.stats[i.name] = i.name === 'duration' ? i.value : parseInt(i.value) || 0;
                      } else if (i.name) {
                        data[i.name] = i.value; 
                      }
                    });
                    if (data.imageUrl) data.images = [data.imageUrl];
                    
                    try {
                      await addDocument('outreach', data);
                      setFeedback({ type: 'success', message: 'Entry submitted! An admin will review it soon.' });
                      setShowAddForm(false);
                    } catch (e) {
                      setFeedback({ type: 'error', message: 'Failed to save entry.' });
                    } finally {
                      setIsSubmitting(false);
                    }
                  }} 
                  style={{ marginTop: "1rem", padding: "1rem", fontSize: "1rem", opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Saving...' : 'Submit Log'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
