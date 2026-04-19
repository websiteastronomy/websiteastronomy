"use client";

import { useEffect, useState } from "react";
import { getStorageRulesAction, updateStorageRulesAction } from "@/app/actions/storage";
import AuditLogsPanel from "./AuditLogsPanel";

type EditableRule = {
  maxFileSizeMb: number;
  allowedFileTypes: string;
};

type EditableRules = {
  docs: EditableRule;
  projects: EditableRule;
  forms: EditableRule;
  profile_images: EditableRule;
  outreach_images: EditableRule;
  achievement_images: EditableRule;
};

const defaultRules: EditableRules = {
  docs: { maxFileSizeMb: 100, allowedFileTypes: "*/*" },
  projects: { maxFileSizeMb: 100, allowedFileTypes: "*/*" },
  forms: { maxFileSizeMb: 100, allowedFileTypes: "*/*" },
  profile_images: { maxFileSizeMb: 5, allowedFileTypes: "image/jpeg, image/png, image/webp" },
  outreach_images: { maxFileSizeMb: 15, allowedFileTypes: "image/jpeg, image/png, image/webp" },
  achievement_images: { maxFileSizeMb: 15, allowedFileTypes: "image/jpeg, image/png, image/webp" },
};

function parseAllowedFileTypes(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function SystemSettingsManager() {
  const [rules, setRules] = useState<EditableRules>(defaultRules);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    getStorageRulesAction()
      .then((nextRules) => {
        setRules({
          docs: {
            maxFileSizeMb: nextRules.docs.maxFileSizeMb,
            allowedFileTypes: nextRules.docs.allowedFileTypes.join(", "),
          },
          projects: {
            maxFileSizeMb: nextRules.projects.maxFileSizeMb,
            allowedFileTypes: nextRules.projects.allowedFileTypes.join(", "),
          },
          forms: {
            maxFileSizeMb: nextRules.forms.maxFileSizeMb,
            allowedFileTypes: nextRules.forms.allowedFileTypes.join(", "),
          },
          profile_images: {
            maxFileSizeMb: nextRules.profile_images.maxFileSizeMb,
            allowedFileTypes: nextRules.profile_images.allowedFileTypes.join(", "),
          },
          outreach_images: {
            maxFileSizeMb: nextRules.outreach_images.maxFileSizeMb,
            allowedFileTypes: nextRules.outreach_images.allowedFileTypes.join(", "),
          },
          achievement_images: {
            maxFileSizeMb: nextRules.achievement_images.maxFileSizeMb,
            allowedFileTypes: nextRules.achievement_images.allowedFileTypes.join(", "),
          },
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    for (const [module, config] of Object.entries(rules)) {
      if (config.maxFileSizeMb < 1 || config.maxFileSizeMb > 500) {
        setFeedback({ type: "error", message: `Please enter a value between 1 and 500 for ${module}.` });
        return;
      }
    }

    setFeedback(null);
    setSaving(true);
    try {
      await updateStorageRulesAction({
        docs: {
          maxFileSizeMb: rules.docs.maxFileSizeMb,
          allowedFileTypes: parseAllowedFileTypes(rules.docs.allowedFileTypes),
        },
        projects: {
          maxFileSizeMb: rules.projects.maxFileSizeMb,
          allowedFileTypes: parseAllowedFileTypes(rules.projects.allowedFileTypes),
        },
        forms: {
          maxFileSizeMb: rules.forms.maxFileSizeMb,
          allowedFileTypes: parseAllowedFileTypes(rules.forms.allowedFileTypes),
        },
        profile_images: {
          maxFileSizeMb: rules.profile_images.maxFileSizeMb,
          allowedFileTypes: parseAllowedFileTypes(rules.profile_images.allowedFileTypes),
        },
        outreach_images: {
          maxFileSizeMb: rules.outreach_images.maxFileSizeMb,
          allowedFileTypes: parseAllowedFileTypes(rules.outreach_images.allowedFileTypes),
        },
        achievement_images: {
          maxFileSizeMb: rules.achievement_images.maxFileSizeMb,
          allowedFileTypes: parseAllowedFileTypes(rules.achievement_images.allowedFileTypes),
        },
        general: {
          maxFileSizeMb: 25,
          allowedFileTypes: ["*/*"],
        },
      });
      setFeedback({ type: "success", message: "System settings saved successfully." });
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: "Failed to save: " + error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: "var(--text-muted)" }}>Loading settings...</div>;
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.4rem" }}>System Settings</h2>
      </div>

      {feedback ? (
        <div style={{ marginBottom: "1rem", padding: "0.8rem 1rem", borderRadius: "8px", border: feedback.type === "success" ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)", background: feedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: feedback.type === "success" ? "#86efac" : "#fca5a5", fontSize: "0.85rem" }}>
          {feedback.message}
        </div>
      ) : null}

      <div style={{ background: "rgba(15, 22, 40, 0.4)", borderRadius: "8px", border: "1px solid var(--border-subtle)", padding: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--gold)" }}>File Storage Details</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", maxWidth: "720px" }}>
          {([
            { key: "docs", label: "Documentation uploads" },
            { key: "projects", label: "Project uploads" },
            { key: "forms", label: "Form uploads" },
            { key: "profile_images", label: "Profile images" },
            { key: "outreach_images", label: "Outreach images" },
            { key: "achievement_images", label: "Achievement images" },
          ] as const).map(({ key, label }) => (
            <div key={key} style={{ padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "rgba(15, 22, 40, 0.28)" }}>
              <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", color: "var(--text-primary)" }}>{label}</h4>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                    Maximum File Upload Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={rules[key].maxFileSizeMb}
                    onChange={(event) =>
                      setRules((current) => ({
                        ...current,
                        [key]: {
                          ...current[key],
                          maxFileSizeMb: Number(event.target.value) || 1,
                        },
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "0.8rem 1rem",
                      background: "rgba(15, 22, 40, 0.6)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "6px",
                      color: "var(--text-primary)",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                    Allowed File Types
                  </label>
                  <input
                    type="text"
                    value={rules[key].allowedFileTypes}
                    onChange={(event) =>
                      setRules((current) => ({
                        ...current,
                        [key]: {
                          ...current[key],
                          allowedFileTypes: event.target.value,
                        },
                      }))
                    }
                    placeholder="*/*, .pdf, image/*, application/zip"
                    style={{
                      width: "100%",
                      padding: "0.8rem 1rem",
                      background: "rgba(15, 22, 40, 0.6)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "6px",
                      color: "var(--text-primary)",
                      fontFamily: "inherit",
                    }}
                  />
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    Use comma-separated MIME types or extensions. Example: `image/*, .pdf, application/zip`. Use `*/*` to allow everything.
                  </p>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ fontFamily: "inherit", padding: "0.8rem", fontSize: "0.9rem", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "Saving Configuration..." : "Save Storage Settings"}
          </button>
        </div>
      </div>

      <AuditLogsPanel />
    </>
  );
}
