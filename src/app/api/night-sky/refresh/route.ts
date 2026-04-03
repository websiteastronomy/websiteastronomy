import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSystemAccess } from "@/lib/system-rbac";
import { refreshNightSkyAutoDataInternal } from "@/app/actions/night-sky";

async function isAuthorized() {
  const cronSecret = process.env.CRON_SECRET;
  const configuredSecret = process.env.NIGHT_SKY_REFRESH_SECRET;
  const headerStore = await headers();
  const requestSecret = headerStore.get("x-night-sky-secret");
  const authorizationHeader = headerStore.get("authorization");

  if (cronSecret && authorizationHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  if (configuredSecret && requestSecret === configuredSecret) {
    return true;
  }

  const session = await auth.api.getSession({ headers: headerStore });
  if (!session?.user?.id) {
    return false;
  }

  const access = await getSystemAccess(session.user.id);
  return access.isAdmin || access.canApproveActions;
}

export async function GET() {
  try {
    const allowed = await isAuthorized();
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const state = await refreshNightSkyAutoDataInternal();
    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error("[api/night-sky/refresh] route error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Night Sky refresh failed." },
      { status: 500 }
    );
  }
}

export const POST = GET;
