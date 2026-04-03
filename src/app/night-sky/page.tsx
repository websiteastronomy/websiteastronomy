import { redirect } from "next/navigation";
import NightSkyClient from "./NightSkyClient";
import { getNightSkyResolvedState } from "@/lib/night-sky-server";

export const dynamic = "force-dynamic";

function formatLastUpdatedLabel(value: string | null) {
  if (!value) {
    return "Recently";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default async function NightSkyPage() {
  const { state, data } = await getNightSkyResolvedState();

  if (!state.isEnabled || !data) {
    redirect("/");
  }

  return <NightSkyClient nightSkyData={data} state={state} lastUpdatedLabel={formatLastUpdatedLabel(state.lastUpdated)} />;
}
