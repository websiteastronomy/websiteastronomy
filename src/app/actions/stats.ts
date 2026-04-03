"use server";

import { db } from "@/db";
import { users, projects, observations } from "@/db/schema";
import { eq, count } from "drizzle-orm";

/**
 * Get general platform statistics for the homepage counters.
 */
export async function getPlatformStatsAction() {
  const [m] = await db.select({ value: count() }).from(users).where(eq(users.status, "approved"));
  const [p] = await db.select({ value: count() }).from(projects);
  const [o] = await db.select({ value: count() }).from(observations).where(eq(observations.status, "Published"));

  return {
    membersCount: m.value,
    projectsCount: p.value,
    observationsCount: o.value,
  };
}
