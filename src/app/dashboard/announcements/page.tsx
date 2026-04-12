"use client";

import PortalAnnouncements from "@/components/portal/PortalAnnouncements";
import { usePortalData } from "@/components/portal/usePortalData";
import { useAuth } from "@/context/AuthContext";
import { SectionHeader } from "@/components/ui";

export default function DashboardAnnouncementsPage() {
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
      <SectionHeader
        title="Announcements"
        subtitle="Targeted club updates, notices, and communication relevant to your role."
      />
      <PortalAnnouncements
        announcements={portalData.portalAnnouncements}
        loading={portalData.portalMetaLoading}
        formatTimestamp={portalData.formatTimestamp}
      />
    </div>
  );
}
