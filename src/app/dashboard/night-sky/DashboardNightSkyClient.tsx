"use client";

import Link from "next/link";
import type { NightSkyLegacyData } from "@/data/mockNightSky";
import type { NightSkySystemState } from "@/lib/night-sky";
import { SectionHeader, TableContainer, EmptyState } from "@/components/ui";

type Props = {
  nightSkyData: NightSkyLegacyData;
  state: NightSkySystemState;
  lastUpdatedLabel: string;
};

function getVisibilityColor(rating: string) {
  switch (rating) {
    case "Excellent": return "#22c55e";
    case "Good": return "#3b82f6";
    case "Fair": return "#eab308";
    case "Poor": return "#ef4444";
    default: return "var(--text-muted)";
  }
}

function getModeLabel(mode: NightSkySystemState["mode"]) {
  if (mode === "auto") return "Automatic";
  if (mode === "hybrid") return "Hybrid";
  return "Manual";
}

export default function DashboardNightSkyClient({ nightSkyData, state, lastUpdatedLabel }: Props) {
  const moon = nightSkyData.moon;
  const planets = Array.isArray(nightSkyData.planets) ? nightSkyData.planets : [];
  const upcomingEvents = Array.isArray(nightSkyData.upcomingEvents) ? nightSkyData.upcomingEvents : [];

  return (
    <div style={{ maxWidth: "1100px" }}>
      <SectionHeader
        title="Night Sky"
        subtitle="Celestial data reference"
        action={<Link href="/night-sky" style={{ color: "var(--gold)", textDecoration: "none", fontSize: "0.85rem" }}>View Public Page →</Link>}
      />

      {/* System Info Bar */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem",
        padding: "1rem 1.2rem", marginBottom: "1.5rem",
        background: "rgba(15,22,40,0.35)", borderRadius: "10px", border: "1px solid var(--border-subtle)"
      }}>
        <div>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Mode</div>
          <div style={{ fontSize: "0.95rem", color: "var(--gold)", fontWeight: 600 }}>{getModeLabel(state.mode)}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Last Updated</div>
          <div style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{lastUpdatedLabel}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Status</div>
          <div style={{ fontSize: "0.95rem", color: "#22c55e", fontWeight: 600 }}>Active</div>
        </div>
      </div>

      {/* Moon Phase */}
      <div style={{
        padding: "1.5rem", marginBottom: "1.5rem",
        background: "rgba(15,22,40,0.35)", borderRadius: "12px", border: "1px solid var(--border-subtle)"
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Moon Phase</h2>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
          <img src={moon.imageUrl || "/logo.png"} alt="Moon" style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "2rem" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Phase</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{moon.phase}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Illumination</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--gold)" }}>{moon.illumination}%</div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Until Full</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{moon.daysUntilFull} days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Planets Table */}
      <TableContainer>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Planet Visibility</h2>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr", gap: "1rem", padding: "0.7rem 1.2rem",
          borderBottom: "1px solid var(--border-subtle)", fontSize: "0.7rem", textTransform: "uppercase",
          letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 600
        }}>
          <span>Planet</span>
          <span>Constellation</span>
          <span>Magnitude</span>
          <span>Rise</span>
          <span>Set</span>
          <span>Naked Eye</span>
        </div>
        {planets.length === 0 ? (
          <EmptyState icon="🪐" title="No planet data" description="Data feed might be down." />
        ) : (
          <div className="dash-stagger">
            {planets.map((planet) => (
              <div key={planet.id} className="dash-row" style={{
                display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr", gap: "1rem", padding: "0.8rem 1.2rem",
                borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <img src={planet.imageUrl || "/logo.png"} alt={planet.name} loading="lazy" style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} className="dash-fade-in" />
                  <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{planet.name}</span>
                </div>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{planet.constellation}</span>
                <span style={{ fontSize: "0.9rem", color: "var(--gold-light)" }}>{planet.magnitude}</span>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{planet.riseTime}</span>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{planet.setTime}</span>
                <span style={{
                  fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "10px",
                  background: planet.isNakedEyeVisible ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.12)",
                  color: planet.isNakedEyeVisible ? "#22c55e" : "#64748b", fontWeight: 600, display: "inline-block", textAlign: "center"
                }}>
                  {planet.isNakedEyeVisible ? "Yes" : "No"}
                </span>
              </div>
            ))}
          </div>
        )}
      </TableContainer>

      {/* Upcoming Celestial Events */}
      <TableContainer>
        <div style={{ padding: "1rem 1.2rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Upcoming Celestial Events</h2>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr", gap: "1rem", padding: "0.7rem 1.2rem",
          borderBottom: "1px solid var(--border-subtle)", fontSize: "0.7rem", textTransform: "uppercase",
          letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 600
        }}>
          <span>Event</span>
          <span>Date</span>
          <span>Type</span>
          <span>Visibility</span>
        </div>
        {upcomingEvents.length === 0 ? (
          <EmptyState icon="✨" title="No upcoming events" description="No celestial events tracked at the moment." />
        ) : (
          <div className="dash-stagger">
            {upcomingEvents.map((evt) => (
              <div key={evt.id} className="dash-row" style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr", gap: "1rem", padding: "0.8rem 1.2rem",
                borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center"
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{evt.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{evt.description}</div>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--gold-light)" }}>{evt.dateStr}</span>
                <span style={{
                  fontSize: "0.72rem", padding: "0.25rem 0.5rem", borderRadius: "12px",
                  background: "rgba(201,168,76,0.08)", color: "var(--gold-light)", fontWeight: 600,
                  display: "inline-block"
                }}>
                  {evt.type}
                </span>
                <span style={{
                  fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "10px",
                  border: `1px solid ${getVisibilityColor(evt.visibilityRating)}`,
                  color: getVisibilityColor(evt.visibilityRating),
                  background: `${getVisibilityColor(evt.visibilityRating)}15`, fontWeight: 600, textAlign: "center"
                }}>
                  {evt.visibilityRating}
                </span>
              </div>
            ))}
          </div>
        )}
      </TableContainer>
    </div>
  );
}
