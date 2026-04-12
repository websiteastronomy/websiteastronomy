import { redirect } from "next/navigation";
import { getNightSkyResolvedState } from "@/lib/night-sky-server";
import DashboardNightSkyClient from "./DashboardNightSkyClient";

export const dynamic = "force-dynamic";

export default async function DashboardNightSkyPage() {
  const { state, data } = await getNightSkyResolvedState();

  if (!state.isEnabled || !data) {
    return (
      <div style={{ maxWidth: "1100px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Night Sky</h1>
        <div style={{
          marginTop: "1.5rem", padding: "3rem", textAlign: "center",
          background: "rgba(15,22,40,0.3)", borderRadius: "12px", border: "1px dashed var(--border-subtle)",
          color: "var(--text-muted)"
        }}>
          Night Sky module is currently disabled. An admin can enable it from System Control.
        </div>
      </div>
    );
  }

  const lastUpdatedLabel = state.lastUpdated
    ? new Date(state.lastUpdated).toISOString().replace("T", " ").slice(0, 16) + " UTC"
    : "Recently";

  return <DashboardNightSkyClient nightSkyData={data} state={state} lastUpdatedLabel={lastUpdatedLabel} />;
}
