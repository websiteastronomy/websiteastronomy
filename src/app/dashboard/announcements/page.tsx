"use client";

import PortalAnnouncements from "@/components/portal/PortalAnnouncements";
import { usePortalData } from "@/components/portal/usePortalData";
import { useAuth } from "@/context/AuthContext";

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
      <h1 style={{ fontSize: "1.4rem", fontFamily: "'Cinzel', serif", marginBottom: "0.4rem" }}>
        <span className="gradient-text">Announcements</span>
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Targeted club updates, notices, and communication relevant to your role.
      </p>
      <PortalAnnouncements
        announcements={portalData.portalAnnouncements}
        loading={portalData.portalMetaLoading}
        formatTimestamp={portalData.formatTimestamp}
      />
    </div>
  );
}
