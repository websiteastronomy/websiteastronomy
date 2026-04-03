"use client";

import { useEffect, useState, useTransition } from "react";
import { inputStyle } from "./shared";
import { getSystemControlSettingsAction, updateSystemControlSettingsAction } from "@/app/actions/system-control";

export default function SystemControlManager() {
  const [settings, setSettings] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getSystemControlSettingsAction()
      .then(setSettings)
      .catch((error) => {
        console.error(error);
        setFeedback({ type: "error", message: "Failed to load system control settings." });
      });
  }, []);

  if (!settings) {
    return <div style={{ color: "var(--text-muted)" }}>Loading system controls...</div>;
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem" }}>System Control</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Manage maintenance mode, lockdown mode, and public feature availability.</p>
        </div>
      </div>

      {feedback ? (
        <div style={{ marginBottom: "1rem", padding: "0.8rem 1rem", borderRadius: "8px", border: feedback.type === "success" ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)", background: feedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: feedback.type === "success" ? "#86efac" : "#fca5a5", fontSize: "0.85rem" }}>
          {feedback.message}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div style={{ background: "rgba(15,22,40,0.4)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem", color: "var(--gold)" }}>Maintenance Mode</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <input type="checkbox" checked={settings.maintenanceEnabled} onChange={(event) => setSettings((current: any) => ({ ...current, maintenanceEnabled: event.target.checked }))} />
              <span>Enable maintenance mode for public visitors</span>
            </label>
            <input type="datetime-local" value={settings.maintenanceUntil ? settings.maintenanceUntil.slice(0, 16) : ""} onChange={(event) => setSettings((current: any) => ({ ...current, maintenanceUntil: event.target.value || null }))} style={inputStyle} />
            <textarea rows={3} value={settings.maintenanceReason || ""} onChange={(event) => setSettings((current: any) => ({ ...current, maintenanceReason: event.target.value || null }))} placeholder="Reason shown to public visitors" style={{ ...inputStyle, resize: "vertical" }} />
          </div>
        </div>

        <div style={{ background: "rgba(15,22,40,0.4)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem", color: "var(--gold)" }}>Lockdown Mode</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <input type="checkbox" checked={settings.lockdownEnabled} onChange={(event) => setSettings((current: any) => ({ ...current, lockdownEnabled: event.target.checked }))} />
              <span>Restrict access to admins only</span>
            </label>
            <textarea rows={3} value={settings.lockdownReason || ""} onChange={(event) => setSettings((current: any) => ({ ...current, lockdownReason: event.target.value || null }))} placeholder="Reason shown during lockdown" style={{ ...inputStyle, resize: "vertical" }} />
          </div>
        </div>

        <div style={{ background: "rgba(15,22,40,0.4)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1rem", color: "var(--gold)" }}>Feature Toggles</h3>
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {[
              ["quizzesEnabled", "Quizzes"],
              ["observationsEnabled", "Observations"],
              ["eventsEnabled", "Events"],
            ].map(([key, label]) => (
              <label key={key} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={settings.features[key]}
                  onChange={(event) =>
                    setSettings((current: any) => ({
                      ...current,
                      features: { ...current.features, [key]: event.target.checked },
                    }))
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          className="btn-primary"
          disabled={isPending}
          style={{ fontFamily: "inherit", cursor: "pointer", width: "fit-content" }}
          onClick={() =>
            startTransition(async () => {
              try {
                const next = await updateSystemControlSettingsAction(settings);
                setSettings(next);
                setFeedback({ type: "success", message: "System control settings saved successfully." });
              } catch (error: any) {
                console.error(error);
                setFeedback({ type: "error", message: error.message || "Failed to save system control settings." });
              }
            })
          }
        >
          {isPending ? "Saving..." : "Save System Controls"}
        </button>
      </div>
    </>
  );
}
