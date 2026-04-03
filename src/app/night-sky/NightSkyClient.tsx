"use client";

import AnimatedSection from "@/components/AnimatedSection";
import AnimatedCard from "@/components/AnimatedCard";
import { motion } from "framer-motion";
import type { NightSkyLegacyData } from "@/data/mockNightSky";
import type { NightSkySystemState } from "@/lib/night-sky";

type Props = {
  nightSkyData: NightSkyLegacyData;
  state: NightSkySystemState;
  lastUpdatedLabel: string;
};

function getVisibilityColor(rating: string) {
  switch (rating) {
    case "Excellent":
      return "#22c55e";
    case "Good":
      return "#3b82f6";
    case "Fair":
      return "#eab308";
    case "Poor":
      return "#ef4444";
    default:
      return "var(--text-muted)";
  }
}

function getModeLabel(mode: NightSkySystemState["mode"]) {
  if (mode === "auto") return "Automatic feed";
  if (mode === "hybrid") return "Hybrid feed";
  return "Manual feed";
}

export default function NightSkyClient({ nightSkyData, state, lastUpdatedLabel }: Props) {
  const moon = nightSkyData.moon;
  const planets = Array.isArray(nightSkyData.planets) ? nightSkyData.planets : [];
  const upcomingEvents = Array.isArray(nightSkyData.upcomingEvents) ? nightSkyData.upcomingEvents : [];
  const disclaimer =
    state.mode === "auto"
      ? "Automatically refreshed celestial data with stored fallback protection."
      : state.mode === "hybrid"
        ? "Automatic baseline with admin-curated overrides layered in."
        : "Curated manually by the astronomy club team.";

  return (
    <div className="page-container">
      <AnimatedSection>
        <p className="section-title" style={{ textAlign: "center" }}>Tonight&apos;s Sky</p>
        <h1 className="page-title"><span className="gradient-text">Night Sky Dashboard</span></h1>
        <p className="page-subtitle">
          A live celestial briefing with moon conditions, visible planets, and standout observing events.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <div style={{ margin: "0 auto 2.5rem", maxWidth: "960px", padding: "1rem 1.2rem", borderRadius: "14px", border: "1px solid rgba(201, 168, 76, 0.2)", background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(15,22,40,0.55))", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>Mode</p>
            <p style={{ margin: "0.3rem 0 0", fontSize: "1rem", color: "var(--gold)", fontWeight: 700 }}>{getModeLabel(state.mode)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>Last Updated</p>
            <p style={{ margin: "0.3rem 0 0", fontSize: "1rem", color: "var(--text-primary)" }}>{lastUpdatedLabel}</p>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{disclaimer}</p>
          </div>
        </div>
      </AnimatedSection>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", width: "100%", marginBottom: "4rem" }}>
        <AnimatedCard index={0} style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(15, 22, 40, 0.5)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ position: "relative", width: "150px", height: "150px", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", width: "100%", height: "100%", border: "1px dashed rgba(201, 168, 76, 0.3)", borderRadius: "50%" }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", width: "70%", height: "70%", border: "1px solid rgba(201, 168, 76, 0.1)", borderRadius: "50%" }} />
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ zIndex: 2 }}>
              <img src={moon.imageUrl || "/logo.png"} alt="Moon" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", boxShadow: "0 0 20px rgba(255,255,255,0.1)" }} />
            </motion.div>
          </div>
          <h3 style={{ fontSize: "1.4rem", marginBottom: "0.3rem", fontFamily: "'Cinzel', serif" }}>{moon.phase}</h3>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", width: "100%", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", color: "var(--gold)", fontWeight: 600 }}>{moon.illumination}%</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Illumination</div>
            </div>
            <div style={{ width: "1px", background: "var(--border-subtle)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.2rem", color: "var(--gold)", fontWeight: 600 }}>{moon.daysUntilFull}d</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Until Full</div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard index={1} style={{ padding: "2rem", display: "flex", flexDirection: "column", background: "rgba(15, 22, 40, 0.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", letterSpacing: "0.05em", color: "var(--text-primary)" }}>Visible Planets</h3>
            <span style={{ fontSize: "0.75rem", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>Live Visibility</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
            {planets.length === 0 ? <p style={{ color: "var(--text-muted)" }}>Planet visibility data is temporarily unavailable.</p> : null}
            {planets.map((planet, i) => (
              <motion.div key={planet.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                style={{ display: "grid", gridTemplateColumns: "min-content 1fr min-content", alignItems: "center", gap: "1rem", paddingBottom: "1rem", borderBottom: i < planets.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <img src={planet.imageUrl || "/logo.png"} alt={planet.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>{planet.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Mag {planet.magnitude}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gold-light)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span>Rise {planet.riseTime}</span>
                    <span style={{ opacity: 0.5 }}>|</span>
                    <span>Set {planet.setTime}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Constellation</div>
                  <div style={{ fontSize: "0.9rem" }}>{planet.constellation}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>
      </div>

      <AnimatedSection style={{ width: "100%" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "0.6rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.8rem" }}>Astronomical Calendar</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Upcoming observing moments and celestial events worth planning around.</p>
      </AnimatedSection>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem", width: "100%" }}>
        {upcomingEvents.length === 0 ? (
          <AnimatedCard index={0} style={{ padding: "1.5rem" }}>
            <p style={{ color: "var(--text-muted)" }}>No event data is available right now. Please check back soon.</p>
          </AnimatedCard>
        ) : null}
        {upcomingEvents.map((evt, i) => (
          <AnimatedCard key={evt.id} index={i} style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {evt.imageUrl ? (
              <div style={{ width: "100%", height: "140px" }}>
                <img src={evt.imageUrl || "/logo.png"} alt={evt.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : null}
            <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem", gap: "1rem" }}>
                <span style={{ color: "var(--gold)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{evt.dateStr}</span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    border: `1px solid ${getVisibilityColor(evt.visibilityRating)}`,
                    color: getVisibilityColor(evt.visibilityRating),
                    background: `${getVisibilityColor(evt.visibilityRating)}15`,
                  }}
                >
                  {evt.visibilityRating} View
                </span>
              </div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>{evt.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, flex: 1 }}>{evt.description}</p>
              <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Event Type</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{evt.type}</span>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
