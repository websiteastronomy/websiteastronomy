"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WeatherWidget from "@/components/WeatherWidget";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedCard from "@/components/AnimatedCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import { getHighlights } from "@/app/actions/highlights";
import { loadSiteSettingsClient } from "@/data/siteSettingsStatic";
import { 
  getDocument, 
  getCollection, 
  subscribeToCollection,
  SiteSettings 
} from "@/lib/db";

export default function Home() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [featuredProject, setFeaturedProject] = useState<any>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<any>(null);
  const [coreTeam, setCoreTeam] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveStats, setLiveStats] = useState({ members: 0, projects: 0, events: 0, observations: 0 });

  useEffect(() => {
    const syncSettings = () => {
      setSettings(loadSiteSettingsClient());
    };

    const fetchData = async () => {
      const s = loadSiteSettingsClient();
      setSettings(s);

      // Fetch featured project
      if (s.featuredProjectId) {
        const p = await getDocument("projects", s.featuredProjectId);
        if (p) setFeaturedProject(p);
      } else {
        const projects = await getCollection("projects");
        if (projects.length > 0) setFeaturedProject(projects[0]);
      }

      // Fetch upcoming event
      let totalEvents = 0;
      if (s.featuredEventId) {
        const e = await getDocument("events", s.featuredEventId);
        if (e) setUpcomingEvent(e);
        const events = await getCollection("events");
        totalEvents = events.length;
      } else {
        const events = await getCollection("events");
        totalEvents = events.length;
        if (events.length > 0) setUpcomingEvent(events[0]);
      }

      // Fetch live counts
      try {
        const { getPlatformStatsAction } = await import('@/app/actions/stats');
        const counts = await getPlatformStatsAction();
        setLiveStats({
          members: counts.membersCount,
          projects: counts.projectsCount,
          events: totalEvents,
          observations: counts.observationsCount,
        });
      } catch (err) {
        console.error("Failed to load platform stats:", err);
      }

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

    const fetchTeam = async () => {
      try {
        const { getPublicMembersAction } = await import('@/app/actions/publicMembers');
        const members = await getPublicMembersAction();
        setCoreTeam(members.slice(0, 4));
      } catch (err) { }
    };
    fetchTeam();

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem" }}>

      {/* ── HERO ─────────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={{ textAlign: "center", maxWidth: "900px", marginTop: "10vh", marginBottom: "6rem", y: heroY, opacity: heroOpacity }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          style={{ marginBottom: "2.5rem" }}
        >
          <img src="/logo.png" alt="MVJCE Astronomy Club" style={{ height: "150px", width: "auto", borderRadius: "50%", opacity: 0.95 }} />
        </motion.div>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ marginBottom: "1.5rem" }}
        >
          MVJCE &middot; Explore the Cosmos
        </motion.p>

        <h1 className="page-title breathing-glow" style={{ marginBottom: "1.5rem" }}>
          {["Astronomy", "Club"].map((word, i) => (
            <motion.span
              key={word}
              className="gradient-text"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
              style={{ display: "inline-block", marginRight: "0.4em" }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          style={{ color: "var(--text-secondary)", fontSize: "1.1rem", lineHeight: 1.7, maxWidth: "600px", margin: "0 auto 2.5rem", fontWeight: 300 }}
        >
          Whether you&apos;re a seasoned astrophotographer or gazing at the stars for the very first time — there&apos;s a place for you here.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          style={{ display: "flex", gap: "1.2rem", justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link href="/projects" className="btn-primary magnetic-btn">Explore Projects</Link>
          {settings?.isRecruiting && (
            <Link href="/join" className="btn-secondary magnetic-btn">Join Club</Link>
          )}
          {settings && !settings.isRecruiting && (
            <button
              type="button"
              className="btn-secondary magnetic-btn"
              onClick={() => router.push("/join?closed=1")}
            >
              Join Club
            </button>
          )}
        </motion.div>
      </motion.section>

      {/* ── STATS BAR ────────────────────────────────── */}
      <AnimatedSection style={{ width: "100%", maxWidth: "1100px", marginBottom: "4rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1px", background: "var(--border-subtle)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
          {[
            { label: "Members", value: liveStats.members, suffix: "" },
            { label: "Observations", value: liveStats.observations, suffix: "+" },
            { label: "Projects", value: liveStats.projects, suffix: "" },
            { label: "Events Hosted", value: liveStats.events, suffix: "" },
          ].map((stat, i) => (
            <div key={stat.label} style={{ background: "rgba(15, 22, 40, 0.6)", padding: "2rem", textAlign: "center", backdropFilter: "blur(8px)" }}>
              <h2 className="gradient-text" style={{ fontSize: "2.8rem", fontFamily: "'Cinzel', serif", marginBottom: "0.3rem" }}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── SKY CONDITIONS ────────────────────────────── */}
      <AnimatedSection direction="left" delay={0.1} style={{ width: "100%", maxWidth: "1100px", marginBottom: "4rem" }}>
        <WeatherWidget />
      </AnimatedSection>

      {/* ── FEATURED PROJECT + UPCOMING EVENT ────────── */}
      <section style={{ width: "100%", maxWidth: "1100px", marginBottom: "4rem" }}>
        <AnimatedSection style={{ marginBottom: "1.5rem" }}>
          <p className="section-title">What We&apos;re Working On</p>
        </AnimatedSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>

          {/* Featured Project */}
          {featuredProject && (
            <AnimatedCard index={0} style={{ textAlign: "left", padding: 0, overflow: "hidden" }}>
              <div className="gallery-img-wrap" style={{ width: "100%", height: "200px" }}>
                <img src={featuredProject.coverImage || featuredProject.img} alt={featuredProject.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }} className="gallery-img" />
              </div>
              <div style={{ padding: "1.5rem 2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <p className="section-title" style={{ marginBottom: 0 }}>Featured Project</p>
                  <span className="status-pulse" style={{ color: "var(--gold)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{featuredProject.status}</span>
                </div>
                <h3 style={{ fontSize: "1.3rem", marginBottom: "0.7rem" }}>{featuredProject.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.65, fontWeight: 300, marginBottom: "1.2rem" }}>{featuredProject.description}</p>
                <Link href={`/projects#${featuredProject.id}`} className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem" }}>View Project →</Link>
              </div>
            </AnimatedCard>
          )}

          {/* Upcoming Event */}
          {upcomingEvent && (
            <AnimatedCard index={1} style={{ textAlign: "left", padding: 0, overflow: "hidden" }}>
              <div style={{ width: "100%", height: "200px", background: "linear-gradient(135deg, rgba(12,18,34,0.9), rgba(20,30,60,0.9))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  style={{ position: "absolute", width: "280px", height: "280px", borderRadius: "50%", border: "1px dashed rgba(201,168,76,0.15)" }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  style={{ position: "absolute", width: "180px", height: "180px", borderRadius: "50%", border: "1px dashed rgba(201,168,76,0.1)" }}
                />
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                  <line x1="21.17" y1="8" x2="12" y2="8"></line>
                  <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                  <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
                </svg>
              </div>
              <div style={{ padding: "1.5rem 2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <p className="section-title" style={{ marginBottom: 0 }}>Next Event</p>
                  <span style={{ color: "var(--gold)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{upcomingEvent.type}</span>
                </div>
                <h3 style={{ fontSize: "1.3rem", marginBottom: "0.8rem" }}>{upcomingEvent.title}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.2rem" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {upcomingEvent.date} &middot; {upcomingEvent.time}
                  </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {upcomingEvent.location}
                  </span>
                </div>
                <Link href={`/events#${upcomingEvent.id}`} className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem" }}>View All Events →</Link>
              </div>
            </AnimatedCard>
          )}
        </div>
      </section>

      {/* ── ARTICLE / DAILY FACT ─────────────────────── */}
      <section style={{ width: "100%", maxWidth: "1100px", marginBottom: "4rem" }}>
        <AnimatedSection style={{ marginBottom: "1.5rem" }}>
          <p className="section-title">Visual Highlights</p>
        </AnimatedSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {highlights.slice(0, 8).map((item: any, i: number) => (
            <AnimatedCard key={`${item.type}-${item.id}`} index={i} style={{ textAlign: "left", padding: 0, overflow: "hidden" }}>
              <Link href={item.link} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <div style={{ width: "100%", height: "165px", background: "rgba(12,18,34,0.9)" }}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      No image
                    </div>
                  )}
                </div>
                <div style={{ padding: "1rem" }}>
                  <span style={{ fontSize: "0.66rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", fontWeight: 700 }}>
                    {item.type}
                  </span>
                  <h3 style={{ margin: "0.45rem 0 0", fontSize: "1rem", lineHeight: 1.35 }}>{item.title}</h3>
                </div>
              </Link>
            </AnimatedCard>
          ))}
          {highlights.length === 0 && !loading && (
            <div style={{ gridColumn: "1 / -1", padding: "1.5rem", border: "1px solid var(--border-subtle)", borderRadius: "10px", color: "var(--text-muted)", textAlign: "center" }}>
              No highlights yet. Latest content will appear here once published.
            </div>
          )}
        </div>
      </section>

      <AnimatedSection direction="up" style={{ width: "100%", maxWidth: "1100px", marginBottom: "4rem" }}>
        <div style={{ padding: "2.5rem", borderLeft: "3px solid var(--gold)", background: "rgba(15, 22, 40, 0.4)", borderRadius: "0 12px 12px 0", position: "relative", overflow: "hidden" }}>
          <motion.div
            style={{ position: "absolute", top: "1rem", right: "1.5rem", color: "rgba(201,168,76,0.06)", fontSize: "8rem", fontFamily: "'Cinzel', serif", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}
          >
            ★
          </motion.div>
          <p className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Astronomy Fact of the Day
          </p>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.8, fontWeight: 300, color: "var(--text-primary)", maxWidth: "700px", marginBottom: "0.7rem" }}>
            &ldquo;{settings?.dailyFact.text}&rdquo;
          </p>
          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Source: {settings?.dailyFact.source}</span>
        </div>
      </AnimatedSection>

      {/* ── TEAM PREVIEW ─────────────────────────────── */}
      <section style={{ width: "100%", maxWidth: "1100px", marginBottom: "4rem" }}>
        <AnimatedSection>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Core Team</h2>
            <Link href="/about" className="nav-link" style={{ fontSize: "0.85rem" }}>Meet Everyone →</Link>
          </div>
        </AnimatedSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
          {coreTeam.map((member, i) => (
            <AnimatedCard key={member.name || i} index={i} style={{ textAlign: "center" }}>
              {member.imageUrl ? (
                <img src={member.imageUrl} alt={member.name}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.8rem", display: "block", border: "2px solid rgba(201, 168, 76, 0.2)" }} />
              ) : (
                <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", margin: "0 auto 0.8rem", border: "2px solid rgba(201, 168, 76, 0.2)", color: "var(--text-primary)" }}>
                  {(member.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{member.name}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 300 }}>{member.role}</p>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────── */}
      {settings?.isRecruiting && (
        <AnimatedSection style={{ width: "100%", maxWidth: "1100px", marginBottom: "4rem" }}>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: "16px", padding: "4rem 3rem", textAlign: "center", background: "linear-gradient(135deg, rgba(20,30,58,0.8), rgba(12,18,34,0.95))", border: "1px solid rgba(201,168,76,0.15)" }}>
            {/* Decorative rings */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "500px", height: "500px", borderRadius: "50%", border: "1px dashed rgba(201,168,76,0.06)", pointerEvents: "none" }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "360px", height: "360px", borderRadius: "50%", border: "1px dashed rgba(201,168,76,0.09)", pointerEvents: "none" }} />

            <p className="section-title" style={{ textAlign: "center", marginBottom: "1rem" }}>Be Part of Something Bigger</p>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "2.2rem", marginBottom: "1rem", fontWeight: 700 }}>
              Join the <span className="gradient-text">Astronomy Club</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 2rem", fontWeight: 300 }}>
              Open to all students at MVJCE. No prior experience needed — just a curiosity about the cosmos.
            </p>
            <Link href="/join" className="btn-primary magnetic-btn" style={{ fontSize: "0.9rem", padding: "1rem 3rem" }}>
              Apply Now
            </Link>
          </div>
        </AnimatedSection>
      )}

    </div>
  );
}
