"use server";

import { db } from "@/db";
import { articles, events, observations, projects } from "@/db/schema";
import { and, desc, eq, isNull, or } from "drizzle-orm";

export type HighlightItem = {
  id: string;
  title: string;
  image: string | null;
  type: "article" | "observation" | "event" | "project";
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

export async function getHighlights() {
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
