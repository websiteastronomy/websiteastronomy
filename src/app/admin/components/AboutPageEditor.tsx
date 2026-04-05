"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAboutPageEditorSnapshotAction,
  updateAboutPageControlAction,
  type AboutPageControl,
} from "@/app/actions/about-page-control";
import AdminImageCropUploadField from "@/components/AdminImageCropUploadField";
import { inputStyle } from "./shared";

const EMPTY_CONTROL: AboutPageControl = {
  vision_text: null,
  mission_text: null,
  vision_image: null,
  mission_image: null,
  updated_at: null,
};

export default function AboutPageEditor() {
  const [control, setControl] = useState<AboutPageControl>(EMPTY_CONTROL);
  const [resolvedPreview, setResolvedPreview] = useState({
    vision: { title: "Our Vision", text: "", imageUrl: "" },
    mission: { title: "Our Mission", text: "", imageUrl: "" },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const snapshot = await getAboutPageEditorSnapshotAction();
        if (!cancelled) {
          setControl(snapshot.control);
          setResolvedPreview(snapshot.resolved);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setFeedback({ type: "error", message: "Failed to load About page control." });
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const mergedPreview = useMemo(() => ({
    vision: {
      title: resolvedPreview.vision.title,
      text: control.vision_text ?? resolvedPreview.vision.text,
      imageUrl: control.vision_image ?? resolvedPreview.vision.imageUrl,
    },
    mission: {
      title: resolvedPreview.mission.title,
      text: control.mission_text ?? resolvedPreview.mission.text,
      imageUrl: control.mission_image ?? resolvedPreview.mission.imageUrl,
    },
  }), [control, resolvedPreview]);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      const saved = await updateAboutPageControlAction(control);
      setControl(saved);
      setFeedback({ type: "success", message: "About page control saved safely." });
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to save About page control." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ background: "rgba(15, 22, 40, 0.4)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", display: "grid", gap: "1.5rem" }}>
      <div>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>🌌 About Page Editor</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
          Safe overlay on top of the existing About content. Public UI stays unchanged; this only swaps the data source when values are saved here.
        </p>
      </div>

      {feedback ? (
        <div style={{ padding: "0.8rem 1rem", borderRadius: "8px", border: feedback.type === "success" ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)", background: feedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: feedback.type === "success" ? "#86efac" : "#fca5a5", fontSize: "0.85rem" }}>
          {feedback.message}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Vision Text</label>
          <textarea
            rows={6}
            value={control.vision_text ?? ""}
            onChange={(event) => setControl((current) => ({ ...current, vision_text: event.target.value || null }))}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder={resolvedPreview.vision.text}
          />
          <AdminImageCropUploadField
            label="Vision Image"
            value={control.vision_image ?? resolvedPreview.vision.imageUrl}
            onChange={(value) => setControl((current) => ({ ...current, vision_image: value }))}
            helperText="Upload and crop a replacement image. Leaving it untouched preserves the current About page image."
          />
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Mission Text</label>
          <textarea
            rows={6}
            value={control.mission_text ?? ""}
            onChange={(event) => setControl((current) => ({ ...current, mission_text: event.target.value || null }))}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder={resolvedPreview.mission.text}
          />
          <AdminImageCropUploadField
            label="Mission Image"
            value={control.mission_image ?? resolvedPreview.mission.imageUrl}
            onChange={(value) => setControl((current) => ({ ...current, mission_image: value }))}
            helperText="Crop before save to keep the visual framing consistent with the current About page layout."
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--gold)" }}>Preview Before Save</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {[mergedPreview.vision, mergedPreview.mission].map((section) => (
            <div key={section.title} style={{ border: "1px solid var(--border-subtle)", borderRadius: "14px", overflow: "hidden", background: "rgba(8,12,22,0.55)" }}>
              <div style={{ width: "100%", aspectRatio: "16 / 9", background: "rgba(0,0,0,0.2)" }}>
                {section.imageUrl ? (
                  <img src={section.imageUrl} alt={section.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    No image selected yet
                  </div>
                )}
              </div>
              <div style={{ padding: "1rem" }}>
                <h5 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>{section.title}</h5>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  {section.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" disabled={isSaving} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem" }} onClick={handleSave}>
          {isSaving ? "Saving..." : "Save About Page Control"}
        </button>
      </div>
    </div>
  );
}
