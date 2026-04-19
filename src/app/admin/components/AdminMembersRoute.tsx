"use client";

import { useAuth } from "@/context/AuthContext";
import ApprovalsPanel from "./ApprovalsPanel";
import MembersManager from "./MembersManager";
import PublicMembersManager from "./PublicMembersManager";
import AdminRouteSection from "./AdminRouteSection";

export default function AdminMembersRoute() {
  const { roleName, user } = useAuth();

  return (
    <AdminRouteSection>
      <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
        <ApprovalsPanel userRole={roleName} userId={user?.id || ""} />
        <MembersManager />
        <div style={{ height: "1px", background: "var(--border-subtle)", margin: "1rem 0" }} />
        <PublicMembersManager />
      </div>
    </AdminRouteSection>
  );
}
