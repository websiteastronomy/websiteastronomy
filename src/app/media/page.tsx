"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { subscribeToCollection } from '@/lib/db';

export default function MediaPage() {
  const [mediaData, setMediaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollection('media', (data) => {
      setMediaData(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter where isFeatured = true, limit 8 for curated look
  const featuredMedia = useMemo(() => {
    return mediaData
      .filter(item => item.isFeatured)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [mediaData]);

  const catColors: Record<string, string> = {
    project: "#a78bfa", // Purple
    event: "#60a5fa",   // Blue
    observation: "#34d399" // Green
  };

  if (loading) {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "var(--gold)" }}>Developing negatives...</p></div>;
  }

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "3rem", minHeight: "80vh" }}>
      
      {/* ── HEADER ── */}
      <AnimatedSection>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p className="section-title">Visual Log</p>
          <h1 className="page-title" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", margin: "0.5rem 0", lineHeight: 1.1 }}>
            <span className="gradient-text">Media Gallery</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "1rem", maxWidth: "600px", margin: "1rem auto 0", fontSize: "1.05rem" }}>
            A curated collection of our best astrophotography, public events, and club milestones. Captured by our members.
          </p>
        </div>
      </AnimatedSection>

      {/* ── SIMPLE GRID ── */}
      <AnimatedSection delay={0.1}>
        {featuredMedia.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2.5rem" }}>
            {featuredMedia.map((item, idx) => {
              const color = catColors[item.category] || "#fff";
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  whileHover={{ y: -5 }}
                  style={{ background: "rgba(12, 18, 34, 0.4)", border: "1px solid var(--border-subtle)", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}
                >
                  <div style={{ position: "relative", width: "100%", height: "280px", background: "rgba(255,255,255,0.02)" }}>
                    <img 
                      src={item.imageUrl} 
                      alt={item.caption || "Astronomy Club Media"} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1419242902214-272b38666f54?w=800&q=80" }}
                    />
                    <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
                       <span style={{ fontSize: "0.7rem", padding: "0.4rem 0.8rem", borderRadius: "20px", background: "rgba(0,0,0,0.8)", color: color, border: `1px solid ${color}40`, backdropFilter: "blur(4px)", fontWeight: "bold", textTransform: "uppercase" }}>
                         {item.category}
                       </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    {item.caption && (
                      <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", margin: "0 0 1.5rem", fontStyle: "italic", lineHeight: 1.6 }}>
                        &quot;{item.caption}&quot;
                      </p>
                    )}
                    <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        📸 {item.author}
                      </p>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "6rem 2rem", background: "rgba(15, 22, 40, 0.2)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
            <p style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.8 }}>🌌</p>
            <h3 style={{ fontSize: "1.4rem", color: "var(--text-primary)" }}>Gallery coming soon</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>The admin has not pinned any images to the public grid yet.</p>
          </div>
        )}
      </AnimatedSection>
      
    </div>
  );
}
