"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { inputStyle } from "./shared";
import { getActivityLogsAction, type ActivityLogCategory } from "@/app/actions/activity-logs";

const colorMap: Record<string, string> = {
  create: "#22c55e",
  update: "#eab308",
  delete: "#ef4444",
  system: "#3b82f6",
};

const CATEGORY_OPTIONS: Array<{ label: string; value: ActivityLogCategory }> = [
  { label: "All Categories", value: "all" },
  { label: "Authentication", value: "authentication" },
  { label: "Permissions", value: "permissions" },
  { label: "Content", value: "content" },
  { label: "System", value: "system" },
  { label: "Error", value: "error" },
  { label: "Announcements", value: "announcements" },
];

type FilterState = {
  search: string;
  user: string;
  action: string;
  entity: string;
  category: ActivityLogCategory;
  fromDate: string;
  toDate: string;
};

const DEFAULT_FILTERS: FilterState = {
  search: "",
  user: "",
  action: "",
  entity: "",
  category: "all",
  fromDate: "",
  toDate: "",
};

function getRowColor(action: string) {
  if (action.includes("create") || action.includes("approve")) return colorMap.create;
  if (action.includes("delete") || action.includes("reject")) return colorMap.delete;
  if (action.includes("update")) return colorMap.update;
  return colorMap.system;
}

export default function ActivityLogsManager() {
  const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = (nextFilters: FilterState) =>
    startTransition(async () => {
      try {
        setErrorMessage(null);
        const result = await getActivityLogsAction({
          search: nextFilters.search || undefined,
          user: nextFilters.user || undefined,
          action: nextFilters.action || undefined,
          entity: nextFilters.entity || undefined,
          category: nextFilters.category,
          fromDate: nextFilters.fromDate || null,
          toDate: nextFilters.toDate || null,
        });
        setRows(result);
      } catch (error: any) {
        console.error(error);
        setRows([]);
        setErrorMessage(error?.message || "Failed to load activity logs.");
      }
    });

  useEffect(() => {
    load(DEFAULT_FILTERS);
  }, []);

  const filteredCountLabel = useMemo(() => `${rows.length} log entries`, [rows.length]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem" }}>Activity Logs</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{filteredCountLabel}</p>
        </div>
      </div>

      {errorMessage ? (
        <div style={{ marginBottom: "1rem", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: "0.85rem" }}>
          {errorMessage}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.8rem", marginBottom: "1.2rem" }}>
        <input
          value={draftFilters.search}
          onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search user, email, action, entity"
          style={inputStyle}
        />
        <input
          value={draftFilters.user}
          onChange={(event) => setDraftFilters((current) => ({ ...current, user: event.target.value }))}
          placeholder="User name or email"
          style={inputStyle}
        />
        <input
          value={draftFilters.action}
          onChange={(event) => setDraftFilters((current) => ({ ...current, action: event.target.value }))}
          placeholder="Action"
          style={inputStyle}
        />
        <input
          value={draftFilters.entity}
          onChange={(event) => setDraftFilters((current) => ({ ...current, entity: event.target.value }))}
          placeholder="Entity"
          style={inputStyle}
        />
        <select
          value={draftFilters.category}
          onChange={(event) => setDraftFilters((current) => ({ ...current, category: event.target.value as ActivityLogCategory }))}
          style={inputStyle}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={draftFilters.fromDate}
          onChange={(event) => setDraftFilters((current) => ({ ...current, fromDate: event.target.value }))}
          style={inputStyle}
        />
        <input
          type="date"
          value={draftFilters.toDate}
          onChange={(event) => setDraftFilters((current) => ({ ...current, toDate: event.target.value }))}
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
        <button
          className="btn-secondary"
          style={{ cursor: "pointer", fontFamily: "inherit" }}
          onClick={() => {
            load(draftFilters);
          }}
          disabled={isPending}
        >
          {isPending ? "Loading..." : "Apply Filters"}
        </button>
        <button
          className="btn-secondary"
          style={{ cursor: "pointer", fontFamily: "inherit", background: "transparent" }}
          onClick={() => {
            setDraftFilters(DEFAULT_FILTERS);
            load(DEFAULT_FILTERS);
          }}
          disabled={isPending}
        >
          Reset
        </button>
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {rows.map((row) => (
          <div key={row.id} style={{ background: "rgba(15,22,40,0.4)", border: `1px solid ${getRowColor(row.action)}40`, borderLeft: `4px solid ${getRowColor(row.action)}`, borderRadius: "10px", padding: "1rem 1.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <strong style={{ display: "block" }}>{row.action}</strong>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  {row.userName}
                  {row.userEmail ? ` · ${row.userEmail}` : ""}
                  {row.entityType ? ` · ${row.entityType}` : ""}
                  {row.entityId ? ` · ${row.entityId}` : ""}
                </span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                {row.timestamp ? new Date(row.timestamp).toISOString().replace("T", " ").slice(0, 16) : "Unknown time"}
              </span>
            </div>
            <div style={{ marginTop: "0.6rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Category: {row.category} · Role: {row.role || "n/a"} · IP: {row.ipAddress || "unknown"}
            </div>
            {row.details && Object.keys(row.details).length ? (
              <pre style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "8px", background: "rgba(8,12,22,0.55)", color: "var(--text-secondary)", fontSize: "0.75rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {JSON.stringify(row.details, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
        {rows.length === 0 ? (
          <div style={{ color: "var(--text-muted)" }}>
            No logs found for selected filters
          </div>
        ) : null}
      </div>
    </>
  );
}
