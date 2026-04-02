"use server";

import { db } from "@/db";
import { users, projects, events } from "@/db/schema";
import { ilike, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/permissions";

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

  // Basic admin or elevated role check can be done here, 
  // but let's assume search can be internal based on roles.
  // We'll enforce this allows at least logged-in users, but admin panel handles its own rendering.
  const isGlobalAdmin = await hasPermission(session.user.id, "manage_projects");
  
  if (!query || query.trim().length < 2) return [];

  const searchPattern = `%${query.trim()}%`;
  const results: SearchResult[] = [];

  // Search Users
  const userResults = await db.select().from(users).where(
    or(ilike(users.name, searchPattern), ilike(users.email, searchPattern))
  ).limit(5);

  for (const u of userResults) {
    results.push({
      id: u.id,
      type: "member",
      title: u.name,
      subtitle: u.email,
      url: `/admin?tab=members`, // Mock route for now
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
      subtitle: new Date(e.date).toLocaleDateString(),
      url: `/events/${e.id}`, // Example route
    });
  }

  return results;
}
