"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getHighlightContentOptionsAction,
  getHighlightsControlAction,
  updateHighlightsControlAction,
  type HighlightContentOption,
  type HighlightMode,
  type ManualHighlightItem,
} from "@/app/actions/highlights-control";
import { inputStyle } from "./shared";

type HighlightsControlState = {
  highlight_mode: HighlightMode;
  manual_highlights: ManualHighlightItem[];
};

export default function HighlightsControlManager() {
  const [control, setControl] = useState<HighlightsControlState>({ highlight_mode: "auto", manual_highlights: [] });
  const [options, setOptions] = useState<HighlightContentOption[]>([]);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [nextControl, nextOptions] = await Promise.all([
          getHighlightsControlAction(),
          getHighlightContentOptionsAction(),
        ]);

        if (!cancelled) {
          setControl(nextControl);
          setOptions(nextOptions);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setFeedback({ type: "error", message: "Failed to load highlights control." });
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const optionMap = useMemo(() => new Map(options.map((option) => [`${option.type}:${option.id}`, option])), [options]);

  const filteredOptions = useMemo(() => {
    const selected = new Set(control.manual_highlights.map((item) => `${item.type}:${item.id}`));
    const search = query.trim().toLowerCase();

    return options
      .filter((option) => !selected.has(`${option.type}:${option.id}`))
      .filter((option) => {
        if (!search) return true;
        return [option.title, option.subtitle, option.type].some((value) => value.toLowerCase().includes(search));
      })
      .slice(0, 12);
  }, [control.manual_highlights, options, query]);

  const orderedManualHighlights = useMemo(() => {
    return [...control.manual_highlights].sort((a, b) => b.priority - a.priority || a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
  }, [control.manual_highlights]);

  const handleAdd = (option: HighlightContentOption) => {
    setControl((current) => ({
      ...current,
      manual_highlights: [
        ...current.manual_highlights,
        {
          id: option.id,
          type: option.type,
          priority: current.manual_highlights.length ? Math.max(...current.manual_highlights.map((item) => item.priority)) + 1 : 100,
        },
      ],
    }));
  };

  const handlePriorityChange = (id: string, type: ManualHighlightItem["type"], priority: number) => {
    setControl((current) => ({
      ...current,
      manual_highlights: current.manual_highlights.map((item) =>
        item.id === id && item.type === type ? { ...item, priority: Number.isFinite(priority) ? Math.trunc(priority) : 0 } : item
      ),
    }));
  };

  const handleRemove = (id: string, type: ManualHighlightItem["type"]) => {
    setControl((current) => ({
      ...current,
      manual_highlights: current.manual_highlights.filter((item) => !(item.id === id && item.type === type)),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      const saved = await updateHighlightsControlAction(control);
      setControl(saved);
      setFeedback({ type: "success", message: "Highlights control saved safely." });
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to save highlights control." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ background: "rgba(15, 22, 40, 0.4)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", display: "grid", gap: "1.5rem" }}>
      <div>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>⭐ Highlights Control</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
          Adds a safe control layer on top of the existing highlight auto-pick system. Auto mode remains unchanged.
        </p>
      </div>

      {feedback ? (
        <div style={{ padding: "0.8rem 1rem", borderRadius: "8px", border: feedback.type === "success" ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)", background: feedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: feedback.type === "success" ? "#86efac" : "#fca5a5", fontSize: "0.85rem" }}>
          {feedback.message}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {(["auto", "hybrid", "manual"] as HighlightMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setControl((current) => ({ ...current, highlight_mode: mode }))}
            style={{
              padding: "0.65rem 1rem",
              borderRadius: "999px",
              border: control.highlight_mode === mode ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
              background: control.highlight_mode === mode ? "rgba(201,168,76,0.14)" : "rgba(8,12,22,0.45)",
              color: control.highlight_mode === mode ? "var(--gold-light)" : "var(--text-secondary)",
              fontSize: "0.82rem",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1rem" }}>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Add Highlight Item</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search published articles, observations, events, or projects"
            style={inputStyle}
          />
          <div style={{ display: "grid", gap: "0.5rem", maxHeight: "320px", overflowY: "auto" }}>
            {filteredOptions.map((option) => (
              <button
                key={`${option.type}:${option.id}`}
                type="button"
                onClick={() => handleAdd(option)}
                style={{
                  display: "grid",
                  gridTemplateColumns: option.image ? "64px 1fr auto" : "1fr auto",
                  gap: "0.85rem",
                  alignItems: "center",
                  padding: "0.75rem",
                  background: "rgba(8,12,22,0.45)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "inherit",
                }}
              >
                {option.image ? (
                  <div style={{ width: "64px", height: "48px", borderRadius: "10px", overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
                    <img src={option.image} alt={option.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : null}
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>{option.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {option.type} • {option.subtitle}
                  </div>
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--gold)" }}>Add</span>
              </button>
            ))}
            {!filteredOptions.length ? (
              <div style={{ padding: "1rem", borderRadius: "12px", border: "1px dashed var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                No matching published content found for the current search.
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Manual Highlights</label>
          <div style={{ display: "grid", gap: "0.5rem", maxHeight: "320px", overflowY: "auto" }}>
            {orderedManualHighlights.map((item) => {
              const option = optionMap.get(`${item.type}:${item.id}`);
              return (
                <div key={`${item.type}:${item.id}`} style={{ padding: "0.85rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", background: "rgba(8,12,22,0.45)", display: "grid", gap: "0.7rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>{option?.title || `${item.type} ${item.id}`}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.type}</div>
                    </div>
                    <button type="button" className="btn-secondary" style={{ background: "transparent", cursor: "pointer", fontSize: "0.75rem" }} onClick={() => handleRemove(item.id, item.type)}>
                      Remove
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Priority</label>
                    <input
                      type="number"
                      value={item.priority}
                      onChange={(event) => handlePriorityChange(item.id, item.type, Number(event.target.value))}
                      style={{ ...inputStyle, maxWidth: "120px" }}
                    />
                  </div>
                </div>
              );
            })}
            {!orderedManualHighlights.length ? (
              <div style={{ padding: "1rem", borderRadius: "12px", border: "1px dashed var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                No manual highlight items selected yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.35rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
        <div>`AUTO` keeps the current highlight logic exactly as-is.</div>
        <div>`HYBRID` puts manual picks first, then fills remaining slots from the current auto logic.</div>
        <div>`MANUAL` shows only the saved manual highlight list.</div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" disabled={isSaving} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem" }} onClick={handleSave}>
          {isSaving ? "Saving..." : "Save Highlights Control"}
        </button>
      </div>
    </div>
  );
}
