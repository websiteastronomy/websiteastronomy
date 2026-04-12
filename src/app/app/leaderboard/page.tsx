"use client";

import { useState } from "react";
import PortalLeaderboard from "@/components/portal/PortalLeaderboard";
import { usePortalData } from "@/components/portal/usePortalData";
import { useAuth } from "@/context/AuthContext";
import { SectionHeader, EmptyState } from "@/components/ui";

export default function DashboardLeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overall" | "quiz">("overall");

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
    <div style={{ maxWidth: "1100px" }}>
      <SectionHeader
        title="Leaderboard"
        subtitle="Track your club activity and quiz points."
      />

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => setActiveTab("overall")}
          className={activeTab === "overall" ? "btn-primary" : "btn-secondary"}
          style={{ padding: "0.5rem 1.5rem", borderRadius: "20px", border: activeTab !== "overall" ? "none" : undefined }}
        >
          Overall Activity
        </button>
        <button
          onClick={() => setActiveTab("quiz")}
          className={activeTab === "quiz" ? "btn-primary" : "btn-secondary"}
          style={{ padding: "0.5rem 1.5rem", borderRadius: "20px", border: activeTab !== "quiz" ? "none" : undefined }}
        >
          Quiz Leaderboard
        </button>
      </div>

      {activeTab === "quiz" ? (
        <PortalLeaderboard leaderboards={portalData.leaderboards} currentUserId={user?.id || null} />
      ) : (
        <div style={{ marginTop: "2rem" }}>
          <EmptyState
            icon="🌟"
            title="Overall Activity Board"
            description="Overall points integration is coming soon. For now, check the Quiz Leaderboard to see top scorers!"
          />
        </div>
      )}
    </div>
  );
}
