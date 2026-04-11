"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

export default function DashboardNotificationsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { getMyNotificationsAction } = await import("@/app/actions/notifications");
      const data = await getMyNotificationsAction();
      setNotifications(data as Notification[]);
    } catch (e) {
      console.error("[DashboardNotifications] load error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = (notifId: string) =>
    startTransition(async () => {
      try {
        const { markNotificationReadAction } = await import("@/app/actions/notifications");
        await markNotificationReadAction(notifId);
        setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, isRead: true } : n));
      } catch (e) {
        console.error(e);
      }
    });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ maxWidth: "700px" }}>
      <h1 style={{ fontSize: "1.4rem", fontFamily: "'Cinzel', serif", marginBottom: "0.4rem" }}>
        <span className="gradient-text">Notifications</span>
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.` : "All caught up!"}
      </p>

      <div style={{ display: "grid", gap: "0.65rem" }}>
        {loading ? (
          <div style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ color: "var(--text-muted)", padding: "3rem", textAlign: "center", background: "rgba(12,18,34,0.55)", borderRadius: "14px", border: "1px solid var(--border-subtle)" }}>
            No notifications yet.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                padding: "1rem 1.2rem",
                borderRadius: "12px",
                background: notif.isRead ? "rgba(12,18,34,0.35)" : "rgba(12,18,34,0.65)",
                border: notif.isRead ? "1px solid var(--border-subtle)" : "1px solid rgba(201,168,76,0.15)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  {!notif.isRead && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />}
                  <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>{notif.title}</strong>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{notif.message}</p>
                <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
                  </span>
                  {notif.link && (
                    <Link href={notif.link} style={{ fontSize: "0.75rem", color: "var(--gold)" }}>
                      View →
                    </Link>
                  )}
                </div>
              </div>
              {!notif.isRead && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  disabled={isPending}
                  style={{
                    background: "transparent", border: "1px solid var(--border-subtle)",
                    borderRadius: "6px", padding: "0.35rem 0.6rem",
                    color: "var(--text-muted)", fontSize: "0.72rem",
                    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
