"use client";

import { useEffect, useState } from "react";
import {
  getCoreReviewQueueAction,
  processCoreVoteAction,
} from "@/app/actions/observations-engine";
import { formatDateStable } from "@/lib/format-date";

export default function CoreObservationsManager() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});

  const fetchQueue = () => {
    setLoading(true);
    getCoreReviewQueueAction()
      .then((data) => {
        console.log(
          "[admin] CoreObservationsManager.fetchQueue",
          data.map((obs) => ({
            id: obs.id,
            status: obs.status,
            assignedReviewers: obs.assignedReviewers,
          }))
        );
        setQueue(data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleVote = async (id: string, vote: "approve" | "reject") => {
    if (vote === "reject" && !rejectReasonMap[id]) {
      alert("You must provide a rejection reason in the notes box below.");
      return;
    }

    setProcessingId(id);
    try {
      await processCoreVoteAction(
        id,
        vote,
        vote === "reject" ? rejectReasonMap[id] : undefined
      );
      if (vote === "reject") {
        setRejectReasonMap((previous) => ({ ...previous, [id]: "" }));
      }
      fetchQueue();
    } catch (error) {
      console.error(error);
      alert("Vote failed. Check console.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem" }}>Observation Review Queue</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Review assigned submissions and push them forward with core consensus.
          </p>
        </div>
        <button onClick={fetchQueue} className="btn-secondary" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
          Refresh Queue
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading review queue...</p>
      ) : queue.length === 0 ? (
        <p style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
          No observations are currently assigned to you for review.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {queue.map((obs) => (
            <div
              key={obs.id}
              style={{
                background: "rgba(15, 22, 40, 0.6)",
                borderRadius: "16px",
                border: "1px solid var(--border-subtle)",
                padding: "1.5rem",
                display: "flex",
                gap: "1.5rem",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ width: "140px", height: "140px", borderRadius: "8px", overflow: "hidden", background: "#000", flexShrink: 0 }}>
                {obs.imageThumbnailUrl ? (
                  <a href={obs.imageOriginalUrl} target="_blank" rel="noopener noreferrer">
                    <img src={obs.imageThumbnailUrl} alt={obs.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </a>
                ) : (
                  <div style={{ textAlign: "center", paddingTop: "58px", fontSize: "0.8rem", color: "gray" }}>No Image</div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: "320px" }}>
                <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.4rem 0" }}>{obs.title}</h3>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.8rem" }}>
                  <strong>Target:</strong> {obs.celestialTarget} | <strong>Category:</strong> {obs.category}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                  <span><strong>Captured:</strong> {formatDateStable(obs.capturedAt)}</span>
                  <span><strong>Location:</strong> {obs.location}</span>
                  <span><strong>Equipment:</strong> {obs.equipment || "N/A"}</span>
                  <span><strong>Status:</strong> {obs.status.replace("_", " ")}</span>
                </div>

                <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.8rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem" }}>
                  {obs.description || "No description provided."}
                </div>

                <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  <div>
                    <span style={{ color: "#4ade80", fontWeight: "bold" }}>Approvals:</span> {Array.isArray(obs.approvals) ? obs.approvals.length : 0}
                  </div>
                  <div>
                    <span style={{ color: "#fca5a5", fontWeight: "bold" }}>Rejections:</span> {Array.isArray(obs.rejections) ? obs.rejections.length : 0}
                  </div>
                </div>

                <textarea
                  className="input-field"
                  placeholder="Rejection reason (required if rejecting)..."
                  value={rejectReasonMap[obs.id] || ""}
                  onChange={(event) =>
                    setRejectReasonMap((previous) => ({
                      ...previous,
                      [obs.id]: event.target.value,
                    }))
                  }
                  style={{ width: "100%", minHeight: "70px", marginBottom: "1rem", fontSize: "0.9rem" }}
                  disabled={processingId === obs.id}
                />

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, borderColor: "#ef4444", color: "#fca5a5" }}
                    onClick={() => handleVote(obs.id, "reject")}
                    disabled={processingId === obs.id}
                  >
                    {processingId === obs.id ? "..." : "Reject"}
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 2, background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none" }}
                    onClick={() => handleVote(obs.id, "approve")}
                    disabled={processingId === obs.id}
                  >
                    {processingId === obs.id ? "Processing..." : "Approve"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
