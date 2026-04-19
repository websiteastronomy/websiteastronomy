"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuditLogsAction } from "@/app/actions/audit";
import { formatDateTimeStable } from "@/lib/format-date";

export default function AuditLogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    action: "",
    entityType: "",
    fromDate: "",
    toDate: "",
  });

  const load = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    try {
      const data = await getAuditLogsAction({
        search: nextFilters.search || undefined,
        action: nextFilters.action || undefined,
        entityType: nextFilters.entityType || undefined,
        fromDate: nextFilters.fromDate || null,
        toDate: nextFilters.toDate || null,
      });
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load(filters);
  }, [filters, load]);

  if (loading) {
    return <div style={{ color: "var(--text-muted)" }}>Loading audit logs...</div>;
  }

  return (
    <div style={{ background: "rgba(15, 22, 40, 0.4)", borderRadius: "8px", border: "1px solid var(--border-subtle)", padding: "2rem", marginTop: "2rem" }}>
      <h3 style={{ fontSize: "1.2rem", marginBottom: "1.5rem", color: "var(--gold)", fontFamily: "'Cinzel', serif" }}>
        Governance & Audit Logs
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search" style={{ padding: "0.65rem 0.8rem", background: "rgba(15,22,40,0.55)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--text-primary)" }} />
        <input value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} placeholder="Action" style={{ padding: "0.65rem 0.8rem", background: "rgba(15,22,40,0.55)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--text-primary)" }} />
        <input value={filters.entityType} onChange={(event) => setFilters((current) => ({ ...current, entityType: event.target.value }))} placeholder="Entity type" style={{ padding: "0.65rem 0.8rem", background: "rgba(15,22,40,0.55)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--text-primary)" }} />
        <input type="date" value={filters.fromDate} onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))} style={{ padding: "0.65rem 0.8rem", background: "rgba(15,22,40,0.55)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--text-primary)" }} />
        <input type="date" value={filters.toDate} onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))} style={{ padding: "0.65rem 0.8rem", background: "rgba(15,22,40,0.55)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "var(--text-primary)" }} />
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <button className="btn-secondary" style={{ cursor: "pointer", fontFamily: "inherit" }} onClick={() => void load(filters)}>
          Apply Filters
        </button>
        <button
          className="btn-secondary"
          style={{ cursor: "pointer", fontFamily: "inherit", background: "transparent" }}
          onClick={() => {
            const reset = { search: "", action: "", entityType: "", fromDate: "", toDate: "" };
            setFilters(reset);
            void load(reset);
          }}
        >
          Reset
        </button>
      </div>
      
      {logs.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No audit events recorded yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                <th style={{ padding: "0.8rem", color: "var(--text-secondary)" }}>Timestamp</th>
                <th style={{ padding: "0.8rem", color: "var(--text-secondary)" }}>Actor</th>
                <th style={{ padding: "0.8rem", color: "var(--text-secondary)" }}>Action</th>
                <th style={{ padding: "0.8rem", color: "var(--text-secondary)" }}>Target</th>
                <th style={{ padding: "0.8rem", color: "var(--text-secondary)" }}>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", verticalAlign: "top" }}>
                  <td style={{ padding: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {formatDateTimeStable(log.createdAt)}
                  </td>
                  <td style={{ padding: "0.8rem" }}>
                    {log.actorName ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>{log.actorName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.actorEmail}</div>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>System</span>
                    )}
                  </td>
                  <td style={{ padding: "0.8rem" }}>
                    <span style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                      {log.action}
                    </span>
                    <div style={{ marginTop: "0.4rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Role: {log.role || "n/a"} · IP: {log.ipAddress || "unknown"}
                    </div>
                  </td>
                  <td style={{ padding: "0.8rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                    <div>{log.targetEntity || "-"}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--text-muted)" }}>{log.entityId || "-"}</div>
                  </td>
                  <td style={{ padding: "0.8rem", color: "var(--text-muted)", fontSize: "0.75rem", maxWidth: "360px" }}>
                    {log.metadata && Object.keys(log.metadata).length ? (
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(log.metadata, null, 2)}</pre>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
