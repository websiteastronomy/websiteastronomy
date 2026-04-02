"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import { getDocument } from "@/lib/db";

export default function OutreachDetail() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDocument<any>("outreach", id).then((data) => {
      setItem(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "var(--gold)" }}>Loading outreach details...</p></div>;
  }

  if (!item) {
    return (
      <div style={{ textAlign: "center", padding: "8rem 2rem", minHeight: "80vh" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Outreach Record Not Found</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>This entry may have been removed or is pending administrator approval.</p>
        <Link href="/outreach" className="btn-secondary">← Back to Initiatives</Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const typeConfig: Record<string, { label: string, color: string, bg: string, icon: string }> = {
    school: { label: "School Visit", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", icon: "🎒" },
    public: { label: "Public Telescope Event", color: "#fb923c", bg: "rgba(251,146,60,0.1)", icon: "🔭" },
    workshop: { label: "Workshop", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: "🛠️" },
    ngo: { label: "NGO / Orphanage", color: "#34d399", bg: "rgba(52,211,153,0.1)", icon: "🤝" }
  };

  const cat = typeConfig[item.type];

  return (
    <div style={{ paddingBottom: "6rem" }}>
      
      {/* ── HEADER HERO ── */}
      <div style={{ width: "100%", position: "relative", backgroundColor: "#080c16", borderBottom: "1px solid var(--border-subtle)", padding: "6rem 2rem 4rem" }}>
        
        {/* Back Button */}
        <div style={{ position: "absolute", top: "2rem", left: "2rem", zIndex: 10 }}>
          <button 
            onClick={() => router.back()}
            style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            ← Back to List
          </button>
        </div>

        <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
           <AnimatedSection>
              <div style={{ display: "inline-flex", gap: "1rem", marginBottom: "1.5rem" }}>
                 <span style={{ fontSize: "0.85rem", padding: "0.4rem 1rem", borderRadius: "20px", background: cat.bg, color: cat.color, border: `1px solid ${cat.color}40`, fontWeight: "bold" }}>
                    {cat.icon} {cat.label}
                 </span>
                 {!item.isApproved && (
                    <span style={{ fontSize: "0.85rem", padding: "0.4rem 1rem", borderRadius: "20px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: `1px solid rgba(239,68,68,0.4)`, fontWeight: "bold" }}>
                      ⚠️ PENDING APPROVAL
                    </span>
                 )}
              </div>
              
              <h1 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", marginBottom: "1.5rem", lineHeight: 1.1, fontFamily: "'Cinzel', serif" }}>
                {item.title}
              </h1>
              
              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", color: "var(--text-secondary)", flexWrap: "wrap", fontSize: "1.05rem" }}>
                <p style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {formatDate(item.date)}
                </p>
                <p style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {item.location}
                </p>
              </div>
           </AnimatedSection>
        </div>
      </div>

      {/* ── CONTENT GRID ── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem" }}>
        
        {/* ── STATS (POWER MOVE) ── */}
        <AnimatedSection delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem", marginBottom: "4rem" }}>
             
             {/* Stat 1: People Reached */}
             <div style={{ background: "rgba(201,168,76,0.05)", border: "1px solid var(--gold-dark)", borderRadius: "16px", padding: "2.5rem 2rem", textAlign: "center" }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" style={{ marginBottom: "1rem" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
               <h3 style={{ fontSize: "3rem", color: "var(--gold-light)", margin: 0, lineHeight: 1 }}>{item.stats.peopleReached}</h3>
               <p style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem", marginTop: "0.5rem", fontWeight: "bold" }}>Students / People Reached</p>
             </div>

             {/* Stat 2: Duration */}
             <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "2.5rem 2rem", textAlign: "center" }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" style={{ marginBottom: "1rem" }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
               <h3 style={{ fontSize: "3rem", color: "var(--text-primary)", margin: 0, lineHeight: 1 }}>{item.stats.duration.replace(/[^0-9.]/g, '') || "N/A"}</h3>
               <p style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem", marginTop: "0.5rem", fontWeight: "bold" }}>Hours Facilitated</p>
             </div>

             {/* Stat 3: Team Size */}
             <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "2.5rem 2rem", textAlign: "center" }}>
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" style={{ marginBottom: "1rem" }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 3.13 19 5.87 23 3.13"></polyline></svg>
               <h3 style={{ fontSize: "3rem", color: "var(--text-primary)", margin: 0, lineHeight: 1 }}>{item.stats.teamSize || 1}</h3>
               <p style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem", marginTop: "0.5rem", fontWeight: "bold" }}>Club Members Involved</p>
             </div>

          </div>
        </AnimatedSection>
        
        {/* ── STORY / DESCRIPTION ── */}
        <AnimatedSection delay={0.2}>
          <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", marginBottom: "4rem" }}>
             <h2 style={{ fontSize: "1.8rem", marginBottom: "1.5rem", fontFamily: "'Cinzel', serif" }}>Initiative Overview</h2>
             <p style={{ fontSize: "1.15rem", lineHeight: 1.8, color: "var(--text-secondary)", whiteSpace: "pre-line", margin: 0 }}>
               {item.description}
             </p>
          </div>
        </AnimatedSection>

        {/* ── MEDIA (MAIN PROOF) ── */}
        <AnimatedSection delay={0.3}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "2rem", fontFamily: "'Cinzel', serif", textAlign: "center" }}>Event Documentation</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1rem" }}>
             {(item.images || []).map((img: string, idx: number) => (
                <div key={idx} style={{ width: "100%", height: "400px", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                   <img src={img} alt={`Proof of ${item.title} ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s hover:scale-105" }} />
                </div>
             ))}
          </div>
        </AnimatedSection>

      </div>
    </div>
  );
}
