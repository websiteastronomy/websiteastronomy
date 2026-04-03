"use client";

import { useState } from "react";
import { processCoreVoteAction } from "@/app/actions/observations-engine";

export default function CoreReviewList({ queue, currentUserId }: { queue: any[], currentUserId: string }) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});

  const handleVote = async (id: string, vote: "approve" | "reject") => {
    if (vote === "reject" && !rejectReasonMap[id]) {
      alert("You must provide a rejection reason in the notes box below.");
      return;
    }
    
    setProcessingId(id);
    try {
      await processCoreVoteAction(id, vote, vote === "reject" ? rejectReasonMap[id] : undefined);
    } catch (err) {
      alert("Vote failed. Check console.");
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {queue.map((obs) => {
        const hasApproved = (obs.approvals as string[]).includes(currentUserId);
        const hasRejected = (obs.rejections as string[]).includes(currentUserId);

        return (
          <div key={obs.id} style={{
            background: "rgba(15, 22, 40, 0.6)", 
            borderRadius: "16px", 
            border: "1px solid var(--border-subtle)", 
            padding: "2rem",
            display: "flex", gap: "2rem", flexDirection: "column"
          }}>
            <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
              {/* Media */}
              <div style={{ flexShrink: 0, width: "300px" }}>
                {obs.imageCompressedUrl ? (
                  <a href={obs.imageOriginalUrl} target="_blank" rel="noopener noreferrer">
                    <img src={obs.imageCompressedUrl} alt="Target" style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--border-subtle)" }} />
                  </a>
                ) : (
                  <div style={{ height: "200px", background: "#000", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>No Image</div>
                )}
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "center" }}>Click to open Full Resolution</p>
              </div>

              {/* Data */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.5rem", margin: 0, display: "flex", alignItems: "center", gap: "1rem" }}>
                      {obs.title}
                      <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem", background: "var(--background-alt)", border: "1px solid var(--border-subtle)", borderRadius: "12px", color: "var(--gold)" }}>
                        {obs.status.replace("_", " ")}
                      </span>
                    </h2>
                    <p style={{ color: "var(--text-muted)", margin: 0 }}>Target: {obs.celestialTarget} | Category: {obs.category}</p>
                  </div>
                </div>

                <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>{obs.description || "No description provided."}</p>
                  <hr style={{ border: 0, borderTop: "1px solid var(--border-subtle)", margin: "0.8rem 0" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <div><strong>Equip:</strong> {obs.equipment || "N/A"}</div>
                    <div><strong>Exposure:</strong> {obs.exposureTime || "N/A"}</div>
                    <div><strong>Captured:</strong> {new Date(obs.capturedAt).toLocaleDateString()}</div>
                    <div><strong>Location:</strong> {obs.location}</div>
                  </div>
                </div>

                {/* Governance Tracks */}
                <div style={{ display: "flex", gap: "2rem", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                  <div style={{ color: "var(--text-muted)" }}>
                    <strong style={{ color: "#22c55e" }}>Approvals:</strong> {(obs.approvals as string[]).length}/2 Required
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>
                    <strong style={{ color: "#ef4444" }}>Rejections:</strong> {(obs.rejections as string[]).length}
                  </div>
                </div>

                {/* Reject Input */}
                <textarea 
                  className="input-field" 
                  placeholder="Rejection reason (Required if rejecting)..."
                  value={rejectReasonMap[obs.id] || ""}
                  onChange={(e) => setRejectReasonMap({ ...rejectReasonMap, [obs.id]: e.target.value })}
                  style={{ width: "100%", minHeight: "60px", marginBottom: "1rem", fontSize: "0.9rem" }}
                  disabled={hasApproved || hasRejected}
                />

                {/* Action Frame */}
                {hasApproved ? (
                   <div style={{ padding: "1rem", background: "rgba(34, 197, 94, 0.1)", color: "#4ade80", border: "1px solid #22c55e", borderRadius: "8px", textAlign: "center" }}>
                     ✓ You approved this observation. Evaluating consensus...
                   </div>
                ) : hasRejected ? (
                   <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", border: "1px solid #ef4444", borderRadius: "8px", textAlign: "center" }}>
                     ✗ You rejected this observation. Evaluating consensus...
                   </div>
                ) : (
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button 
                      className="btn-secondary" 
                      style={{ flex: 1, borderColor: "#ef4444", color: "#fca5a5" }}
                      onClick={() => handleVote(obs.id, "reject")}
                      disabled={processingId === obs.id}
                    >
                      {processingId === obs.id ? "..." : "✗ Reject"}
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 2, background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none" }}
                      onClick={() => handleVote(obs.id, "approve")}
                      disabled={processingId === obs.id}
                    >
                      {processingId === obs.id ? "Processing..." : "✓ Approve"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
