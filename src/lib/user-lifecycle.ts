import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settingsTable } from "@/db/schema";

export type UserLifecycleState = "ACTIVE" | "INACTIVE" | "ARCHIVED";

type UserLifecycleDocument = {
  version: 1;
  states: Record<string, UserLifecycleState>;
  updatedAt?: string | null;
};

const USER_LIFECYCLE_SETTINGS_ID = "user_lifecycle";

const DEFAULT_USER_LIFECYCLE_DOCUMENT: UserLifecycleDocument = {
  version: 1,
  states: {},
  updatedAt: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeLifecycleState(value: unknown): UserLifecycleState {
  if (value === "INACTIVE" || value === "ARCHIVED") {
    return value;
  }
  return "ACTIVE";
}

export function normalizeUserLifecycleDocument(value: unknown): UserLifecycleDocument {
  if (!isRecord(value) || !isRecord(value.states)) {
    return DEFAULT_USER_LIFECYCLE_DOCUMENT;
  }

  const states = Object.fromEntries(
    Object.entries(value.states).map(([userId, state]) => [userId, normalizeLifecycleState(state)])
  );

  return {
    version: 1,
    states,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
  };
}

export async function getUserLifecycleDocument(): Promise<UserLifecycleDocument> {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, USER_LIFECYCLE_SETTINGS_ID)).limit(1);
  if (!rows.length) {
    return DEFAULT_USER_LIFECYCLE_DOCUMENT;
  }
  return normalizeUserLifecycleDocument(rows[0].data);
}

export async function getUserLifecycleState(userId: string | null | undefined): Promise<UserLifecycleState> {
  if (!userId) return "ACTIVE";
  const document = await getUserLifecycleDocument();
  return document.states[userId] || "ACTIVE";
}

export async function setUserLifecycleState(userId: string, nextState: UserLifecycleState) {
  const document = await getUserLifecycleDocument();
  const nextDocument: UserLifecycleDocument = {
    version: 1,
    states: {
      ...document.states,
      [userId]: nextState,
    },
    updatedAt: new Date().toISOString(),
  };

  const existing = await db.select().from(settingsTable).where(eq(settingsTable.id, USER_LIFECYCLE_SETTINGS_ID)).limit(1);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ data: nextDocument, updatedAt: new Date() }).where(eq(settingsTable.id, USER_LIFECYCLE_SETTINGS_ID));
  } else {
    await db.insert(settingsTable).values({
      id: USER_LIFECYCLE_SETTINGS_ID,
      data: nextDocument,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return nextDocument;
}

export function isLifecycleVisibleInStandardQueries(state: UserLifecycleState) {
  return state !== "ARCHIVED";
}

export function isLifecycleAllowedAccess(state: UserLifecycleState) {
  return state === "ACTIVE";
}

export async function attachUserLifecycleState<T extends { id: string }>(rows: T[]) {
  const document = await getUserLifecycleDocument();
  return rows.map((row) => ({
    ...row,
    lifecycleState: document.states[row.id] || "ACTIVE",
  }));
}
