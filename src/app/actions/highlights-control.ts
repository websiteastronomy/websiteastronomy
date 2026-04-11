"use server";

import { db } from "@/db";
import { articles, events, highlight_items, observations, projects, settingsTable } from "@/db/schema";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSystemAccess, requireAuthenticatedUser } from "@/lib/system-rbac";
import { v4 as uuidv4 } from "uuid";

const HIGHLIGHTS_CONTROL_ID = "highlights_control";

export type HighlightMode = "auto" | "hybrid" | "manual";

export type ManualHighlightItem = {
  id: string;
  type: "article" | "observation" | "event" | "project";
  priority: number;
};

export type HighlightsControl = {
  highlight_mode: HighlightMode;
  manual_highlights: ManualHighlightItem[];
};

export type HighlightContentOption = {
  id: string;
  type: ManualHighlightItem["type"];
  title: string;
  subtitle: string;
  image: string | null;
};

export type ManualHighlightOption = HighlightContentOption & {
  priority: number;
};

const DEFAULT_HIGHLIGHTS_CONTROL: HighlightsControl = {
  highlight_mode: "auto",
  manual_highlights: [],
};

let highlightItemsCapabilityPromise: Promise<boolean> | null = null;

function extractRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object" && "rows" in result && Array.isArray((result as any).rows)) {
    return (result as any).rows as Array<Record<string, unknown>>;
  }
  return [];
}

async function hasHighlightItemsTable() {
  if (!highlightItemsCapabilityPromise) {
    highlightItemsCapabilityPromise = (async () => {
      const result = await db.execute(sql`
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'highlight_items'
      `);
      const tableNames = new Set(extractRows(result).map((row) => String(row.table_name)));
      return tableNames.has("highlight_items");
    })();
  }

  return highlightItemsCapabilityPromise;
}

function normalizeManualHighlightItem(raw: unknown): ManualHighlightItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id : null;
  const type = item.type;
  const priority = Number(item.priority ?? 0);

  if (!id || !["article", "observation", "event", "project"].includes(String(type))) {
    return null;
  }

  return {
    id,
    type: type as ManualHighlightItem["type"],
    priority: Number.isFinite(priority) ? Math.trunc(priority) : 0,
  };
}

function normalizeHighlightsControl(raw: unknown): HighlightsControl {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_HIGHLIGHTS_CONTROL;
  }

  const data = raw as Record<string, unknown>;
  const mode = data.highlight_mode;
  const manual = Array.isArray(data.manual_highlights)
    ? data.manual_highlights.map(normalizeManualHighlightItem).filter((item): item is ManualHighlightItem => Boolean(item))
    : [];

  return {
    highlight_mode: mode === "manual" || mode === "hybrid" ? mode : "auto",
    manual_highlights: manual,
  };
}

function sortManualHighlights(items: ManualHighlightItem[]) {
  return [...items].sort((a, b) => b.priority - a.priority || a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
}

function assignSequentialPriorities(items: Array<{ id: string; type: ManualHighlightItem["type"] }>): ManualHighlightItem[] {
  const total = items.length;
  return items.map((item, index) => ({
    ...item,
    priority: total - index,
  }));
}

async function requireAdminAccess() {
  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);
  if (!access.isAdmin) {
    throw new Error("Forbidden");
  }
  return { user, access };
}

async function readHighlightsControlRecord() {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, HIGHLIGHTS_CONTROL_ID)).limit(1);
  return rows[0] || null;
}

async function persistHighlightsControlRecord(nextControl: HighlightsControl) {
  const existingRecord = await readHighlightsControlRecord();
  if (existingRecord) {
    await db
      .update(settingsTable)
      .set({ data: nextControl, updatedAt: new Date() })
      .where(eq(settingsTable.id, HIGHLIGHTS_CONTROL_ID));
  } else {
    await db.insert(settingsTable).values({
      id: HIGHLIGHTS_CONTROL_ID,
      data: nextControl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

async function readLegacyHighlightsControl() {
  const record = await readHighlightsControlRecord();
  return normalizeHighlightsControl(record?.data);
}

async function getPersistedManualHighlights(): Promise<ManualHighlightItem[]> {
  if (!(await hasHighlightItemsTable())) {
    return (await readLegacyHighlightsControl()).manual_highlights;
  }

  const rows = await db
    .select({
      resourceId: highlight_items.resourceId,
      resourceType: highlight_items.resourceType,
      priority: highlight_items.priority,
    })
    .from(highlight_items)
    .orderBy(desc(highlight_items.priority), desc(highlight_items.createdAt));

  if (rows.length === 0) {
    return (await readLegacyHighlightsControl()).manual_highlights;
  }

  return rows.map((row) => ({
    id: row.resourceId,
    type: row.resourceType as ManualHighlightItem["type"],
    priority: Number(row.priority || 0),
  }));
}

async function syncLegacyManualHighlights(manualHighlights: ManualHighlightItem[]) {
  const existing = await readLegacyHighlightsControl();
  await persistHighlightsControlRecord({
    highlight_mode: existing.highlight_mode,
    manual_highlights: manualHighlights,
  });
}

function revalidateHighlightsPaths() {
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function getHighlightsControlAction(): Promise<HighlightsControl> {
  const control = await readLegacyHighlightsControl();
  return {
    highlight_mode: control.highlight_mode,
    manual_highlights: sortManualHighlights(await getPersistedManualHighlights()),
  };
}

export async function updateHighlightsControlAction(nextControl: Partial<HighlightsControl>) {
  await requireAdminAccess();

  const existing = await getHighlightsControlAction();
  const normalized = normalizeHighlightsControl({
    highlight_mode: nextControl.highlight_mode ?? existing.highlight_mode,
    manual_highlights: nextControl.manual_highlights ?? existing.manual_highlights,
  });

  await persistHighlightsControlRecord(normalized);
  revalidateHighlightsPaths();

  return {
    ...normalized,
    manual_highlights: sortManualHighlights(await getPersistedManualHighlights()),
  };
}

export async function getHighlightContentOptionsAction(): Promise<HighlightContentOption[]> {
  await requireAdminAccess();

  const [articleRows, observationRows, eventRows, projectRows] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        image: articles.coverImageUrl,
        fallbackImage: articles.coverImage,
        status: articles.status,
      })
      .from(articles)
      .where(
        and(
          or(eq(articles.status, "published"), eq(articles.isPublished, true)),
          or(eq(articles.isDeleted, false), isNull(articles.isDeleted))
        )
      )
      .orderBy(desc(articles.publishedAt), desc(articles.updatedAt)),
    db
      .select({
        id: observations.id,
        title: observations.title,
        image: observations.imageThumbnailUrl,
        fallbackImage: observations.imageCompressedUrl,
        fallbackImageTwo: observations.imageOriginalUrl,
      })
      .from(observations)
      .where(eq(observations.status, "Published"))
      .orderBy(desc(observations.capturedAt), desc(observations.updatedAt)),
    db
      .select({
        id: events.id,
        title: events.title,
        subtitle: events.date,
        image: events.bannerImage,
      })
      .from(events)
      .where(eq(events.isPublished, true))
      .orderBy(desc(events.date), desc(events.updatedAt)),
    db
      .select({
        id: projects.id,
        title: projects.title,
        subtitle: projects.status,
        image: projects.coverImage,
      })
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(desc(projects.updatedAt)),
  ]);

  return [
    ...articleRows.map((row) => ({
      id: row.id,
      type: "article" as const,
      title: row.title,
      subtitle: typeof row.status === "string" ? row.status : "Article",
      image: row.image || row.fallbackImage || null,
    })),
    ...observationRows.map((row) => ({
      id: row.id,
      type: "observation" as const,
      title: row.title,
      subtitle: "Published observation",
      image: row.image || row.fallbackImage || row.fallbackImageTwo || null,
    })),
    ...eventRows.map((row) => ({
      id: row.id,
      type: "event" as const,
      title: row.title,
      subtitle: row.subtitle || "Event",
      image: row.image || null,
    })),
    ...projectRows.map((row) => ({
      id: row.id,
      type: "project" as const,
      title: row.title,
      subtitle: row.subtitle || "Project",
      image: row.image || null,
    })),
  ];
}

async function resolveOptionOrThrow(resourceId: string, resourceType: ManualHighlightItem["type"]) {
  const options = await getHighlightContentOptionsAction();
  const match = options.find((option) => option.id === resourceId && option.type === resourceType);
  if (!match) {
    throw new Error("This resource is not eligible for homepage highlights.");
  }
  return match;
}

async function replacePersistedManualHighlights(
  items: ManualHighlightItem[],
  actorUserId: string | null | undefined,
  optionMap?: Map<string, HighlightContentOption>
) {
  const ordered = sortManualHighlights(items);
  await syncLegacyManualHighlights(ordered);

  if (!(await hasHighlightItemsTable())) {
    revalidateHighlightsPaths();
    return ordered;
  }

  await db.delete(highlight_items);

  if (ordered.length > 0) {
    const sourceMap = optionMap || new Map((await getHighlightContentOptionsAction()).map((option) => [`${option.type}:${option.id}`, option]));
    await db.insert(highlight_items).values(
      ordered.map((item) => {
        const option = sourceMap.get(`${item.type}:${item.id}`);
        return {
          id: uuidv4(),
          resourceId: item.id,
          resourceType: item.type,
          title: option?.title || item.id,
          image: option?.image || null,
          priority: item.priority,
          createdBy: actorUserId || null,
          createdAt: new Date(),
        };
      })
    );
  }

  revalidateHighlightsPaths();
  return ordered;
}

export async function addManualHighlightAction(resourceId: string, resourceType: ManualHighlightItem["type"]): Promise<HighlightsControl> {
  const { user } = await requireAdminAccess();
  const option = await resolveOptionOrThrow(resourceId, resourceType);
  const existing = sortManualHighlights(await getPersistedManualHighlights());

  if (existing.some((item) => item.id === resourceId && item.type === resourceType)) {
    return getHighlightsControlAction();
  }

  const next = assignSequentialPriorities([
    { id: resourceId, type: resourceType },
    ...existing.map((item) => ({ id: item.id, type: item.type })),
  ]);

  await replacePersistedManualHighlights(next, user.id, new Map([[`${option.type}:${option.id}`, option]]));
  return getHighlightsControlAction();
}

export async function removeManualHighlightAction(resourceId: string, resourceType: ManualHighlightItem["type"]): Promise<HighlightsControl> {
  const { user } = await requireAdminAccess();
  const existing = sortManualHighlights(await getPersistedManualHighlights());
  const filtered = existing.filter((item) => !(item.id === resourceId && item.type === resourceType));
  const next = assignSequentialPriorities(filtered.map((item) => ({ id: item.id, type: item.type })));
  await replacePersistedManualHighlights(next, user.id);
  return getHighlightsControlAction();
}

export async function reorderManualHighlightsAction(items: Array<{ id: string; type: ManualHighlightItem["type"] }>): Promise<HighlightsControl> {
  const { user } = await requireAdminAccess();
  const deduped = items.filter((item, index, source) =>
    source.findIndex((candidate) => candidate.id === item.id && candidate.type === item.type) === index
  );

  const next = assignSequentialPriorities(deduped);
  await replacePersistedManualHighlights(next, user.id);
  return getHighlightsControlAction();
}

export async function getManualHighlightDetailsAction(): Promise<ManualHighlightOption[]> {
  await requireAdminAccess();
  const optionMap = new Map((await getHighlightContentOptionsAction()).map((option) => [`${option.type}:${option.id}`, option]));
  return sortManualHighlights(await getPersistedManualHighlights()).map((item) => {
    const option = optionMap.get(`${item.type}:${item.id}`);
    return {
      id: item.id,
      type: item.type,
      priority: item.priority,
      title: option?.title || item.id,
      subtitle: option?.subtitle || item.type,
      image: option?.image || null,
    };
  });
}
