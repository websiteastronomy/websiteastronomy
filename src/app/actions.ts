"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { getSystemAccess, requireAuthenticatedUser } from "@/lib/system-rbac";

const PUBLIC_COLLECTIONS = new Set([
  "articles",
  "events",
  "outreach",
  "projects",
  "quizzes",
  "achievements",
  "observations",
]);

async function assertCollectionReadAccess(collectionName: string) {
  if (PUBLIC_COLLECTIONS.has(collectionName)) {
    return;
  }

  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);

  if (collectionName === "users" && access.canApproveActions) {
    return;
  }

  if (collectionName === "members" && (access.canApproveActions || access.canManageProjects)) {
    return;
  }

  if (collectionName === "quiz_attempts") {
    return;
  }

  if (collectionName === "files" && access.canManageProjects) {
    return;
  }

  if (collectionName === "system_settings" && access.isAdmin) {
    return;
  }

  throw new Error("Forbidden");
}

async function assertCollectionWriteAccess(collectionName: string) {
  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);

  if (collectionName === "events" && access.canManageEvents) return;
  if (["projects", "observations"].includes(collectionName) && access.canManageProjects) return;
  if (collectionName === "users" && access.canApproveActions) return;
  if (collectionName === "quiz_attempts") return;
  if (["articles", "outreach", "achievements", "quizzes"].includes(collectionName) && access.isAdmin) return;

  throw new Error("Forbidden");
}

export async function fetchCollectionAction(collectionName: string) {
  const table = (schema as any)[collectionName];
  if (!table) throw new Error(`Collection ${collectionName} not found`);
  await assertCollectionReadAccess(collectionName);
  
  try {
    const data = await db.select().from(table).orderBy(desc(table.updatedAt));
    return data;
  } catch (e) {
    try {
      // If table has no updatedAt
      const data = await db.select().from(table);
      return data;
    } catch {
      // Compatibility fallback for schema drift (e.g. app expects newer columns).
      if (!/^[a-zA-Z0-9_]+$/.test(collectionName)) {
        throw e;
      }
      const tableName = sql.raw(`"${collectionName}"`);
      const result = await db.execute(sql`select * from ${tableName}`);
      return result.rows as any[];
    }
  }
}

export async function fetchDocumentAction(collectionName: string, id: string) {
  const table = (schema as any)[collectionName];
  if (!table) return null;
  await assertCollectionReadAccess(collectionName);
  try {
    const data = await db.select().from(table).where(eq(table.id, id)).limit(1);
    return data[0] || null;
  } catch {
    if (!/^[a-zA-Z0-9_]+$/.test(collectionName)) {
      throw new Error("Invalid collection name");
    }
    const tableName = sql.raw(`"${collectionName}"`);
    const result = await db.execute(sql`select * from ${tableName} where "id" = ${id} limit 1`);
    return (result.rows[0] as any) || null;
  }
}

export async function addDocumentAction(collectionName: string, data: any) {
  const table = (schema as any)[collectionName];
  if (!table) throw new Error(`Collection ${collectionName} not found`);
  await assertCollectionWriteAccess(collectionName);
  
  const id = uuidv4();
  const payload = {
    id,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await db.insert(table).values(payload);
  revalidatePath("/admin");
  return { id, ...data };
}

export async function updateDocumentAction(collectionName: string, id: string, data: any) {
  const table = (schema as any)[collectionName];
  if (!table) throw new Error(`Collection ${collectionName} not found`);
  await assertCollectionWriteAccess(collectionName);
  
  const payload = {
    ...data,
    updatedAt: new Date(),
  };
  delete payload.id; // ensure we don't update ID
  
  await db.update(table).set(payload).where(eq(table.id, id));
  revalidatePath("/admin");
  return { id, ...payload };
}

export async function deleteDocumentAction(collectionName: string, id: string) {
  const table = (schema as any)[collectionName];
  if (!table) throw new Error(`Collection ${collectionName} not found`);
  await assertCollectionWriteAccess(collectionName);
  
  await db.delete(table).where(eq(table.id, id));
  revalidatePath("/admin");
  return true;
}

export async function fetchAboutSettingsAction() {
  const settingsTable = schema.settingsTable;
  const raw = await db.select().from(settingsTable).where(eq(settingsTable.id, "about_page")).limit(1);
  if (raw.length > 0) return raw[0].data;
  return null;
}

export async function updateAboutSettingsAction(data: any) {
  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);
  if (!access.isAdmin) {
    throw new Error("Forbidden");
  }

  const settingsTable = schema.settingsTable;
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.id, "about_page")).limit(1);
  
  if (existing.length > 0) {
    const merged = { ...(existing[0].data as any), ...data };
    await db.update(settingsTable).set({ data: merged, updatedAt: new Date() }).where(eq(settingsTable.id, "about_page"));
  } else {
    await db.insert(settingsTable).values({ id: "about_page", data, createdAt: new Date(), updatedAt: new Date() });
  }
  revalidatePath("/admin");
  revalidatePath("/about");
}
