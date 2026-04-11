"use client";

import PortalAnnouncements from "@/components/portal/PortalAnnouncements";
import PortalLeaderboard from "@/components/portal/PortalLeaderboard";
import PortalOverview from "@/components/portal/PortalOverview";
import { usePortalData } from "@/components/portal/usePortalData";
import { useAuth } from "@/context/AuthContext";

export default function DashboardOverviewPage() {
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
      <PortalOverview
        maintenanceActive={portalData.maintenanceActive}
        systemControl={portalData.systemControl}
        formatTimestamp={portalData.formatTimestamp}
      />
      <PortalAnnouncements
        announcements={portalData.portalAnnouncements}
        loading={portalData.portalMetaLoading}
        formatTimestamp={portalData.formatTimestamp}
      />
      <PortalLeaderboard leaderboards={portalData.leaderboards} currentUserId={user?.id ?? null} />
    </div>
  );
}
