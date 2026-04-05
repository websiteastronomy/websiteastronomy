"use client";

import { useState, useEffect } from "react";
import { rowStyle } from "./shared";
import { approveUserAction, rejectUserAction, getAllUsersAction, updateUserRoleAction, deleteUserAction, updateUserMetadataAction, getRolePermissionsCatalogAction, getUserPermissionOverridesAction, updateRolePermissionsAction, updateUserPermissionOverridesAction } from "@/app/actions/members";
import { useAuth } from "@/context/AuthContext";
import { canApproveMembers, canDeleteUser, canEditResponsibility, canEditRole, canTogglePublic } from "@/lib/member-ui-permissions";

type RoleName = "Member" | "Lead" | "Core Committee" | "Admin";

const ROLE_OPTIONS: { value: RoleName; label: string; color: string }[] = [
  { value: "Member",         label: "Club Member",         color: "var(--text-muted)" },
  { value: "Lead",           label: "Project Lead",        color: "#3b82f6" },
  { value: "Core Committee", label: "Core Committee",      color: "var(--gold)" },
  { value: "Admin",          label: "Administrator",       color: "#ef4444" },
];

export default function MembersManager() {
  const { user, refreshRBAC, isAdmin, hasPermission } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [approvingUser, setApprovingUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<RoleName>("Member");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const [pendingBulkAction, setPendingBulkAction] = useState<"approve" | "reject" | null>(null);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);

  // Inline edit state
  const [editingInfoUser, setEditingInfoUser] = useState<string | null>(null);
  const [infoFormData, setInfoFormData] = useState({ responsibility: "", department: "" });
  const [permissionCatalog, setPermissionCatalog] = useState<{ key: string; description: string | null }[]>([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [overrideModes, setOverrideModes] = useState<Record<string, "default" | "allow" | "deny">>({});
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const access = { isAdmin, hasPermission };
  const mayApproveMembers = canApproveMembers(access);
  const mayEditRole = canEditRole(access);
  const mayDeleteUser = canDeleteUser(access);
  const mayEditResponsibility = canEditResponsibility(access);
  const mayTogglePublic = canTogglePublic(access);

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

  useEffect(() => {
    if (!mayEditRole) {
      return;
    }

    getRolePermissionsCatalogAction()
      .then((data) => {
        setPermissionCatalog(data.permissions.map((permission) => ({
          key: permission.key,
          description: permission.description ?? null,
        })));
        setRolePermissionsMap(
          Object.fromEntries(data.roles.map((role) => [role.name, role.permissions]))
        );
      })
      .catch((error) => {
        console.error(error);
      });
  }, [mayEditRole]);

  useEffect(() => {
    if (!approvingUser || !mayEditRole) {
      return;
    }

    const mappedPermissions = rolePermissionsMap[selectedRole];
    if (mappedPermissions && selectedPermissions.length === 0) {
      setSelectedPermissions(mappedPermissions);
    }
  }, [approvingUser, mayEditRole, rolePermissionsMap, selectedPermissions.length, selectedRole]);

  const triggerRoleRefresh = async (targetUserId?: string) => {
    localStorage.setItem("rbac-profile-updated", `${Date.now()}:${targetUserId || "unknown"}`);
    if (targetUserId && user?.id === targetUserId) {
      await refreshRBAC();
    }
  };

  const openRoleEditor = (targetUser: any, fallbackRole: RoleName) => {
    setApprovingUser(targetUser);
    setSelectedRole(fallbackRole);
    setSelectedPermissions(rolePermissionsMap[fallbackRole] || []);
    setOverrideModes({});
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (!approvingUser || !mayEditRole) {
      return;
    }

    setLoadingOverrides(true);
    getUserPermissionOverridesAction(approvingUser.id)
      .then((data) => {
        setOverrideModes(
          Object.fromEntries(
            data.overrides.map((override) => [override.permissionKey, override.mode])
          ) as Record<string, "default" | "allow" | "deny">
        );
      })
      .catch((error) => {
        console.error(error);
        setOverrideModes({});
      })
      .finally(() => setLoadingOverrides(false));
  }, [approvingUser, mayEditRole]);

  const handleApprove = async () => {
    if (!approvingUser) return;
    setFeedback(null);
    setIsProcessing(true);
    try {
      if (approvingUser.status === "approved") {
        await updateUserRoleAction(approvingUser.id, selectedRole);
      } else {
        await approveUserAction(approvingUser.id, selectedRole);
      }
      if (mayEditRole) {
        await updateRolePermissionsAction(selectedRole, selectedPermissions);
        await updateUserPermissionOverridesAction(
          approvingUser.id,
          permissionCatalog.map((permission) => ({
            permissionKey: permission.key,
            mode: overrideModes[permission.key] || "default",
          }))
        );
        const refreshedCatalog = await getRolePermissionsCatalogAction();
        setRolePermissionsMap(
          Object.fromEntries(refreshedCatalog.roles.map((role) => [role.name, role.permissions]))
        );
      }
      await triggerRoleRefresh(approvingUser.id);
      setApprovingUser(null);
      setFeedback({ type: "success", message: approvingUser.status === "approved" ? "Role updated successfully." : "Member approved successfully." });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", message: "Failed to approve user: " + (err.message || "Unknown error") });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setFeedback(null);
    try {
      await rejectUserAction(id);
      setSelectedPendingIds(prev => prev.filter(uId => uId !== id));
      setPendingRejectId(null);
      setFeedback({ type: "success", message: "Member request rejected." });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: "error", message: "Failed to reject user: " + (err.message || "Unknown error") });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPendingIds.length === 0) return;
    setFeedback(null);
    setIsProcessing(true);
    try {
      for (const id of selectedPendingIds) {
        await approveUserAction(id, "Member");
        await triggerRoleRefresh(id);
      }
      setSelectedPendingIds([]);
      setPendingBulkAction(null);
      setFeedback({ type: "success", message: "Selected members approved." });
      fetchUsers();
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Error occurred during bulk approval." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedPendingIds.length === 0) return;
    setFeedback(null);
    setIsProcessing(true);
    try {
      for (const id of selectedPendingIds) {
        await rejectUserAction(id);
      }
      setSelectedPendingIds([]);
      setPendingBulkAction(null);
      setFeedback({ type: "success", message: "Selected member requests rejected." });
      fetchUsers();
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Error occurred during bulk rejection." });
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

      {feedback ? (
        <div style={{
          marginBottom: "1rem",
          padding: "0.9rem 1rem",
          borderRadius: "8px",
          border: `1px solid ${feedback.type === "error" ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
          background: feedback.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          color: feedback.type === "error" ? "#fca5a5" : "#86efac",
          fontSize: "0.85rem",
        }}>
          {feedback.message}
        </div>
      ) : null}

      {/* ── Approval Dialog ── */}
      {approvingUser && mayApproveMembers && (
        <div style={{ padding: "1.5rem", background: "rgba(34, 197, 94, 0.1)", border: "1px solid #22c55e", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", color: "#22c55e" }}>
            {approvingUser.status === "approved" ? "Update Role:" : "Approve:"} {approvingUser.name}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
            {approvingUser.email} — assign a Role-Based Access Control level.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {ROLE_OPTIONS.filter((opt) => mayEditRole || opt.value !== "Admin").map((opt) => (
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
                  onChange={() => {
                    setSelectedRole(opt.value);
                    setSelectedPermissions(rolePermissionsMap[opt.value] || []);
                  }}
                  style={{ display: "none" }}
                />
                {opt.label}
              </label>
            ))}
          </div>

          {mayEditRole && permissionCatalog.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>Role Permissions</h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Changes here update the <strong>{selectedRole}</strong> role for everyone who has it.
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem" }}>
                {permissionCatalog.map((permission) => {
                  const checked = selectedPermissions.includes(permission.key);
                  return (
                    <label
                      key={permission.key}
                      style={{
                        display: "flex",
                        gap: "0.6rem",
                        alignItems: "flex-start",
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)",
                        background: checked ? "rgba(201, 168, 76, 0.08)" : "rgba(15, 22, 40, 0.25)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedPermissions((previous) =>
                            checked
                              ? previous.filter((key) => key !== permission.key)
                              : [...previous, permission.key]
                          )
                        }
                        style={{ accentColor: "var(--gold)", marginTop: "0.15rem" }}
                      />
                      <span>
                        <span style={{ display: "block", fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>
                          {permission.key}
                        </span>
                        <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {permission.description || "Role capability"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {mayEditRole && permissionCatalog.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ marginBottom: "0.9rem" }}>
                <h4 style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>Custom Overrides (Optional)</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Overrides role permissions for this user only.
                </p>
              </div>

              {loadingOverrides ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Loading custom overrides...</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
                  {permissionCatalog.map((permission) => {
                    const mode = overrideModes[permission.key] || "default";
                    const isOverridden = mode !== "default";
                    const isEffective = mode === "allow" ? true : mode === "deny" ? false : selectedPermissions.includes(permission.key);
                    return (
                      <div
                        key={`override-${permission.key}`}
                        style={{
                          padding: "0.85rem",
                          borderRadius: "10px",
                          border: `1px solid ${isOverridden ? "rgba(201,168,76,0.35)" : "var(--border-subtle)"}`,
                          background: isOverridden ? "rgba(201,168,76,0.08)" : "rgba(15, 22, 40, 0.22)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", alignItems: "center", marginBottom: "0.55rem" }}>
                          <div>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>{permission.key}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{permission.description || "Permission override"}</div>
                          </div>
                          <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.45rem", borderRadius: "999px", background: isOverridden ? "rgba(201,168,76,0.16)" : "rgba(255,255,255,0.06)", color: isOverridden ? "var(--gold-light)" : "var(--text-muted)" }}>
                            {isOverridden ? "Overridden" : "Inherited"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.55rem" }}>
                          {(["default", "allow", "deny"] as const).map((option) => {
                            const active = mode === option;
                            const tone = option === "allow" ? "#22c55e" : option === "deny" ? "#ef4444" : "var(--text-muted)";
                            return (
                              <button
                                key={option}
                                onClick={() => setOverrideModes((current) => ({ ...current, [permission.key]: option }))}
                                style={{
                                  flex: 1,
                                  padding: "0.45rem 0.5rem",
                                  borderRadius: "8px",
                                  border: `1px solid ${active ? tone : "var(--border-subtle)"}`,
                                  background: active ? `${tone}18` : "transparent",
                                  color: active ? tone : "var(--text-secondary)",
                                  cursor: "pointer",
                                  fontFamily: "inherit",
                                  fontSize: "0.74rem",
                                  textTransform: "capitalize",
                                }}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: isEffective ? "#86efac" : "var(--text-muted)" }}>
                          Effective access: {isEffective ? "Enabled" : "Disabled"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
        
        {selectedPendingIds.length > 0 && mayApproveMembers && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => { setFeedback(null); setPendingBulkAction((current) => current === "approve" ? null : "approve"); }} disabled={isProcessing} className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", background: pendingBulkAction === "approve" ? "#15803d" : "#22c55e", borderColor: pendingBulkAction === "approve" ? "#15803d" : "#22c55e" }}>{pendingBulkAction === "approve" ? `Cancel Approve ${selectedPendingIds.length}` : "Bulk Approve (Member)"}</button>
            {pendingBulkAction === "approve" ? (
              <button onClick={handleBulkApprove} disabled={isProcessing} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", color: "#22c55e", borderColor: "rgba(34, 197, 94, 0.5)", background: "transparent" }}>Confirm Approve</button>
            ) : null}
            <button onClick={() => { setFeedback(null); setPendingBulkAction((current) => current === "reject" ? null : "reject"); }} disabled={isProcessing} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.5)", background: "transparent" }}>{pendingBulkAction === "reject" ? `Cancel Reject ${selectedPendingIds.length}` : "Bulk Reject"}</button>
            {pendingBulkAction === "reject" ? (
              <button onClick={handleBulkReject} disabled={isProcessing} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.5)", background: "rgba(239,68,68,0.08)" }}>Confirm Reject</button>
            ) : null}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "3rem" }}>
        {pendingUsers.map((user) => (
          <div key={user.id} style={{ ...rowStyle, padding: "1.2rem", borderLeft: selectedPendingIds.includes(user.id) ? "4px solid var(--gold)" : "4px solid transparent" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {mayApproveMembers && (
                <input 
                  type="checkbox" 
                  checked={selectedPendingIds.includes(user.id)} 
                  onChange={() => toggleSelectPending(user.id)}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--gold)" }}
                />
              )}
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
            {mayApproveMembers && <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => openRoleEditor(user, "Member")}
                style={{ background: "#22c55e", color: "#000", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit", fontWeight: "bold", border: "none" }}
              >
                Approve Target
              </button>
              <button
                onClick={() => {
                  setFeedback(null);
                  setPendingRejectId((current) => current === user.id ? null : user.id);
                }}
                style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit" }}
              >
                {pendingRejectId === user.id ? "Cancel" : "Reject"}
              </button>
              {pendingRejectId === user.id ? (
                <button
                  onClick={() => void handleReject(user.id)}
                  style={{ background: "#ef4444", color: "#fff", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit", border: "none" }}
                >
                  Confirm Reject
                </button>
              ) : null}
            </div>}
          </div>
        ))}
        {pendingUsers.length === 0 && (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            No pending accounts match criteria.
          </p>
        )}
      </div>

      {/* ── Account Directory ── */}
      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--text-secondary)", marginTop: "2rem" }}>Account Directory ({processedUsers.length})</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
        {processedUsers.map((user) => {
          const roleOpt = ROLE_OPTIONS.find((o) => o.label.toLowerCase() === user.role?.toLowerCase())
            || ROLE_OPTIONS[0];
          
          const isEditingInfo = editingInfoUser === user.id;

          return (
            <div key={user.id} style={{ background: "rgba(15, 22, 40, 0.4)", borderRadius: "12px", border: "1px solid var(--border-subtle)", padding: "1.2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold-dark), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", color: "#000", fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                  {user.image ? <img src={user.image} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <h4 style={{ fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: user.status === "approved" ? "#22c55e" : "#ef4444" }}>
                    {user.status}
                  </span>
                  {user.status === "approved" && (
                    <div style={{ fontSize: "0.75rem", color: roleOpt.color, fontWeight: 600 }}>
                      {user.roleId ? user.role : "member"} role
                    </div>
                  )}
                </div>

                {isEditingInfo && mayEditResponsibility ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <input 
                      type="text" 
                      placeholder="Responsibility (About page)" 
                      value={infoFormData.responsibility} 
                      onChange={e => setInfoFormData({...infoFormData, responsibility: e.target.value})}
                      style={{ padding: "0.4rem 0.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: "0.8rem", fontFamily: "inherit" }}
                    />
                    <input 
                      type="text" 
                      placeholder="Department" 
                      value={infoFormData.department} 
                      onChange={e => setInfoFormData({...infoFormData, department: e.target.value})}
                      style={{ padding: "0.4rem 0.5rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: "0.8rem", fontFamily: "inherit" }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}>
                      <button 
                        onClick={() => {
                          setFeedback(null);
                          setIsProcessing(true);
                          updateUserMetadataAction(user.id, infoFormData).then(() => {
                            setEditingInfoUser(null);
                            setFeedback({ type: "success", message: "Member information updated." });
                            fetchUsers();
                          }).catch(e => setFeedback({ type: "error", message: e.message })).finally(() => setIsProcessing(false));
                        }}
                        disabled={isProcessing}
                        style={{ padding: "0.3rem 0.8rem", background: "var(--gold)", color: "#000", border: "none", borderRadius: "4px", cursor: isProcessing ? "not-allowed" : "pointer", fontSize: "0.75rem", fontWeight: "bold" }}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingInfoUser(null)}
                        disabled={isProcessing}
                        style={{ padding: "0.3rem 0.8rem", background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-subtle)", borderRadius: "4px", cursor: isProcessing ? "not-allowed" : "pointer", fontSize: "0.75rem" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ minHeight: "2rem" }}>
                      {user.responsibility ? (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-primary)" }}>
                          {user.responsibility} {user.department ? <span style={{ color: "var(--gold)", opacity: 0.8 }}>• {user.department}</span> : ""}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                          No public info set
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: user.isPublic ? "#22c55e" : "var(--text-muted)", cursor: mayTogglePublic ? "pointer" : "default", fontWeight: user.isPublic ? "bold" : "normal" }}>
                  <input
                    type="checkbox"
                    checked={!!user.isPublic}
                    disabled={!mayTogglePublic}
                    onChange={async () => {
                      if (!mayTogglePublic || isProcessing) return;
                      setFeedback(null);
                      setIsProcessing(true);
                      try {
                        await updateUserMetadataAction(user.id, { isPublic: !user.isPublic });
                        setFeedback({ type: "success", message: `Public visibility ${user.isPublic ? "disabled" : "enabled"}.` });
                        fetchUsers();
                      } catch (err: any) { setFeedback({ type: "error", message: err.message }); }
                      finally { setIsProcessing(false); }
                    }}
                    style={{ accentColor: "var(--gold)", cursor: mayTogglePublic ? "pointer" : "not-allowed" }}
                  />
                  Public
                </label>
                
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {!isEditingInfo && mayEditResponsibility && (
                    <button
                      disabled={isProcessing}
                      onClick={() => {
                        setInfoFormData({ responsibility: user.responsibility || "", department: user.department || "" });
                        setEditingInfoUser(user.id);
                      }}
                      style={{ background: "transparent", color: "var(--gold)", border: "none", cursor: isProcessing ? "not-allowed" : "pointer", fontSize: "0.75rem", textDecoration: "underline", opacity: isProcessing ? 0.5: 1 }}
                    >
                      Edit Info
                    </button>
                  )}
                  {mayEditRole && <button
                    disabled={isProcessing}
                    onClick={() => {
                      const matchingOpt = ROLE_OPTIONS.find((o) => o.label.toLowerCase() === user.role?.toLowerCase() || o.value.toLowerCase() === user.role?.toLowerCase());
                      openRoleEditor(user, matchingOpt ? matchingOpt.value : "Member");
                    }}
                    style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", padding: "0.25rem 0.5rem", borderRadius: "4px", cursor: isProcessing ? "not-allowed" : "pointer", fontSize: "0.7rem", opacity: isProcessing ? 0.5: 1 }}
                  >
                    Role
                  </button>}
                  {mayDeleteUser && <button
                    disabled={isProcessing}
                    onClick={async () => {
                      if (pendingDeleteUserId !== user.id) {
                        setFeedback(null);
                        setPendingDeleteUserId(user.id);
                        return;
                      }
                      setFeedback(null);
                      setIsProcessing(true);
                      try {
                        await deleteUserAction(user.id);
                        setPendingDeleteUserId(null);
                        setFeedback({ type: "success", message: "User deleted successfully." });
                        fetchUsers();
                      } catch (err: any) {
                        setFeedback({ type: "error", message: err.message });
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.5)", color: "#ef4444", padding: "0.25rem 0.5rem", borderRadius: "4px", cursor: isProcessing ? "not-allowed" : "pointer", fontSize: "0.7rem", opacity: isProcessing ? 0.5: 1 }}
                  >
                    {pendingDeleteUserId === user.id ? "Confirm Delete" : "Delete"}
                  </button>}
                </div>
              </div>
            </div>
          );
        })}
        {processedUsers.length === 0 && (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", gridColumn: "1 / -1" }}>
            No users match criteria.
          </p>
        )}
      </div>
    </>
  );
}
