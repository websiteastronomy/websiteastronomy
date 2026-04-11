"use client";

import PortalProjects from "@/components/portal/PortalProjects";
import { usePortalData } from "@/components/portal/usePortalData";
import { useAuth } from "@/context/AuthContext";

export default function DashboardProjectsPage() {
  const { user } = useAuth();
  const portalData = usePortalData(
    user
      ? {
          id: user.id,
          image: user.image ?? null,
          name: user.name ?? null,
          email: user.email ?? null,
          profileImageKey: (user as { profileImageKey?: string | null }).profileImageKey ?? null,
          quote: (user as { quote?: string | null }).quote ?? null,
        }
      : null,
  );

  return (
    <div style={{ maxWidth: "980px" }}>
      <PortalProjects myProjects={portalData.myProjects} projectsLoading={portalData.projectsLoading} />
    </div>
  );
}
