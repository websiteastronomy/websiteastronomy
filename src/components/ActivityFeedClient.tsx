"use client";

import { useEffect, useState, useTransition } from "react";
import AnimatedSection from "@/components/AnimatedSection";

type ActivityRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  timestamp: string | null;
  details: Record<string, unknown> | null;
};

type ActivityPayload = {
  rows: ActivityRow[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export default function ActivityFeedClient() {
  const [payload, setPayload] = useState<ActivityPayload>({
    rows: [],
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadPage = (page: number) =>
    startTransition(async () => {
      try {
        setErrorMessage(null);
        const { getMyActivityFeedAction } = await import("@/app/actions/activity-logs");
        setPayload(await getMyActivityFeedAction(page, 20));
      } catch (error: any) {
        console.error(error);
        setErrorMessage(error?.message || "Failed to load activity.");
      }
    });

  useEffect(() => {
    loadPage(1);
  }, []);

  return (
    <div className="page-container" style={{ paddingTop: "3rem", paddingBottom: "4rem" }}>
      <AnimatedSection>
        <p className="section-title" style={{ textAlign: "center" }}>Traceability</p>
        <h1 className="page-title"><span className="gradient-text">Activity</span></h1>
        <p style={{ color: "var(--text-muted)", textAlign: "center", maxWidth: "760px", margin: "1rem auto 0" }}>
          A paginated record of your recent actions across the club platform.
        </p>
      </AnimatedSection>

      <div style={{ marginTop: "2rem", background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "1.3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", color: "var(--gold-light)" }}>Recent Activity</h2>
            <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
              {payload.total} recorded action{payload.total === 1 ? "" : "s"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <button
              onClick={() => loadPage(Math.max(1, payload.page - 1))}
              disabled={isPending || payload.page <= 1}
              style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", borderRadius: "8px", padding: "0.55rem 0.85rem", cursor: "pointer", fontFamily: "inherit", opacity: payload.page <= 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Page {payload.page}</span>
            <button
              onClick={() => loadPage(payload.page + 1)}
              disabled={isPending || !payload.hasMore}
              style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", borderRadius: "8px", padding: "0.55rem 0.85rem", cursor: "pointer", fontFamily: "inherit", opacity: !payload.hasMore ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div style={{ marginBottom: "1rem", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: "0.85rem" }}>
            {errorMessage}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {payload.rows.map((row) => (
            <div key={row.id} style={{ padding: "1rem", borderRadius: "12px", background: "rgba(8,12,22,0.45)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{String(row.action).replaceAll("_", " ")}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "0.25rem" }}>
                    {String((row.details?.title as string) || row.entityId || row.entityType || "Resource")}
                  </div>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  {row.timestamp ? new Date(row.timestamp).toLocaleString() : "Unknown time"}
                </div>
              </div>
            </div>
          ))}

          {!isPending && payload.rows.length === 0 ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
              No activity recorded yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
