"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

export async function fetchCollectionAction(collectionName: string) {
  const table = (schema as any)[collectionName];
  if (!table) throw new Error(`Collection ${collectionName} not found`);
  
  try {
    const data = await db.select().from(table).orderBy(desc(table.updatedAt));
    return data;
  } catch (e) {
    // If table has no updatedAt
    const data = await db.select().from(table);
    return data;
  }
}

export async function fetchDocumentAction(collectionName: string, id: string) {
  const table = (schema as any)[collectionName];
  if (!table) return null;
  const data = await db.select().from(table).where(eq(table.id, id)).limit(1);
  return data[0] || null;
}

export async function addDocumentAction(collectionName: string, data: any) {
  const table = (schema as any)[collectionName];
  if (!table) throw new Error(`Collection ${collectionName} not found`);
  
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
