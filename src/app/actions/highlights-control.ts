"use server";

import { db } from "@/db";
import { articles, events, observations, projects, settingsTable } from "@/db/schema";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSystemAccess, requireAuthenticatedUser } from "@/lib/system-rbac";

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

const DEFAULT_HIGHLIGHTS_CONTROL: HighlightsControl = {
  highlight_mode: "auto",
  manual_highlights: [],
};

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

export async function getHighlightsControlAction(): Promise<HighlightsControl> {
  const record = await readHighlightsControlRecord();
  return normalizeHighlightsControl(record?.data);
}

export async function updateHighlightsControlAction(nextControl: Partial<HighlightsControl>) {
  await requireAdminAccess();

  const existing = await getHighlightsControlAction();
  const normalized = normalizeHighlightsControl({
    highlight_mode: nextControl.highlight_mode ?? existing.highlight_mode,
    manual_highlights: nextControl.manual_highlights ?? existing.manual_highlights,
  });

  const existingRecord = await readHighlightsControlRecord();
  if (existingRecord) {
    await db
      .update(settingsTable)
      .set({ data: normalized, updatedAt: new Date() })
      .where(eq(settingsTable.id, HIGHLIGHTS_CONTROL_ID));
  } else {
    await db.insert(settingsTable).values({
      id: HIGHLIGHTS_CONTROL_ID,
      data: normalized,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");

  return normalized;
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
