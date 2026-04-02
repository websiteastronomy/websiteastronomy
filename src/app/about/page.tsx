"use client";

import { useEffect, useState } from 'react';
import { getCollection } from '@/lib/db';
import { loadSiteSettingsClient } from '@/data/siteSettingsStatic';
import { ABOUT_VISION_MISSION } from '@/data/aboutPageStatic';
import AnimatedSection from '@/components/AnimatedSection';
import AnimatedCounter from '@/components/AnimatedCounter';
import { motion, Variants } from 'framer-motion';

export default function About() {
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [outreach, setOutreach] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cardVariants: Variants = {
    offscreen: { opacity: 0, y: 30 },
    onscreen: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!cancelled) setSiteSettings(loadSiteSettingsClient());
      const safeCollection = async (name: string) => {
        try {
          return await getCollection(name);
        } catch (e) {
          console.error(`[About] Failed to fetch collection ${name}:`, e);
          return [];
        }
      };

      try {
        const [membersData, achievementsData, outreachData] = await Promise.all([
          safeCollection("members"),
          safeCollection("achievements"),
          safeCollection("outreach"),
        ]);
        if (!cancelled) {
          setTeam(membersData);
          setAchievements(achievementsData);
          setOutreach(outreachData);
        }
      } catch (err) {
        console.error("[About] Failed to fetch settings:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "var(--gold)" }}>Aligning the stars...</p></div>;
  }


  return (
    <div className="page-container">
      {/* ── HEADER ── */}
      <AnimatedSection>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p className="section-title" style={{ marginBottom: "0.5rem" }}>Our Cosmic Story</p>
          <h1 className="page-title"><span className="gradient-text">About The Club</span></h1>
          <p className="page-subtitle" style={{ maxWidth: "700px", margin: "0 auto", fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Founded on the pillars of curiosity and engineering, the MVJCE Astronomy Club is a sanctuary for those who look up and wonder.
          </p>
        </div>
      </AnimatedSection>

      {/* ── STATS ROW (Static for now or keep from settings) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", width: "100%", margin: "0 0 6rem", textAlign: "center" }}>
        {[
          { label: "Active Members", value: siteSettings?.heroStats?.members || team.length, suffix: "+" },
          { label: "Events Done", value: siteSettings?.heroStats?.events || 50, suffix: "+" },
          { label: "R&D Projects", value: siteSettings?.heroStats?.projects || 10, suffix: "" },
          { 
            label: "Community Impact", 
            value: outreach.filter(o => o.isApproved).reduce((sum, item) => sum + (item.stats?.peopleReached || 0), 0) || 500, 
            suffix: "+" 
          },
        ].map((stat, i) => (
          <AnimatedSection key={stat.label} delay={i * 0.1}>
            <div style={{ 
              padding: "2.5rem 1.5rem", 
              background: "rgba(15, 22, 40, 0.4)", 
              borderRadius: "20px", 
              border: "1px solid var(--border-subtle)", 
              position: "relative", 
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}>
              <div style={{ position: "absolute", top: -10, right: -10, width: "60px", height: "60px", background: "var(--gold)", opacity: 0.05, filter: "blur(20px)", borderRadius: "50%" }} />
              <h2 className="gradient-text" style={{ fontSize: "2.8rem", marginBottom: "0.5rem", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>{stat.label}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* ── VISION / MISSION (static copy — edit in src/data/aboutPageStatic.ts) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8rem", width: "100%", marginBottom: "10rem" }}>
        <AnimatedSection direction="up">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5rem", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: "1 1 400px", position: "relative" }}>
              <div style={{ position: "absolute", inset: "-15px", border: "1px solid var(--gold)", opacity: 0.2, borderRadius: "32px", zIndex: 0 }} />
              <img 
                src={ABOUT_VISION_MISSION.vision.imageUrl} 
                alt="Vision" 
                style={{ width: "100%", height: "450px", objectFit: "cover", borderRadius: "24px", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", position: "relative", zIndex: 1 }} 
              />
            </div>
            <div style={{ flex: "1 1 400px", padding: "1rem" }}>
              <div style={{ width: "40px", height: "2px", background: "var(--gold)", marginBottom: "1.5rem" }} />
              <h3 style={{ fontSize: "2.4rem", marginBottom: "1.5rem", fontFamily: "'Cinzel', serif", color: "var(--text-primary)" }}>{ABOUT_VISION_MISSION.vision.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", lineHeight: 1.8, fontWeight: 300, textAlign: "justify" }}>
                {ABOUT_VISION_MISSION.vision.text}
              </p>
            </div>
          </div>
        </AnimatedSection>
        
        <AnimatedSection direction="up">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5rem", alignItems: "center", justifyContent: "space-between", flexDirection: "row-reverse" }}>
            <div style={{ flex: "1 1 400px", position: "relative" }}>
              <div style={{ position: "absolute", inset: "-15px", border: "1px solid var(--gold)", opacity: 0.2, borderRadius: "32px", zIndex: 0 }} />
              <img 
                src={ABOUT_VISION_MISSION.mission.imageUrl} 
                alt="Mission" 
                style={{ width: "100%", height: "450px", objectFit: "cover", borderRadius: "24px", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", position: "relative", zIndex: 1 }} 
              />
            </div>
            <div style={{ flex: "1 1 400px", padding: "1rem" }}>
              <div style={{ width: "40px", height: "2px", background: "var(--gold)", marginBottom: "1.5rem" }} />
              <h3 style={{ fontSize: "2.4rem", marginBottom: "1.5rem", fontFamily: "'Cinzel', serif", color: "var(--text-primary)" }}>{ABOUT_VISION_MISSION.mission.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", lineHeight: 1.8, fontWeight: 300, textAlign: "justify" }}>
                {ABOUT_VISION_MISSION.mission.text}
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>


      {/* ── ACHIEVEMENTS ── */}
      <AnimatedSection style={{ width: "100%" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "2rem", textAlign: "center", fontFamily: "'Cinzel', serif" }}>Hall of Fame</h2>
      </AnimatedSection>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", width: "100%", marginBottom: "6rem" }}>
        {achievements.map((ach, i) => (
          <motion.div
            key={ach.id}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.2 }}
            variants={cardVariants}
            style={{ 
              background: 'rgba(15, 22, 40, 0.4)', borderRadius: '12px', border: '1px solid var(--border-subtle)', 
              overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}
            className="feature-card"
          >
            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <img src={ach.imageUrl} alt={ach.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--gold)', color: '#000', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                {ach.year}
              </div>
            </div>
            <div style={{ padding: "1.5rem", flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.8rem", lineHeight: 1.4 }}>{ach.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, flex: 1 }}>{ach.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── TEAM ── */}
      <AnimatedSection style={{ width: "100%" }}>
        <h2 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", textAlign: "center", fontFamily: "'Cinzel', serif" }}>Core Committee</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "4rem", maxWidth: "600px", margin: "0 auto 4rem" }}>
          The visionary students steering the MVJCE Astronomy Club towards the stars.
        </p>
      </AnimatedSection>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "3rem", width: "100%", paddingBottom: "4rem" }}>
        {team.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            style={{ 
              background: 'rgba(15, 22, 40, 0.4)', borderRadius: '24px', border: '1px solid var(--border-subtle)', 
              padding: '0', textAlign: 'center', position: 'relative', overflow: 'hidden',
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              display: "flex", flexDirection: "column"
            }}
            className="hover-lift"
          >
            {/* Design Element */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to bottom, rgba(201,168,76,0.1), transparent)' }} />
            
            <div style={{ padding: '3.5rem 2rem 2.5rem', flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 2rem' }}>
                <div style={{ position: 'absolute', inset: '-5px', border: '1px solid var(--gold)', borderRadius: '50%', opacity: 0.2 }} />
                <img 
                  src={member.imageUrl} 
                  alt={member.name} 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0c1222', position: 'relative', zIndex: 1 }} 
                />
              </div>
              
              <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", fontFamily: "'Cinzel', serif", color: "var(--text-primary)" }}>{member.name}</h3>
              <div style={{ color: "var(--gold)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: "1.5rem" }}>
                {member.role}
              </div>
              
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2rem", fontStyle: "italic", fontWeight: 300, flex: 1 }}>
                &ldquo;{member.bio}&rdquo;
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginTop: "auto" }}>
                <span style={{ fontSize: "0.7rem", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", padding: "0.4rem 1rem", borderRadius: "12px", color: "var(--gold-light)", fontWeight: 600 }}>
                  {member.dept}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
