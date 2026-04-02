"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPendingApprovalsAction, castVoteAction } from "@/app/actions/approvals";

export default function ApprovalsPanel({ userRole, userId }: { userRole: string, userId: string }) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPendingApprovalsAction()
      .then(data => {
        setApprovals(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleVote = async (id: string, vote: 'approve' | 'reject') => {
    try {
      await castVoteAction(id, vote);
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ color: "var(--gold)" }}>Loading approvals...</div>;

  return (
    <div style={{ padding: "1.5rem", background: "rgba(11,16,30,0.6)", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
      <h3 style={{ fontSize: "1.2rem", color: "var(--gold)", marginBottom: "1.5rem", fontFamily: "'Cinzel', serif" }}>
        Pending Governance Approvals
      </h3>

      {approvals.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No pending approvals requiring your attention.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <AnimatePresence>
            {approvals.map(approval => (
              <motion.div
                key={approval.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: "rgba(15,22,40,0.8)", border: "1px solid var(--border-subtle)",
                  borderRadius: "10px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center"
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                    Action: <span style={{ color: "var(--gold)" }}>{approval.targetAction}</span>
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Target: {approval.targetEntityId}</p>
                  <p style={{ fontSize: "0.8rem", color: "#3b82f6", marginTop: "0.4rem" }}>Current Votes: {approval.votes} / 3</p>
                </div>
                
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => handleVote(approval.id, 'approve')} className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", background: "#22c55e", borderColor: "#22c55e" }}>
                    ✓ Approve
                  </button>
                  <button onClick={() => handleVote(approval.id, 'reject')} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                    ✗ Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
