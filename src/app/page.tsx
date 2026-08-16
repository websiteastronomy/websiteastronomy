"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedCounter from "@/components/AnimatedCounter";
import RecruitmentBanner from "@/components/RecruitmentBanner";
import VisualHighlightsCarousel from "@/components/VisualHighlightsCarousel";
import { getHighlights } from "@/app/actions/highlights";
import { loadSiteSettingsClient } from "@/data/siteSettingsStatic";
import type { SiteSettings } from "@/lib/db";

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveStats, setLiveStats] = useState({ pioneers: 120, events: 45, outreach: 28, projects: 12 });

  useEffect(() => {
    const syncSettings = () => {
      import("@/app/actions/site-settings")
        .then(({ getSiteSettingsAction }) => getSiteSettingsAction())
        .then((serverSettings) => {
          setSettings(serverSettings);
        })
        .catch(() => {
          setSettings(loadSiteSettingsClient());
        });
    };

    const fetchData = async () => {
      let s = loadSiteSettingsClient();
      try {
        const { getSiteSettingsAction } = await import("@/app/actions/site-settings");
        s = await getSiteSettingsAction();
      } catch {
        s = loadSiteSettingsClient();
      }
      setSettings(s);

      // Fetch live platform stats
      try {
        const { getPlatformStatsAction } = await import("@/app/actions/stats");
        const counts = await getPlatformStatsAction();
        setLiveStats({
          pioneers: counts.pioneersCount || 120,
          events: counts.eventsCount || 45,
          outreach: counts.outreachCount || 28,
          projects: counts.projectsCount || 12,
        });
      } catch (err) {
        console.error("Failed to load platform stats:", err);
      }

      // Fetch dynamic highlights for continuous carousel
      try {
        const featuredHighlights = await getHighlights();
        setHighlights(featuredHighlights);
      } catch (err) {
        console.error("Failed to load highlights:", err);
      }

      setLoading(false);
    };

    fetchData();

    const handleFocus = () => syncSettings();
    const handleStorage = () => syncSettings();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const isRecruiting = settings?.isRecruiting ?? true;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* ── 2. RECRUITMENT BANNER ─────────────────────────────── */}
      <RecruitmentBanner isRecruiting={isRecruiting} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "0 1rem" }}>
        
        {/* ── 3. HERO SECTION ─────────────────────────────────── */}
        <motion.section
          ref={heroRef}
          style={{
            textAlign: "center",
            maxWidth: "960px",
            marginTop: "6vh",
            marginBottom: "5rem",
            y: heroY,
            opacity: heroOpacity,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            style={{ marginBottom: "2rem" }}
          >
            <img
              src="/logo.png"
              alt="MVJCE Astronomy Club Logo"
              style={{
                height: "140px",
                width: "auto",
                borderRadius: "50%",
                boxShadow: "0 0 45px rgba(201, 168, 76, 0.3)",
              }}
            />
          </motion.div>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ marginBottom: "1.2rem", letterSpacing: "0.38em" }}
          >
            EXPLORE &middot; DISCOVER &middot; CONNECT
          </motion.p>

          <h1
            className="hero-title breathing-glow"
            style={{ fontSize: "clamp(2.8rem, 5.5vw, 4.2rem)", marginBottom: "1.5rem", lineHeight: 1.15 }}
          >
            PIONEERING THE FRONTIERS OF{" "}
            <span className="gradient-text">COSMIC EXPLORATION</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            style={{
              color: "var(--text-secondary)",
              fontSize: "1.15rem",
              lineHeight: 1.7,
              maxWidth: "680px",
              margin: "0 auto 2.5rem",
              fontWeight: 300,
            }}
          >
            A community of student stargazers, astrophotographers, and space science enthusiasts at MVJCE exploring deep space, astrophysics, and observation.
          </motion.p>

          {/* Conditional CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            style={{ display: "flex", gap: "1.2rem", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}
          >
            <Link
              href="/about"
              className="btn-primary magnetic-btn"
              style={{ padding: "0.85rem 2.4rem", fontSize: "0.9rem" }}
            >
              Learn More
            </Link>

            {isRecruiting ? (
              <Link
                href="/join"
                className="btn-secondary magnetic-btn"
                style={{ padding: "0.85rem 2.4rem", fontSize: "0.9rem" }}
              >
                Start Journey
              </Link>
            ) : (
              <a
                href="https://chat.whatsapp.com/astronomy-mvjce"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary magnetic-btn"
                style={{
                  padding: "0.85rem 2.2rem",
                  fontSize: "0.9rem",
                  borderColor: "var(--gold-light)",
                  color: "var(--gold-light)",
                }}
              >
                Registrations Closed — Join our community
              </a>
            )}
          </motion.div>
        </motion.section>

        {/* ── 4. STATS ROW (4 stats, live/DB-driven) ───────────── */}
        <AnimatedSection style={{ width: "100%", maxWidth: "1100px", marginBottom: "5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <p className="hero-subtitle" style={{ fontSize: "0.75rem", letterSpacing: "0.3em" }}>EXPLORE NEW FRONTIERS</p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.2rem",
              width: "100%",
            }}
          >
            {[
              { label: "Pioneers", value: liveStats.pioneers, suffix: "+" },
              { label: "Event", value: liveStats.events, suffix: "" },
              { label: "Outreach", value: liveStats.outreach, suffix: "" },
              { label: "Projects", value: liveStats.projects, suffix: "" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "rgba(10, 10, 10, 0.8)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  padding: "2.2rem 1.5rem",
                  textAlign: "center",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                  transition: "transform 0.3s ease, border-color 0.3s ease",
                }}
              >
                <h2
                  className="gradient-text"
                  style={{
                    fontSize: "3.2rem",
                    fontFamily: "'Cinzel', serif",
                    marginBottom: "0.3rem",
                    fontWeight: 700,
                  }}
                >
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </h2>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    fontWeight: 600,
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* ── 5. "THE CURRENT SKY" SECTION (Figma exact structure) ────────── */}
        <AnimatedSection style={{ width: "100%", maxWidth: "1100px", marginBottom: "5rem" }}>
          <div
            style={{
              background: "rgba(10, 10, 10, 0.85)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "24px",
              padding: "3.5rem 3rem",
              backdropFilter: "blur(16px)",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", alignItems: "center" }}>
              {/* Left Column Content */}
              <div>
                <p className="hero-subtitle" style={{ marginBottom: "0.6rem", letterSpacing: "0.3em" }}>OBSERVATIONAL GUIDE</p>
                <h2 className="gradient-text" style={{ fontSize: "2.5rem", fontFamily: "'Cinzel', serif", marginBottom: "1rem", lineHeight: 1.2 }}>
                  THE CURRENT SKY
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.7, fontWeight: 300, marginBottom: "2rem" }}>
                  Live celestial forecast and observational guide for Bangalore coordinates. Monitor lunar phase, visible planetary transits, and prime deep-sky targets.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                  <div style={{ background: "rgba(0, 0, 0, 0.5)", border: "1px solid rgba(255,255,255,0.05)", padding: "1rem 1.2rem", borderRadius: "12px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block" }}>Moon Phase</span>
                    <strong style={{ color: "var(--gold-light)", fontSize: "0.95rem" }}>Waxing Gibbous (84%)</strong>
                  </div>
                  <div style={{ background: "rgba(0, 0, 0, 0.5)", border: "1px solid rgba(255,255,255,0.05)", padding: "1rem 1.2rem", borderRadius: "12px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block" }}>Visible Planets</span>
                    <strong style={{ color: "var(--gold-light)", fontSize: "0.95rem" }}>Jupiter & Saturn</strong>
                  </div>
                  <div style={{ background: "rgba(0, 0, 0, 0.5)", border: "1px solid rgba(255,255,255,0.05)", padding: "1rem 1.2rem", borderRadius: "12px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block" }}>Constellations</span>
                    <strong style={{ color: "var(--gold-light)", fontSize: "0.95rem" }}>Orion & Cygnus</strong>
                  </div>
                  <div style={{ background: "rgba(0, 0, 0, 0.5)", border: "1px solid rgba(255,255,255,0.05)", padding: "1rem 1.2rem", borderRadius: "12px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block" }}>Sky Condition</span>
                    <strong style={{ color: "#22c55e", fontSize: "0.95rem" }}>Bortle 5 — Clear</strong>
                  </div>
                </div>

                <Link
                  href="/night-sky"
                  className="btn-primary magnetic-btn"
                  style={{ fontSize: "0.85rem", padding: "0.8rem 2rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                >
                  EXPLORE THE SKY &rarr;
                </Link>
              </div>

              {/* Right Column: Realistic Moon Graphic */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                  style={{
                    position: "absolute",
                    width: "360px",
                    height: "360px",
                    borderRadius: "50%",
                    border: "1px dashed rgba(201, 168, 76, 0.2)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    width: "280px",
                    height: "280px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    boxShadow: "0 0 50px rgba(201, 168, 76, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.8)",
                    border: "2px solid rgba(201, 168, 76, 0.3)",
                    position: "relative",
                  }}
                >
                  <img
                    src="/moon-current-sky.png"
                    alt="Moon Phase Current Sky"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ── 6. "VISUAL HIGHLIGHTS" CAROUSEL ────────────────── */}
        <VisualHighlightsCarousel highlights={highlights} />

        {/* ── 7. "FOLLOW US ON SOCIAL MEDIA" ─────────────────── */}
        <AnimatedSection style={{ width: "100%", maxWidth: "1100px", marginBottom: "6rem", textAlign: "center" }}>
          <div
            style={{
              background: "rgba(10, 10, 10, 0.85)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "24px",
              padding: "3.5rem 2rem",
              backdropFilter: "blur(12px)",
              boxShadow: "0 15px 40px rgba(0,0,0,0.7)",
            }}
          >
            <p className="hero-subtitle" style={{ marginBottom: "0.5rem", letterSpacing: "0.3em" }}>STAY CONNECTED</p>
            <h2 className="gradient-text" style={{ fontSize: "2.3rem", fontFamily: "'Cinzel', serif", marginBottom: "1rem" }}>
              Follow Us on Social Media
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "550px", margin: "0 auto 2.5rem", fontWeight: 300 }}>
              Join our online community for live astronomical event updates, workshop announcements, and astrophotography highlights.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "1.6rem", flexWrap: "wrap" }}>
              {/* Instagram */}
              <a
                href="https://instagram.com/astronomy.mvj"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="Instagram"
                title="Instagram"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/company/mvjce-astronomy-club"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@mvjceastronomyclub"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="YouTube"
                title="YouTube"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>

              {/* WhatsApp Community */}
              <a
                href="https://chat.whatsapp.com/astronomy-mvjce"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="WhatsApp Community"
                title="WhatsApp Community"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/mvjce-astronomy"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="GitHub"
                title="GitHub Repository"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
