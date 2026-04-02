"use client";

import { useState, useEffect } from "react";
import { rowStyle } from "./shared";
import { approveUserAction, rejectUserAction, getAllUsersAction, updateUserRoleAction, deleteUserAction, updateUserMetadataAction } from "@/app/actions/members";

type RoleName = "Member" | "Lead" | "Core Committee" | "Admin";

const ROLE_OPTIONS: { value: RoleName; label: string; color: string }[] = [
  { value: "Member",         label: "Club Member",         color: "var(--text-muted)" },
  { value: "Lead",           label: "Project Lead",        color: "#3b82f6" },
  { value: "Core Committee", label: "Core Committee",      color: "var(--gold)" },
  { value: "Admin",          label: "Administrator",       color: "#ef4444" },
];

export default function MembersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [approvingUser, setApprovingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<RoleName>("Member");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsersAction();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async () => {
    if (!approvingUser) return;
    setIsProcessing(true);
    try {
      if (approvingUser.status === "approved") {
        await updateUserRoleAction(approvingUser.id, selectedRole);
      } else {
        await approveUserAction(approvingUser.id, selectedRole);
      }
      setApprovingUser(null);
      fetchUsers();
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
      setSelectedPendingIds(prev => prev.filter(uId => uId !== id));
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert("Failed to reject user: " + (err.message || "Unknown error"));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPendingIds.length === 0) return;
    if (!confirm(`Bulk approve ${selectedPendingIds.length} members with 'Member' role?`)) return;
    setIsProcessing(true);
    try {
      for (const id of selectedPendingIds) {
        await approveUserAction(id, "Member");
      }
      setSelectedPendingIds([]);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Error occurred during bulk approval.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedPendingIds.length === 0) return;
    if (!confirm(`Bulk reject ${selectedPendingIds.length} members?`)) return;
    setIsProcessing(true);
    try {
      for (const id of selectedPendingIds) {
        await rejectUserAction(id);
      }
      setSelectedPendingIds([]);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Error occurred during bulk rejection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectPending = (id: string) => {
    setSelectedPendingIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Filter Logic
  const filteredUsers = users.filter(u => {
    const s = searchQuery.toLowerCase();
    return (u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
  });

  const pendingUsers   = filteredUsers.filter((u) => u.status === "pending");
  const processedUsers = filteredUsers.filter((u) => u.status !== "pending");

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem" }}>User Management</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>Unified Directory & Approvals</p>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <input 
          type="text" 
          placeholder="Search members by name or email..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(15, 22, 40, 0.5)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }}
        />
      </div>

      {/* ── Approval Dialog ── */}
      {approvingUser && (
        <div style={{ padding: "1.5rem", background: "rgba(34, 197, 94, 0.1)", border: "1px solid #22c55e", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", color: "#22c55e" }}>
            {approvingUser.status === "approved" ? "Update Role:" : "Approve:"} {approvingUser.name}
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
              {isProcessing ? "Processing…" : (approvingUser.status === "approved" ? "Save Role" : "Confirm Approval")}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>
          Pending Requests ({pendingUsers.length})
        </h3>
        
        {selectedPendingIds.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={handleBulkApprove} disabled={isProcessing} className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", background: "#22c55e", borderColor: "#22c55e" }}>Bulk Approve (Member)</button>
            <button onClick={handleBulkReject} disabled={isProcessing} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.5)", background: "transparent" }}>Bulk Reject</button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "3rem" }}>
        {pendingUsers.map((user) => (
          <div key={user.id} style={{ ...rowStyle, padding: "1.2rem", borderLeft: selectedPendingIds.includes(user.id) ? "4px solid var(--gold)" : "4px solid transparent" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <input 
                type="checkbox" 
                checked={selectedPendingIds.includes(user.id)} 
                onChange={() => toggleSelectPending(user.id)}
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--gold)" }}
              />
              <div>
                <h4 style={{ fontSize: "1.05rem", marginBottom: "0.3rem" }}>{user.name}</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  {user.email} {user.phone ? `• ${user.phone}` : ""}
                </p>
                <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(234,179,8,0.2)", color: "#eab308", marginTop: "0.5rem", display: "inline-block" }}>
                  PENDING REVIEW
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => { setApprovingUser(user); setSelectedRole("Member"); window.scrollTo(0, 0); }}
                style={{ background: "#22c55e", color: "#000", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit", fontWeight: "bold", border: "none" }}
              >
                Approve Target
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
            No pending accounts match criteria.
          </p>
        )}
      </div>

      {/* ── Account Directory ── */}
      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--text-secondary)" }}>Account Directory ({processedUsers.length})</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {processedUsers.map((user) => {
          const roleOpt = ROLE_OPTIONS.find((o) => o.label.toLowerCase() === user.role?.toLowerCase())
            || ROLE_OPTIONS[0];
          return (
            <div key={user.id} style={{ ...rowStyle, padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                  {user.name.charAt(0).toUpperCase()}
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
                    {user.roleId ? user.role : "member"} role
                  </div>
                )}
                {user.responsibility && (
                  <div style={{ fontSize: "0.68rem", marginTop: "0.15rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    {user.responsibility}{user.department ? ` • ${user.department}` : ""}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "1rem", flexWrap: "wrap" }}>
                {/* isPublic toggle */}
                <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: user.isPublic ? "#22c55e" : "var(--text-muted)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!user.isPublic}
                    onChange={async () => {
                      try {
                        await updateUserMetadataAction(user.id, { isPublic: !user.isPublic });
                        fetchUsers();
                      } catch (err: any) { alert(err.message); }
                    }}
                    style={{ accentColor: "var(--gold)" }}
                  />
                  Public
                </label>
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    const newResp = prompt("Responsibility (shown on About page):", user.responsibility || "");
                    if (newResp === null) return;
                    const newDept = prompt("Department:", user.department || "");
                    if (newDept === null) return;
                    updateUserMetadataAction(user.id, { responsibility: newResp, department: newDept }).then(() => fetchUsers()).catch((e: any) => alert(e.message));
                  }}
                  style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--gold)", padding: "0.3rem 0.6rem", borderRadius: "4px", cursor: isProcessing ? "not-allowed" : "pointer", fontSize: "0.7rem", opacity: isProcessing ? 0.5: 1 }}
                >
                  Edit Info
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setApprovingUser(user);
                    const matchingOpt = ROLE_OPTIONS.find((o) => o.label.toLowerCase() === user.role?.toLowerCase() || o.value.toLowerCase() === user.role?.toLowerCase());
                    setSelectedRole(matchingOpt ? matchingOpt.value : "Member");
                    window.scrollTo(0, 0);
                  }}
                  style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", padding: "0.3rem 0.6rem", borderRadius: "4px", cursor: isProcessing ? "not-allowed" : "pointer", fontSize: "0.7rem", opacity: isProcessing ? 0.5: 1 }}
                >
                  Edit Role
                </button>
                <button
                  disabled={isProcessing}
                  onClick={async () => {
                    if (!confirm("Are you sure you want to permanently delete this user?")) return;
                    setIsProcessing(true);
                    try {
                      await deleteUserAction(user.id);
                      fetchUsers();
                    } catch (err: any) {
                      alert(err.message);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444", padding: "0.3rem 0.6rem", borderRadius: "4px", cursor: isProcessing ? "not-allowed" : "pointer", fontSize: "0.7rem", opacity: isProcessing ? 0.5: 1 }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {processedUsers.length === 0 && (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            No users match criteria.
          </p>
        )}
      </div>
    </>
  );
}
