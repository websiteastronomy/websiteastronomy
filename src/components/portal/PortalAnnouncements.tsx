"use client";

import AnimatedSection from "@/components/AnimatedSection";
import type { Announcement } from "./types";

type PortalAnnouncementsProps = {
  announcements: Announcement[];
  loading: boolean;
  formatTimestamp: (value: string | null) => string;
  limit?: number;
};

export default function PortalAnnouncements({
  announcements,
  loading,
  formatTimestamp,
  limit,
}: PortalAnnouncementsProps) {
  const visibleAnnouncements = typeof limit === "number" ? announcements.slice(0, limit) : announcements;

  return (
    <>
      <AnimatedSection>
        <h2
          style={{
            fontSize: "1.3rem",
            marginTop: "3rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>📣</span> Club Announcements
        </h2>
      </AnimatedSection>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "3rem" }}>
        {loading ? (
          <div
            style={{
              padding: "1.2rem",
              background: "rgba(15, 22, 40, 0.3)",
              borderRadius: "8px",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            Loading announcements...
          </div>
        ) : visibleAnnouncements.length === 0 ? (
          <div
            style={{
              padding: "1.2rem",
              background: "rgba(15, 22, 40, 0.3)",
              borderRadius: "8px",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No targeted announcements right now.
          </div>
        ) : (
          visibleAnnouncements.map((announcement, index) => (
            <AnimatedSection key={announcement.id} direction="left" delay={index * 0.05}>
              <div
                style={{
                  padding: "1rem 1.2rem",
                  background: "rgba(15,22,40,0.35)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginBottom: "0.4rem",
                  }}
                >
                  <strong>{announcement.title}</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    {formatTimestamp(announcement.createdAt)}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-secondary)",
                    fontSize: "0.88rem",
                    lineHeight: 1.6,
                  }}
                >
                  {announcement.message}
                </p>
              </div>
            </AnimatedSection>
          ))
        )}
      </div>
    </>
  );
}
