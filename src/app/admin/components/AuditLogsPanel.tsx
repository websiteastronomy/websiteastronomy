"use client";

import { useState, useEffect } from "react";
import { getAuditLogsAction } from "@/app/actions/audit";

export default function AuditLogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogsAction()
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load audit logs:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: "var(--text-muted)" }}>Loading audit logs...</div>;
  }

  return (
    <div style={{ background: 'rgba(15, 22, 40, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '2rem', marginTop: "2rem" }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--gold)', fontFamily: "'Cinzel', serif" }}>
        Governance & Audit Logs
      </h3>
      
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
                <th style={{ padding: "0.8rem", color: "var(--text-secondary)" }}>Entity ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleString()}
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
                  </td>
                  <td style={{ padding: "0.8rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                    {log.targetEntity || "—"}
                  </td>
                  <td style={{ padding: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "0.75rem" }}>
                    {log.entityId ? log.entityId.substring(0, 12) + "..." : "—"}
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
