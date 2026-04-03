"use client";

import { useState, useEffect } from 'react';
import { getAllObservationsForAdminAction, adminFinalizeObservationAction } from '@/app/actions/observations-engine';
import { rowStyle } from './shared';

export default function ObservationsManager() {
  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQueue, setActiveQueue] = useState<"pending" | "core_approved" | "published" | "rejected" | "flagged">("core_approved");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Rejection Modals
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [adminReason, setAdminReason] = useState("");

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = () => {
    setLoading(true);
    getAllObservationsForAdminAction().then(data => {
      setObservations(data);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  };

  const handleAdminDecision = async (id: string, decision: "approve" | "reject", reason?: string) => {
    setProcessingId(id);
    try {
      await adminFinalizeObservationAction(id, decision, reason);
      // Optimistic Update
      setObservations(prev => prev.map(o => {
        if (o.id === id) {
          return { ...o, status: decision === "approve" ? "Published" : "Rejected", adminDecision: decision, rejectionReason: reason || null };
        }
        return o;
      }));
      if (decision === "reject") {
        setRejectingId(null);
        setAdminReason("");
      }
    } catch (err: any) {
      alert("Decision failed: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingObs = observations.filter(o => (o.status === 'Submitted' || o.status === 'Under_Review' || o.status === 'Draft') && o.reportsCount === 0);
  const coreApprovedObs = observations.filter(o => o.status === 'Core_Approved' && o.reportsCount === 0);
  const publishedObs = observations.filter(o => o.status === 'Published' && o.reportsCount === 0);
  const rejectedObs = observations.filter(o => o.status === 'Rejected');
  const flaggedObs = observations.filter(o => o.reportsCount > 0);

  let displayArray = coreApprovedObs;
  if (activeQueue === 'pending') displayArray = pendingObs;
  if (activeQueue === 'published') displayArray = publishedObs;
  if (activeQueue === 'rejected') displayArray = rejectedObs;
  if (activeQueue === 'flagged') displayArray = flaggedObs;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Global Observations Moderation</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Finalize submissions passing through the Core Review pipeline.</p>
        </div>
        <button onClick={fetchQueue} className="btn-secondary" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>Refresh Queue</button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', overflowX: "auto" }}>
        {[
          { id: 'core_approved', label: `Ready for Publish (${coreApprovedObs.length})` },
          { id: 'pending', label: `Under Review/Drafts (${pendingObs.length})` },
          { id: 'flagged', label: `Flagged Content (${flaggedObs.length})` },
          { id: 'published', label: `Published (${publishedObs.length})` },
          { id: 'rejected', label: `Rejected (${rejectedObs.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveQueue(tab.id as any)}
            style={{
              padding: '0.5rem 1rem',
              background: activeQueue === tab.id ? 'var(--gold)' : 'transparent',
              color: activeQueue === tab.id ? '#000' : 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeQueue === tab.id ? 'bold' : 'normal',
              whiteSpace: "nowrap"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* QUEUE */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading Master Layout...</p>
      ) : displayArray.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>No observations in this queue.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {displayArray.map(obs => (
            <div key={obs.id} style={{ ...rowStyle, padding: '1.5rem', alignItems: 'flex-start', flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "1.5rem", flex: 1, minWidth: "300px" }}>
                {/* Thumbnail */}
                <div style={{ width: "120px", height: "120px", borderRadius: "8px", overflow: "hidden", background: "#000", flexShrink: 0 }}>
                  {obs.imageThumbnailUrl ? (
                    <a href={obs.imageOriginalUrl} target="_blank" rel="noopener noreferrer">
                      <img src={obs.imageThumbnailUrl} alt={obs.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </a>
                  ) : <div style={{ textAlign: "center", paddingTop: "50px", fontSize: "0.8rem", color: "gray" }}>No Image</div>}
                </div>

                {/* Data */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.3rem 0" }}>{obs.title}</h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                    <strong>Target:</strong> {obs.celestialTarget} | <strong>Observer:</strong> {obs.observerId.slice(0,8)} | <strong>Category:</strong> {obs.category}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem" }}>
                    <span><strong>Captured:</strong> {new Date(obs.capturedAt).toLocaleDateString()}</span>
                    <span><strong>Location:</strong> {obs.location}</span>
                    <span><strong>Ver:</strong> {obs.versionNumber}</span>
                  </div>

                  {/* Core Review Stats */}
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.8rem", borderRadius: "8px", display: "flex", gap: "1.5rem", fontSize: "0.85rem", alignItems: "center" }}>
                    <div>
                      <span style={{ color: "#4ade80", fontWeight: "bold" }}>Core Approvals:</span> {obs.approvals.length}
                    </div>
                    <div>
                      <span style={{ color: "#fca5a5", fontWeight: "bold" }}>Core Rejections:</span> {obs.rejections.length}
                    </div>
                    <div>
                      <span style={{ background: "var(--background-alt)", border: "1px solid var(--border-subtle)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                        Status: <strong style={{ color: "var(--gold)" }}>{obs.status.replace("_", " ")}</strong>
                      </span>
                    </div>
                  </div>
                  
                  {obs.rejectionReason && (
                    <div style={{ marginTop: "0.8rem", color: "#fca5a5", fontSize: "0.8rem" }}>
                      <strong>Reason for Flag/Rejection:</strong> {obs.rejectionReason}
                    </div>
                  )}

                  {obs.reportsCount > 0 && (
                    <div style={{ marginTop: "0.8rem", color: "#fb923c", fontSize: "0.85rem", background: "rgba(251,146,60,0.1)", padding: "0.5rem", borderRadius: "4px", borderLeft: "3px solid #fb923c" }}>
                      <strong>⚠️ Community Reports:</strong> {obs.reportsCount}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Box */}
              <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "0.5rem", paddingLeft: "1rem", borderLeft: "1px solid var(--border-subtle)" }}>
                {rejectingId === obs.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <textarea 
                      placeholder="Required rejection reason..." 
                      className="input-field" 
                      style={{ fontSize: "0.8rem", minHeight: "60px" }}
                      value={adminReason} 
                      onChange={(e) => setAdminReason(e.target.value)}
                    />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn-secondary" style={{ fontSize: "0.75rem", flex: 1, padding: "0.4rem" }} onClick={() => setRejectingId(null)}>Cancel</button>
                      <button 
                        className="btn-primary" 
                        style={{ fontSize: "0.75rem", flex: 1, padding: "0.4rem", background: "#ef4444", borderColor: "#ef4444" }} 
                        onClick={() => handleAdminDecision(obs.id, "reject", adminReason)}
                        disabled={!adminReason || processingId === obs.id}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {obs.status !== "Published" && (
                      <button 
                        className="btn-primary" 
                        style={{ background: "#22c55e", borderColor: "#22c55e", fontSize: "0.85rem" }}
                        onClick={() => handleAdminDecision(obs.id, "approve")}
                        disabled={processingId === obs.id}
                      >
                        ✓ Final Publish {obs.status === "Draft" || obs.status === "Submitted" ? "(Override)" : ""}
                      </button>
                    )}
                    {obs.status === "Published" && (
                       <button 
                       className="btn-secondary" 
                       style={{ borderColor: "#fb923c", color: "#fb923c", fontSize: "0.85rem" }}
                       onClick={() => handleAdminDecision(obs.id, "approve")} // In a real app we'd have an 'Ignore Reports' action, for now we re-approve
                       disabled={processingId === obs.id || obs.reportsCount === 0}
                     >
                       Ignore Reports
                     </button>
                    )}
                    {obs.status !== "Rejected" && (
                      <button 
                        className="btn-secondary" 
                        style={{ borderColor: "#ef4444", color: "#fca5a5", fontSize: "0.85rem" }}
                        onClick={() => setRejectingId(obs.id)}
                        disabled={processingId === obs.id}
                      >
                        ✗ Reject Overwrite
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
