"use client";

import PortalNotifications from "@/components/portal/PortalNotifications";
import { usePortalData } from "@/components/portal/usePortalData";
import { useAuth } from "@/context/AuthContext";

export default function DashboardNotificationsPage() {
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
      <PortalNotifications
        notifications={portalData.notifications}
        notificationsLoading={portalData.notificationsLoading}
        formatRelativeTime={portalData.formatRelativeTime}
        onNotificationSelect={async (notification) => {
          if (!notification.isRead) {
            const { markNotificationReadAction } = await import("@/app/actions/notifications");
            await markNotificationReadAction(notification.id);
            portalData.setNotifications((previous) =>
              previous.map((entry) =>
                entry.id === notification.id ? { ...entry, isRead: true } : entry,
              ),
            );
          }

          if (notification.link) {
            window.location.href = notification.link;
          }
        }}
      />
    </div>
  );
}
