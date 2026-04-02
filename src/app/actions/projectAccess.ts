"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getProjectPermissions, ProjectPermissions } from "@/lib/project_permissions";

export async function getProjectPermissionsAction(projectId: string): Promise<ProjectPermissions> {
  const session = await auth.api.getSession({ headers: await headers() });
  return getProjectPermissions(projectId, session?.user?.id);
}
