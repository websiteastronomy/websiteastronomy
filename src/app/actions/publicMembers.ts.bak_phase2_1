"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAdminAccess } from "@/lib/member-access";

/**
 * Get all public-facing member profiles.
 * Queries the `users` table where status=approved AND isPublic=true.
 * Returns shape compatible with PublicMembersManager UI.
 */
export async function getPublicMembersAction() {
  const publicUsers = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.responsibility, // responsibility maps to displayed "role"
      dept: users.department,
      bio: users.quote,
      imageUrl: users.profileImageKey, // will be resolved to full URL in UI
      profileImageKey: users.profileImageKey,
      image: users.image, // OAuth fallback
    })
    .from(users)
    .where(and(eq(users.status, "approved"), eq(users.isPublic, true)));

  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  return publicUsers.map(u => ({
    ...u,
    imageUrl: u.image || (u.profileImageKey ? `${r2Base}/${u.profileImageKey}` : `https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&q=80`),
  }));
}

/**
 * Admin-only: Create a "public member" entry by updating a user's profile fields.
 * This no longer inserts into the legacy `members` table.
 */
export async function createPublicMemberAction(data: { name: string, role: string, dept?: string, imageUrl?: string, bio?: string }) {
  // Kept for backward-compat with PublicMembersManager UI.
  // In the unified model, admins manage these fields via MembersManager.
  // This action is now a no-op stub — use updatePublicMemberAction instead.
  console.warn("createPublicMemberAction: new members are created via user registration. Use updatePublicMemberAction to mark users as public.");
}

/**
 * Admin-only: Update a user's public profile fields (responsibility, dept, bio, isPublic).
 */
export async function updatePublicMemberAction(id: string, data: { name?: string, role?: string, dept?: string, imageUrl?: string, bio?: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  await requireAdminAccess(session.user.id);

  await db.update(users)
    .set({
      responsibility: data.role,
      department: data.dept,
      quote: data.bio,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  revalidatePath("/admin");
  revalidatePath("/about");
  return { success: true };
}

/**
 * Admin-only: Delete — soft no-op; we don't delete users, we toggle isPublic=false.
 */
export async function deletePublicMemberAction(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  await requireAdminAccess(session.user.id);

  await db.update(users)
    .set({ isPublic: false, updatedAt: new Date() })
    .where(eq(users.id, id));

  revalidatePath("/admin");
  revalidatePath("/about");
  return { success: true };
}
