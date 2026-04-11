"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addManualHighlightAction,
  getHighlightContentOptionsAction,
  getHighlightsControlAction,
  getManualHighlightDetailsAction,
  removeManualHighlightAction,
  reorderManualHighlightsAction,
  updateHighlightsControlAction,
  type HighlightContentOption,
  type HighlightMode,
  type ManualHighlightOption,
} from "@/app/actions/highlights-control";
import { inputStyle } from "./shared";
import { useAuth } from "@/context/AuthContext";

type HighlightsControlState = {
  highlight_mode: HighlightMode;
};

export default function HighlightsControlManager() {
  const { isAdmin } = useAuth();
  const [control, setControl] = useState<HighlightsControlState>({ highlight_mode: "auto" });
  const [options, setOptions] = useState<HighlightContentOption[]>([]);
  const [manualHighlights, setManualHighlights] = useState<ManualHighlightOption[]>([]);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = () =>
    startTransition(async () => {
      try {
        const [nextControl, nextOptions, nextManual] = await Promise.all([
          getHighlightsControlAction(),
          getHighlightContentOptionsAction(),
          getManualHighlightDetailsAction(),
        ]);

        setControl({ highlight_mode: nextControl.highlight_mode });
        setOptions(nextOptions);
        setManualHighlights(nextManual);
      } catch (error) {
        console.error(error);
        setFeedback({ type: "error", message: "Failed to load highlights control." });
      }
    });

  useEffect(() => {
    load();
  }, []);

  const selectedKeys = useMemo(
    () => new Set(manualHighlights.map((item) => `${item.type}:${item.id}`)),
    [manualHighlights]
  );

  const filteredOptions = useMemo(() => {
    const search = query.trim().toLowerCase();
    return options
      .filter((option) => {
        if (!search) return true;
        return [option.title, option.subtitle, option.type].some((value) => value.toLowerCase().includes(search));
      })
      .slice(0, 20);
  }, [options, query]);

  const mutate = (work: () => Promise<void>) =>
    startTransition(async () => {
      setFeedback(null);
      try {
        await work();
      } catch (error) {
        console.error(error);
        setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to update highlights." });
      }
    });

  const changeMode = (mode: HighlightMode) => {
    if (!isAdmin) return;
    setControl({ highlight_mode: mode });
    mutate(async () => {
      await updateHighlightsControlAction({ highlight_mode: mode });
      setFeedback({ type: "success", message: `Highlights mode switched to ${mode}.` });
    });
  };

  const handleAdd = (option: HighlightContentOption) => {
    if (!isAdmin || selectedKeys.has(`${option.type}:${option.id}`)) return;
    mutate(async () => {
      const next = await addManualHighlightAction(option.id, option.type);
      setControl({ highlight_mode: next.highlight_mode });
      setManualHighlights(await getManualHighlightDetailsAction());
      setFeedback({ type: "success", message: `"${option.title}" added to manual highlights.` });
    });
  };

  const handleRemove = (item: ManualHighlightOption) => {
    if (!isAdmin) return;
    mutate(async () => {
      const next = await removeManualHighlightAction(item.id, item.type);
      setControl({ highlight_mode: next.highlight_mode });
      setManualHighlights(await getManualHighlightDetailsAction());
      setFeedback({ type: "success", message: `"${item.title}" removed from manual highlights.` });
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    if (!isAdmin) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= manualHighlights.length) return;

    const reordered = [...manualHighlights];
    const [current] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, current);
    setManualHighlights(reordered.map((item, itemIndex) => ({ ...item, priority: reordered.length - itemIndex })));

    mutate(async () => {
      const next = await reorderManualHighlightsAction(
        reordered.map((item) => ({ id: item.id, type: item.type }))
      );
      setControl({ highlight_mode: next.highlight_mode });
      setManualHighlights(await getManualHighlightDetailsAction());
      setFeedback({ type: "success", message: "Manual highlight order updated." });
    });
  };

  return (
    <div style={{ background: "rgba(15, 22, 40, 0.4)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", display: "grid", gap: "1.5rem" }}>
      <div>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>Homepage Highlights</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
          Auto mode stays untouched. Manual and hybrid modes now use a persistent ordered highlight list.
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
            disabled={!isAdmin || isPending}
            onClick={() => changeMode(mode)}
            style={{
              padding: "0.65rem 1rem",
              borderRadius: "999px",
              border: control.highlight_mode === mode ? "1px solid var(--gold)" : "1px solid var(--border-subtle)",
              background: control.highlight_mode === mode ? "rgba(201,168,76,0.14)" : "rgba(8,12,22,0.45)",
              color: control.highlight_mode === mode ? "var(--gold-light)" : "var(--text-secondary)",
              fontSize: "0.82rem",
              cursor: isAdmin ? "pointer" : "not-allowed",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              opacity: !isAdmin ? 0.6 : 1,
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1rem" }}>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Search Results</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search published articles, observations, events, or projects"
            style={inputStyle}
          />
          <div style={{ display: "grid", gap: "0.5rem", maxHeight: "360px", overflowY: "auto" }}>
            {filteredOptions.map((option) => {
              const selected = selectedKeys.has(`${option.type}:${option.id}`);
              return (
                <div
                  key={`${option.type}:${option.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: option.image ? "72px 1fr auto" : "1fr auto",
                    gap: "0.85rem",
                    alignItems: "center",
                    padding: "0.8rem",
                    background: "rgba(8,12,22,0.45)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "12px",
                  }}
                >
                  {option.image ? (
                    <div style={{ width: "72px", height: "56px", borderRadius: "10px", overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
                      <img src={option.image} alt={option.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    </div>
                  ) : null}
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>{option.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {option.type} · {option.subtitle}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!isAdmin || selected || isPending}
                    onClick={() => handleAdd(option)}
                    style={{
                      border: selected ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(201,168,76,0.3)",
                      background: selected ? "rgba(34,197,94,0.12)" : "rgba(201,168,76,0.1)",
                      color: selected ? "#86efac" : "var(--gold-light)",
                      borderRadius: "8px",
                      padding: "0.55rem 0.8rem",
                      fontSize: "0.78rem",
                      cursor: selected ? "default" : "pointer",
                      minWidth: "72px",
                      opacity: !isAdmin ? 0.6 : 1,
                    }}
                  >
                    {selected ? "Added" : "Add"}
                  </button>
                </div>
              );
            })}
            {!filteredOptions.length ? (
              <div style={{ padding: "1rem", borderRadius: "12px", border: "1px dashed var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                No matching published content found for the current search.
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Manual Highlights</label>
          <div style={{ display: "grid", gap: "0.5rem", maxHeight: "360px", overflowY: "auto" }}>
            {manualHighlights.map((item, index) => (
              <div key={`${item.type}:${item.id}`} style={{ padding: "0.85rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", background: "rgba(8,12,22,0.45)", display: "grid", gap: "0.8rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: item.image ? "64px 1fr auto" : "1fr auto", gap: "0.75rem", alignItems: "center" }}>
                  {item.image ? (
                    <div style={{ width: "64px", height: "48px", borderRadius: "10px", overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
                      <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    </div>
                  ) : null}
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.type} · Priority {item.priority}</div>
                  </div>
                  <button type="button" disabled={!isAdmin || isPending} onClick={() => handleRemove(item)} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", borderRadius: "8px", padding: "0.45rem 0.7rem", cursor: "pointer", fontSize: "0.75rem" }}>
                    Remove
                  </button>
                </div>
                <div style={{ display: "flex", gap: "0.55rem" }}>
                  <button type="button" disabled={!isAdmin || isPending || index === 0} onClick={() => moveItem(index, -1)} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", borderRadius: "8px", padding: "0.45rem 0.7rem", cursor: "pointer", fontSize: "0.75rem", opacity: index === 0 ? 0.5 : 1 }}>
                    Move Up
                  </button>
                  <button type="button" disabled={!isAdmin || isPending || index === manualHighlights.length - 1} onClick={() => moveItem(index, 1)} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", borderRadius: "8px", padding: "0.45rem 0.7rem", cursor: "pointer", fontSize: "0.75rem", opacity: index === manualHighlights.length - 1 ? 0.5 : 1 }}>
                    Move Down
                  </button>
                </div>
              </div>
            ))}
            {!manualHighlights.length ? (
              <div style={{ padding: "1rem", borderRadius: "12px", border: "1px dashed var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                No manual highlight items selected yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.35rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
        <div>`AUTO` keeps the current highlight logic exactly as-is.</div>
        <div>`HYBRID` shows manual highlights first, then fills the remaining slots from the current auto logic.</div>
        <div>`MANUAL` shows only the persistent manual highlight list.</div>
      </div>
    </div>
  );
}
