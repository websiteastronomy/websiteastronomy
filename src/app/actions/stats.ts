"use server";

import { db } from "@/db";
import { users, projects, observations } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { attachUserLifecycleState, isLifecycleVisibleInStandardQueries } from "@/lib/user-lifecycle";

/**
 * Get general platform statistics for the homepage counters.
 */
export async function getPlatformStatsAction() {
  const approvedUsers = await db.select({ id: users.id }).from(users).where(eq(users.status, "approved"));
  const visibleUsers = (await attachUserLifecycleState(approvedUsers)).filter((user) =>
    isLifecycleVisibleInStandardQueries(user.lifecycleState)
  );
  const [p] = await db.select({ value: count() }).from(projects);
  const [o] = await db.select({ value: count() }).from(observations).where(eq(observations.status, "Published"));

  return {
    membersCount: visibleUsers.length,
    projectsCount: p.value,
    observationsCount: o.value,
  };
}
