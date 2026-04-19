"use server";

import { db } from "@/db";
import { users, projects, events } from "@/db/schema";
import { ilike, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSystemAccess } from "@/lib/system-rbac";
import { formatDateStable } from "@/lib/format-date";
import { attachUserLifecycleState, isLifecycleVisibleInStandardQueries } from "@/lib/user-lifecycle";

export interface SearchResult {
  id: string;
  type: "member" | "project" | "event";
  title: string;
  subtitle: string;
  url: string;
}

export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");
  const access = await getSystemAccess(session.user.id);
  if (!(access.isAdmin || access.canManageProjects || access.canApproveActions)) {
    throw new Error("Forbidden");
  }
  
  if (!query || query.trim().length < 2) return [];

  const searchPattern = `%${query.trim()}%`;
  const results: SearchResult[] = [];

  // Search Users
  const rawUserResults = await db.select().from(users).where(
    or(ilike(users.name, searchPattern), ilike(users.email, searchPattern))
  ).limit(5);
  const userResults = (await attachUserLifecycleState(rawUserResults)).filter((user) =>
    isLifecycleVisibleInStandardQueries(user.lifecycleState)
  );

  for (const u of userResults) {
    results.push({
      id: u.id,
      type: "member",
      title: u.name,
      subtitle: u.email,
      url: `/admin/members`,
    });
  }

  // Search Projects
  const projectResults = await db.select().from(projects).where(
    or(ilike(projects.title, searchPattern), ilike(projects.description, searchPattern))
  ).limit(5);

  for (const p of projectResults) {
    results.push({
      id: p.id,
      type: "project",
      title: p.title,
      subtitle: p.description?.substring(0, 50) || "Project",
      url: `/projects/${p.id}`,
    });
  }

  // Search Events
  const eventResults = await db.select().from(events).where(
    or(ilike(events.title, searchPattern), ilike(events.description, searchPattern))
  ).limit(5);

  for (const e of eventResults) {
    results.push({
      id: e.id,
      type: "event",
      title: e.title,
      subtitle: formatDateStable(e.date),
      url: `/events/${e.id}`, // Example route
    });
  }

  return results;
}
