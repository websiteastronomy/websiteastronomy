"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function typeIcon(type: string): string {
  switch (type) {
    case "approval_request":
      return "📋";
    case "task_assigned":
      return "✅";
    case "mention":
      return "💬";
    case "system":
    default:
      return "🔔";
  }
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { getMyNotificationsAction, getUnreadNotificationCountAction } =
        await import("@/app/actions/notifications");
      const [notifs, count] = await Promise.all([
        getMyNotificationsAction(),
        getUnreadNotificationCountAction(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error("[NotificationBell] fetch error:", err);
    }
  }, [user]);

  // Initial fetch + polling every 30s
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      const { markAllNotificationsReadAction } = await import(
        "@/app/actions/notifications"
      );
      await markAllNotificationsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[NotificationBell] markAllRead error:", err);
    }
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        const { markNotificationReadAction } = await import(
          "@/app/actions/notifications"
        );
        await markNotificationReadAction(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error("[NotificationBell] markRead error:", err);
      }
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchNotifications();
        }}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "0.4rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-secondary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.2s" }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position: "absolute",
                top: "0",
                right: "0",
                background:
                  "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff",
                fontSize: "0.6rem",
                fontWeight: 700,
                minWidth: "16px",
                height: "16px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                lineHeight: 1,
                boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "360px",
              maxHeight: "460px",
              background: "rgba(12, 18, 34, 0.97)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(201, 168, 76, 0.15)",
              borderRadius: "12px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(201,168,76,0.2)",
              overflow: "hidden",
              zIndex: 200,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.2rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h4
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Notifications
                {unreadCount > 0 && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      fontSize: "0.7rem",
                      color: "var(--gold)",
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </h4>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--gold)",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textDecoration: "underline",
                    opacity: 0.8,
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div
              style={{
                overflowY: "auto",
                flex: 1,
              }}
            >
              {notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem 1.5rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                    🔕
                  </div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 300 }}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => handleClick(notif)}
                    style={{
                      display: "flex",
                      gap: "0.8rem",
                      padding: "0.9rem 1.2rem",
                      cursor: notif.link ? "pointer" : "default",
                      background: notif.isRead
                        ? "transparent"
                        : "rgba(201, 168, 76, 0.04)",
                      borderLeft: notif.isRead
                        ? "2px solid transparent"
                        : "2px solid var(--gold)",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        "rgba(255,255,255,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        notif.isRead
                          ? "transparent"
                          : "rgba(201, 168, 76, 0.04)";
                    }}
                  >
                    <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "0.1rem" }}>
                      {typeIcon(notif.type)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.2rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: notif.isRead ? 400 : 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "var(--gold)",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          lineHeight: 1.4,
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {notif.message}
                      </p>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--text-muted)",
                          opacity: 0.7,
                          marginTop: "0.3rem",
                          display: "block",
                        }}
                      >
                        {relativeTime(notif.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
