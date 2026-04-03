"use client";

import { useEffect, useState } from "react";
import { inputStyle } from "./shared";
import { loadSiteSettingsClient } from "@/data/siteSettingsStatic";
import { NightSkySettings } from "@/data/mockNightSky";
import { writeSiteSettingsLocal } from "@/lib/settingsLocal";
import { getNightSkyStructuredSettings, normalizeNightSkySettings } from "@/lib/night-sky";
import { syncNightSkyAdminDataAction } from "@/app/actions/night-sky";

function createStructuredDraft(siteSettings?: any): NightSkySettings {
  return getNightSkyStructuredSettings(siteSettings);
}

export default function NightSkyManager() {
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [structuredDraft, setStructuredDraft] = useState<NightSkySettings>(() => createStructuredDraft());
  const [isSavingStructured, setIsSavingStructured] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const settings = loadSiteSettingsClient();
    setSiteSettings(settings);
    setStructuredDraft(createStructuredDraft(settings));
  }, []);

  const handleStructuredSave = async () => {
    setFeedback(null);
    setIsSavingStructured(true);
    try {
      const normalized = normalizeNightSkySettings({
        ...structuredDraft,
        lastUpdated: new Date().toISOString(),
      });
      const next = {
        ...siteSettings,
        nightSkyStructured: normalized,
      };
      await syncNightSkyAdminDataAction(next);
      setSiteSettings(next);
      setStructuredDraft(normalized);
      writeSiteSettingsLocal(next);
      setFeedback({ type: "success", message: "Night Sky settings saved. Structured mode is now the active admin workflow, with fallback backup retained behind the scenes." });
    } catch {
      setFeedback({ type: "error", message: "Failed to save structured Night Sky data." });
    } finally {
      setIsSavingStructured(false);
    }
  };

  const updateMoon = (field: "phase" | "illumination" | "daysUntilFull", value: string) => {
    setStructuredDraft((current) => ({
      ...current,
      moon: {
        ...current.moon,
        [field]: field === "phase" ? value : Number(value || 0),
      },
    }));
  };

  const updatePlanet = (index: number, field: string, value: string) => {
    setStructuredDraft((current) => ({
      ...current,
      planets: current.planets.map((planet, planetIndex) =>
        planetIndex === index
          ? {
              ...planet,
              [field]:
                field === "isNakedEyeVisible"
                  ? value === "true"
                  : field === "magnitude"
                    ? Number(value || 0)
                    : value,
            }
          : planet
      ),
    }));
  };

  const updateEvent = (index: number, field: string, value: string) => {
    setStructuredDraft((current) => ({
      ...current,
      upcomingEvents: current.upcomingEvents.map((eventItem, eventIndex) =>
        eventIndex === index
          ? {
              ...eventItem,
              [field]: value,
            }
          : eventItem
      ),
    }));
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem" }}>Night Sky Data Manager</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Build the next Night Sky workflow safely. The structured editor saves separately and does not replace the live JSON feed yet.
          </p>
        </div>
      </div>

      {feedback ? (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.8rem 1rem",
            borderRadius: "8px",
            border: feedback.type === "success" ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)",
            background: feedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            color: feedback.type === "success" ? "#86efac" : "#fca5a5",
            fontSize: "0.85rem",
          }}
        >
          {feedback.message}
        </div>
      ) : null}

      <div style={{ padding: "1.5rem", background: "rgba(15, 22, 40, 0.4)", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", color: "var(--gold)", marginBottom: "0.35rem" }}>Night Sky Builder</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>This structured editor is now the primary control surface. Legacy fallback data is retained internally for safety.</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              <input
                type="checkbox"
                checked={structuredDraft.isEnabled}
                onChange={(event) => setStructuredDraft((current) => ({ ...current, isEnabled: event.target.checked }))}
              />
              Enable Night Sky Page
            </label>
            <select
              value={structuredDraft.mode}
              onChange={(event) => setStructuredDraft((current) => ({ ...current, mode: event.target.value as NightSkySettings["mode"] }))}
              style={{ ...inputStyle, width: "180px", cursor: "pointer" }}
            >
              <option value="auto">Auto</option>
              <option value="hybrid">Hybrid</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gap: "1.25rem" }}>
          <div style={{ padding: "1rem", border: "1px solid var(--border-subtle)", borderRadius: "10px", background: "rgba(8,12,22,0.35)" }}>
            <h4 style={{ marginBottom: "0.85rem", color: "var(--gold)" }}>Moon</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
              <input value={structuredDraft.moon.phase} onChange={(event) => updateMoon("phase", event.target.value)} placeholder="Phase" style={inputStyle} />
              <input value={structuredDraft.moon.illumination} onChange={(event) => updateMoon("illumination", event.target.value)} type="number" min="0" max="100" placeholder="Illumination %" style={inputStyle} />
              <input value={structuredDraft.moon.daysUntilFull} onChange={(event) => updateMoon("daysUntilFull", event.target.value)} type="number" min="0" placeholder="Days until full" style={inputStyle} />
            </div>
          </div>

          <div style={{ padding: "1rem", border: "1px solid var(--border-subtle)", borderRadius: "10px", background: "rgba(8,12,22,0.35)" }}>
            <h4 style={{ marginBottom: "0.85rem", color: "var(--gold)" }}>Planets</h4>
            <div style={{ display: "grid", gap: "0.9rem" }}>
              {structuredDraft.planets.map((planet, index) => (
                <div key={planet.id || `planet-${index}`} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", padding: "0.9rem", borderRadius: "8px", background: "rgba(15,22,40,0.4)" }}>
                  <input value={planet.name} onChange={(event) => updatePlanet(index, "name", event.target.value)} placeholder="Planet name" style={inputStyle} />
                  <select value={planet.isNakedEyeVisible ? "true" : "false"} onChange={(event) => updatePlanet(index, "isNakedEyeVisible", event.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="true">Visible</option>
                    <option value="false">Not visible</option>
                  </select>
                  <input value={planet.riseTime} onChange={(event) => updatePlanet(index, "riseTime", event.target.value)} type="time" style={inputStyle} />
                  <input value={planet.setTime} onChange={(event) => updatePlanet(index, "setTime", event.target.value)} type="time" style={inputStyle} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "1rem", border: "1px solid var(--border-subtle)", borderRadius: "10px", background: "rgba(8,12,22,0.35)" }}>
            <h4 style={{ marginBottom: "0.85rem", color: "var(--gold)" }}>Events</h4>
            <div style={{ display: "grid", gap: "0.9rem" }}>
              {structuredDraft.upcomingEvents.map((eventItem, index) => (
                <div key={eventItem.id || `event-${index}`} style={{ display: "grid", gap: "0.75rem", padding: "0.9rem", borderRadius: "8px", background: "rgba(15,22,40,0.4)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                    <input value={eventItem.title} onChange={(event) => updateEvent(index, "title", event.target.value)} placeholder="Event title" style={inputStyle} />
                    <input value={eventItem.dateStr} onChange={(event) => updateEvent(index, "dateStr", event.target.value)} type="date" style={inputStyle} />
                  </div>
                  <textarea value={eventItem.description} onChange={(event) => updateEvent(index, "description", event.target.value)} rows={3} placeholder="Description" style={{ ...inputStyle, resize: "vertical" }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: 0 }}>
            Last structured update: {structuredDraft.lastUpdated ? new Date(structuredDraft.lastUpdated).toLocaleString() : "Not saved yet"}
          </p>
          <button
            className="btn-primary"
            disabled={isSavingStructured}
            style={{ fontFamily: "inherit", cursor: "pointer", fontSize: "0.8rem", opacity: isSavingStructured ? 0.7 : 1 }}
            onClick={handleStructuredSave}
          >
            {isSavingStructured ? "Saving..." : "Save Night Sky Settings"}
          </button>
        </div>
      </div>
    </>
  );
}
