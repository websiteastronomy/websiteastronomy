"use server";

import { db } from "@/db";
import { articles, events, observations, projects } from "@/db/schema";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { getHighlightsControlAction, type ManualHighlightItem } from "@/app/actions/highlights-control";

export type HighlightItem = {
  id: string;
  title: string;
  image: string | null;
  type: "article" | "observation" | "event" | "project";
  description: string;
  link: string;
  priority: number;
  dateValue: number;
  isHighlighted: boolean;
};

const HIGHLIGHTS_LIMIT = 8;

function toEpoch(value: unknown) {
  if (value instanceof Date) {
    return value.getTime();
  }
  const parsed = new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function mapArticle(row: any): HighlightItem {
  return {
    id: row.id,
    title: row.title,
    image: row.coverImageUrl || row.coverImage || null,
    type: "article",
    description: row.excerpt || row.metaDescription || "Read the latest article from the club knowledge base.",
    link: `/education/${row.slug || row.id}`,
    priority: Number(row.highlightPriority || 0),
    dateValue: toEpoch(row.publishedAt || row.updatedAt || row.createdAt),
    isHighlighted: Boolean(row.isHighlighted),
  };
}

function mapObservation(row: any): HighlightItem {
  return {
    id: row.id,
    title: row.title,
    image: row.imageThumbnailUrl || row.imageCompressedUrl || row.imageOriginalUrl || null,
    type: "observation",
    description: row.description || `Observation of ${row.celestialTarget || "the night sky"}.`,
    link: `/observations/${row.id}`,
    priority: Number(row.highlightPriority || 0),
    dateValue: toEpoch(row.capturedAt || row.updatedAt || row.createdAt),
    isHighlighted: Boolean(row.isHighlighted),
  };
}

function mapEvent(row: any): HighlightItem {
  return {
    id: row.id,
    title: row.title,
    image: row.bannerImage || null,
    type: "event",
    description: row.description || row.location || "Explore the next club event.",
    link: `/events/${row.id}`,
    priority: Number(row.highlightPriority || 0),
    dateValue: toEpoch(row.date || row.updatedAt || row.createdAt),
    isHighlighted: Boolean(row.isHighlighted),
  };
}

function mapProject(row: any): HighlightItem {
  return {
    id: row.id,
    title: row.title,
    image: row.coverImage || null,
    type: "project",
    description: row.description || row.objective || "Discover a live astronomy club project.",
    link: `/projects/${row.id}`,
    priority: Number(row.highlightPriority || 0),
    dateValue: toEpoch(row.updatedAt || row.createdAt),
    isHighlighted: Boolean(row.isHighlighted),
  };
}

function sortManual(a: HighlightItem, b: HighlightItem) {
  if (b.priority !== a.priority) {
    return b.priority - a.priority;
  }
  return b.dateValue - a.dateValue;
}

function sortLatest(a: HighlightItem, b: HighlightItem) {
  return b.dateValue - a.dateValue;
}

function dedupeKey(item: HighlightItem) {
  return `${item.type}:${item.id}`;
}

async function getAutomaticHighlights() {
  const [articleRows, observationRows, eventRows, projectRows] = await Promise.all([
    db
      .select()
      .from(articles)
      .where(
        and(
          or(eq(articles.status, "published"), eq(articles.isPublished, true)),
          or(eq(articles.isDeleted, false), isNull(articles.isDeleted))
        )
      )
      .orderBy(desc(articles.publishedAt), desc(articles.updatedAt)),
    db
      .select()
      .from(observations)
      .where(eq(observations.status, "Published"))
      .orderBy(desc(observations.capturedAt), desc(observations.updatedAt)),
    db
      .select()
      .from(events)
      .where(eq(events.isPublished, true))
      .orderBy(desc(events.date), desc(events.updatedAt)),
    db
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(desc(projects.updatedAt)),
  ]);

  const all = [
    ...articleRows.map(mapArticle),
    ...observationRows.map(mapObservation),
    ...eventRows.map(mapEvent),
    ...projectRows.map(mapProject),
  ];

  const manual = all.filter((item) => item.isHighlighted);

  const manualSorted = manual.sort(sortManual);
  const picked = manualSorted.slice(0, HIGHLIGHTS_LIMIT);
  const pickedKeys = new Set(picked.map(dedupeKey));

  const fallback = all
    .filter((item) => !pickedKeys.has(dedupeKey(item)))
    .sort(sortLatest)
    .slice(0, HIGHLIGHTS_LIMIT - picked.length);

  const output = [...picked, ...fallback].slice(0, HIGHLIGHTS_LIMIT);

  return output.map(({ dateValue: _dateValue, isHighlighted: _isHighlighted, ...rest }) => rest);
}

async function resolveManualHighlight(item: ManualHighlightItem): Promise<HighlightItem | null> {
  if (item.type === "article") {
    const rows = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.id, item.id),
          or(eq(articles.status, "published"), eq(articles.isPublished, true)),
          or(eq(articles.isDeleted, false), isNull(articles.isDeleted))
        )
      )
      .limit(1);
    return rows[0] ? { ...mapArticle(rows[0]), priority: item.priority, isHighlighted: true } : null;
  }

  if (item.type === "observation") {
    const rows = await db
      .select()
      .from(observations)
      .where(and(eq(observations.id, item.id), eq(observations.status, "Published")))
      .limit(1);
    return rows[0] ? { ...mapObservation(rows[0]), priority: item.priority, isHighlighted: true } : null;
  }

  if (item.type === "event") {
    const rows = await db
      .select()
      .from(events)
      .where(and(eq(events.id, item.id), eq(events.isPublished, true)))
      .limit(1);
    return rows[0] ? { ...mapEvent(rows[0]), priority: item.priority, isHighlighted: true } : null;
  }

  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, item.id), eq(projects.isPublished, true)))
    .limit(1);
  return rows[0] ? { ...mapProject(rows[0]), priority: item.priority, isHighlighted: true } : null;
}

async function getManualHighlights(manualItems: ManualHighlightItem[]) {
  const resolved = await Promise.all(manualItems.map(resolveManualHighlight));
  return resolved.filter((item): item is HighlightItem => Boolean(item)).sort(sortManual).slice(0, HIGHLIGHTS_LIMIT);
}

export async function getHighlights() {
  const control = await getHighlightsControlAction().catch(() => ({
    highlight_mode: "auto" as const,
    manual_highlights: [],
  }));

  const automatic = await getAutomaticHighlights();

  if (control.highlight_mode === "auto") {
    return automatic;
  }

  const manual = await getManualHighlights(control.manual_highlights);
  if (control.highlight_mode === "manual") {
    return manual.map(({ dateValue: _dateValue, isHighlighted: _isHighlighted, ...rest }) => rest);
  }

  const pickedKeys = new Set(manual.map(dedupeKey));
  const hybrid = [
    ...manual,
    ...automatic
      .filter((item) => !pickedKeys.has(dedupeKey({ ...item, dateValue: 0, isHighlighted: true } as HighlightItem)))
      .map((item) => ({ ...item, dateValue: 0, isHighlighted: false } as HighlightItem)),
  ].slice(0, HIGHLIGHTS_LIMIT);

  return hybrid.map(({ dateValue: _dateValue, isHighlighted: _isHighlighted, ...rest }) => rest);
}
