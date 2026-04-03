"use client";

import { useState, useEffect } from "react";
import { subscribeToCollection } from "@/lib/db";
import { rowStyle } from "./shared";
import { approveUserAction, rejectUserAction } from "@/app/actions/members";

type RoleName = "Member" | "Lead" | "Core Committee" | "Admin";

const ROLE_OPTIONS: { value: RoleName; label: string; color: string }[] = [
  { value: "Member",         label: "Club Member",         color: "var(--text-muted)" },
  { value: "Lead",           label: "Project Lead",        color: "#3b82f6" },
  { value: "Core Committee", label: "Core Committee",      color: "var(--gold)" },
  { value: "Admin",          label: "Administrator",       color: "#ef4444" },
];

export default function MemberRequests() {
  const [users, setUsers] = useState<any[]>([]);
  const [approvingUser, setApprovingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<RoleName>("Member");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCollection("users", (data) => setUsers(data));
    return () => unsub();
  }, []);

  const handleApprove = async () => {
    if (!approvingUser) return;
    setIsProcessing(true);
    try {
      await approveUserAction(approvingUser.id, selectedRole);
      setApprovingUser(null);
    } catch (err: any) {
      console.error(err);
      alert("Failed to approve user: " + (err.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this user?")) return;
    try {
      await rejectUserAction(id);
    } catch (err: any) {
      console.error(err);
      alert("Failed to reject user: " + (err.message || "Unknown error"));
    }
  };

  const pendingUsers   = users.filter((u) => u.status === "pending");
  const processedUsers = users.filter((u) => u.status !== "pending");

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.4rem" }}>Member Approvals</h2>
      </div>

      {/* ── Approval Dialog ── */}
      {approvingUser && (
        <div style={{ padding: "1.5rem", background: "rgba(34, 197, 94, 0.1)", border: "1px solid #22c55e", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", color: "#22c55e" }}>
            Approve: {approvingUser.name}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
            {approvingUser.email} — assign a Role-Based Access Control level.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer",
                  fontSize: "0.88rem", color: selectedRole === opt.value ? opt.color : "var(--text-secondary)",
                  fontWeight: selectedRole === opt.value ? 700 : 400,
                  padding: "0.4rem 0.75rem", borderRadius: "6px",
                  border: `1px solid ${selectedRole === opt.value ? opt.color : "var(--border-subtle)"}`,
                  background: selectedRole === opt.value ? opt.color + "18" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  type="radio"
                  name="rbac-role"
                  value={opt.value}
                  checked={selectedRole === opt.value}
                  onChange={() => setSelectedRole(opt.value)}
                  style={{ display: "none" }}
                />
                {opt.label}
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.8rem" }}>
            <button
              className="btn-primary"
              disabled={isProcessing}
              onClick={handleApprove}
              style={{ padding: "0.5rem 1.5rem" }}
            >
              {isProcessing ? "Processing…" : "Confirm Approval"}
            </button>
            <button
              className="btn-secondary"
              disabled={isProcessing}
              onClick={() => setApprovingUser(null)}
              style={{ padding: "0.5rem 1.5rem", background: "transparent" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Pending Queue ── */}
      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--text-secondary)" }}>
        Pending Requests ({pendingUsers.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "3rem" }}>
        {pendingUsers.map((user) => (
          <div key={user.id} style={{ ...rowStyle, padding: "1.2rem" }}>
            <div>
              <h4 style={{ fontSize: "1.05rem", marginBottom: "0.3rem" }}>{user.name}</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {user.email} {user.phone ? `• ${user.phone}` : ""}
              </p>
              <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(234,179,8,0.2)", color: "#eab308", marginTop: "0.5rem", display: "inline-block" }}>
                PENDING REVIEW
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => { setApprovingUser(user); setSelectedRole("Member"); window.scrollTo(0, 0); }}
                style={{ background: "#22c55e", color: "#000", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit", fontWeight: "bold" }}
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(user.id)}
                style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit" }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {pendingUsers.length === 0 && (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            No pending accounts to review.
          </p>
        )}
      </div>

      {/* ── Account Directory ── */}
      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--text-secondary)" }}>Account Directory</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {processedUsers.map((user) => {
          const roleOpt = ROLE_OPTIONS.find((o) => o.label.toLowerCase() === user.role?.toLowerCase())
            || ROLE_OPTIONS[0];
          return (
            <div key={user.id} style={{ ...rowStyle, padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", overflow: "hidden" }}>
                  {user.image ? <img src={user.image} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem" }}>{user.name}</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{user.email}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: user.status === "approved" ? "#22c55e" : "#ef4444" }}>
                  {user.status}
                </span>
                {user.status === "approved" && (
                  <div style={{ fontSize: "0.72rem", marginTop: "0.25rem", color: roleOpt.color, fontWeight: 600 }}>
                    {/* Show the normalized RBAC role name if available, fall back to legacy */}
                    {user.roleId ? user.role : "member"} role
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
