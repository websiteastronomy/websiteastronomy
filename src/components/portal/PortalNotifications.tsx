"use client";

import AnimatedSection from "@/components/AnimatedSection";
import type { Notification } from "./types";

type PortalNotificationsProps = {
  notifications: Notification[];
  notificationsLoading: boolean;
  formatRelativeTime: (value: string) => string;
  onNotificationSelect: (notification: Notification) => Promise<void>;
  limit?: number;
};

export default function PortalNotifications({
  notifications,
  notificationsLoading,
  formatRelativeTime,
  onNotificationSelect,
  limit,
}: PortalNotificationsProps) {
  const visibleNotifications = typeof limit === "number" ? notifications.slice(0, limit) : notifications;

  return (
    <>
      <AnimatedSection>
        <h2
          style={{
            fontSize: "1.3rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Notifications
        </h2>
      </AnimatedSection>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "3rem" }}>
        {notificationsLoading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading...</div>
        ) : visibleNotifications.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              background: "rgba(15, 22, 40, 0.3)",
              borderRadius: "8px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.88rem",
            }}
          >
            No notifications yet.
          </div>
        ) : (
          visibleNotifications.map((notification, index) => {
            const typeLabel =
              notification.type === "approval_request"
                ? "Approval"
                : notification.type === "task_assigned"
                  ? "Task"
                  : notification.type === "mention"
                    ? "Mention"
                    : "System";

            return (
              <AnimatedSection key={notification.id} direction="left" delay={index * 0.08}>
                <div
                  onClick={() => void onNotificationSelect(notification)}
                  style={{
                    padding: "1.1rem 1.5rem",
                    borderLeft: notification.isRead
                      ? "2px solid var(--border-subtle)"
                      : "2px solid var(--gold)",
                    background: notification.isRead
                      ? "rgba(15, 22, 40, 0.2)"
                      : "rgba(201,168,76,0.04)",
                    cursor: notification.link ? "pointer" : "default",
                    transition: "background 0.2s",
                    borderRadius: "0 6px 6px 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.3rem",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: notification.isRead ? "var(--text-muted)" : "var(--gold)",
                        fontWeight: 600,
                      }}
                    >
                      {typeLabel}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: notification.isRead ? 300 : 500,
                      marginBottom: "0.2rem",
                    }}
                  >
                    {notification.title}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 300 }}>
                    {notification.message}
                  </p>
                </div>
              </AnimatedSection>
            );
          })
        )}
      </div>
    </>
  );
}
