"use client";

import AnimatedSection from "@/components/AnimatedSection";
import type { QuizLeaderboardGroups } from "./types";

type PortalLeaderboardProps = {
  leaderboards: QuizLeaderboardGroups;
  currentUserId: string | null;
};

export default function PortalLeaderboard({
  leaderboards,
  currentUserId,
}: PortalLeaderboardProps) {
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
          <span style={{ fontSize: "1.4rem" }}>🏆</span> Quiz Leaderboard
        </h2>
      </AnimatedSection>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {(["daily", "weekly", "monthly"] as const).map((type) => (
          <div
            key={type}
            style={{
              background: "rgba(15,22,40,0.4)",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--gold)",
                  margin: 0,
                }}
              >
                {type}
              </h3>
              <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Top 5</span>
            </div>
            {(leaderboards[type] || []).length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "1.5rem 0.5rem",
                  color: "var(--text-muted)",
                  fontSize: "0.82rem",
                }}
              >
                No entries yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {(leaderboards[type] || []).slice(0, 5).map((entry, index) => (
                  <div
                    key={`${type}-${entry.userId}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1fr 70px",
                      padding: "0.75rem",
                      background:
                        index === 0
                          ? "rgba(201,168,76,0.1)"
                          : entry.userId === currentUserId
                            ? "rgba(255,255,255,0.03)"
                            : "transparent",
                      border: index === 0 ? "1px solid var(--gold-dark)" : "1px solid transparent",
                      borderRadius: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: index === 0 ? "var(--gold)" : "var(--text-secondary)" }}>
                      #{index + 1}
                    </span>
                    <span
                      style={{
                        fontWeight: 500,
                        color: entry.userId === currentUserId ? "#fff" : "inherit",
                        fontSize: "0.85rem",
                      }}
                    >
                      {entry.name} {entry.userId === currentUserId && "(You)"}
                    </span>
                    <span
                      style={{
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontSize: "0.95rem",
                        color: "var(--gold-light)",
                      }}
                    >
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
