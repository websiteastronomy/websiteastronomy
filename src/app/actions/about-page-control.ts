"use server";

import { db } from "@/db";
import { settingsTable } from "@/db/schema";
import { ABOUT_VISION_MISSION } from "@/data/aboutPageStatic";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSystemAccess, requireAuthenticatedUser } from "@/lib/system-rbac";

const ABOUT_PAGE_CONTROL_ID = "about_page_control";
const LEGACY_ABOUT_PAGE_ID = "about_page";

export type AboutPageControl = {
  vision_text: string | null;
  mission_text: string | null;
  vision_image: string | null;
  mission_image: string | null;
  updated_at: string | null;
};

export type ResolvedAboutPageData = {
  vision: {
    title: string;
    text: string;
    imageUrl: string;
  };
  mission: {
    title: string;
    text: string;
    imageUrl: string;
  };
};

const EMPTY_ABOUT_PAGE_CONTROL: AboutPageControl = {
  vision_text: null,
  mission_text: null,
  vision_image: null,
  mission_image: null,
  updated_at: null,
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeAboutPageControl(raw: unknown): AboutPageControl {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return EMPTY_ABOUT_PAGE_CONTROL;
  }

  const data = raw as Record<string, unknown>;
  return {
    vision_text: asString(data.vision_text),
    mission_text: asString(data.mission_text),
    vision_image: asString(data.vision_image),
    mission_image: asString(data.mission_image),
    updated_at: asString(data.updated_at),
  };
}

function resolveLegacyAboutPageData(raw: unknown): ResolvedAboutPageData {
  const fallback: ResolvedAboutPageData = {
    vision: {
      title: ABOUT_VISION_MISSION.vision.title,
      text: ABOUT_VISION_MISSION.vision.text,
      imageUrl: ABOUT_VISION_MISSION.vision.imageUrl,
    },
    mission: {
      title: ABOUT_VISION_MISSION.mission.title,
      text: ABOUT_VISION_MISSION.mission.text,
      imageUrl: ABOUT_VISION_MISSION.mission.imageUrl,
    },
  };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return fallback;
  }

  const data = raw as Record<string, unknown>;
  const vision = data.vision;
  const mission = data.mission;

  return {
    vision: {
      title:
        vision && typeof vision === "object" && !Array.isArray(vision) && typeof (vision as Record<string, unknown>).title === "string"
          ? ((vision as Record<string, unknown>).title as string)
          : fallback.vision.title,
      text:
        vision && typeof vision === "object" && !Array.isArray(vision) && typeof (vision as Record<string, unknown>).text === "string"
          ? ((vision as Record<string, unknown>).text as string)
          : fallback.vision.text,
      imageUrl:
        vision && typeof vision === "object" && !Array.isArray(vision) && typeof (vision as Record<string, unknown>).imageUrl === "string"
          ? ((vision as Record<string, unknown>).imageUrl as string)
          : fallback.vision.imageUrl,
    },
    mission: {
      title:
        mission && typeof mission === "object" && !Array.isArray(mission) && typeof (mission as Record<string, unknown>).title === "string"
          ? ((mission as Record<string, unknown>).title as string)
          : fallback.mission.title,
      text:
        mission && typeof mission === "object" && !Array.isArray(mission) && typeof (mission as Record<string, unknown>).text === "string"
          ? ((mission as Record<string, unknown>).text as string)
          : fallback.mission.text,
      imageUrl:
        mission && typeof mission === "object" && !Array.isArray(mission) && typeof (mission as Record<string, unknown>).imageUrl === "string"
          ? ((mission as Record<string, unknown>).imageUrl as string)
          : fallback.mission.imageUrl,
    },
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

async function readSettingRecord(id: string) {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, id)).limit(1);
  return rows[0] || null;
}

export async function getAboutPageControlAction(): Promise<AboutPageControl> {
  const record = await readSettingRecord(ABOUT_PAGE_CONTROL_ID);
  return normalizeAboutPageControl(record?.data);
}

export async function getAboutPageDataAction(): Promise<ResolvedAboutPageData> {
  const [controlRecord, legacyRecord] = await Promise.all([
    readSettingRecord(ABOUT_PAGE_CONTROL_ID),
    readSettingRecord(LEGACY_ABOUT_PAGE_ID),
  ]);

  const control = normalizeAboutPageControl(controlRecord?.data);
  const legacy = resolveLegacyAboutPageData(legacyRecord?.data);

  return {
    vision: {
      title: legacy.vision.title,
      text: control.vision_text ?? legacy.vision.text,
      imageUrl: control.vision_image ?? legacy.vision.imageUrl,
    },
    mission: {
      title: legacy.mission.title,
      text: control.mission_text ?? legacy.mission.text,
      imageUrl: control.mission_image ?? legacy.mission.imageUrl,
    },
  };
}

export async function getAboutPageEditorSnapshotAction() {
  const [control, resolved] = await Promise.all([
    getAboutPageControlAction(),
    getAboutPageDataAction(),
  ]);

  return { control, resolved };
}

export async function updateAboutPageControlAction(nextControl: Partial<AboutPageControl>) {
  await requireAdminAccess();

  const existing = await getAboutPageControlAction();
  const normalized: AboutPageControl = {
    vision_text: nextControl.vision_text === undefined ? existing.vision_text : asString(nextControl.vision_text),
    mission_text: nextControl.mission_text === undefined ? existing.mission_text : asString(nextControl.mission_text),
    vision_image: nextControl.vision_image === undefined ? existing.vision_image : asString(nextControl.vision_image),
    mission_image: nextControl.mission_image === undefined ? existing.mission_image : asString(nextControl.mission_image),
    updated_at: new Date().toISOString(),
  };

  const existingRecord = await readSettingRecord(ABOUT_PAGE_CONTROL_ID);
  if (existingRecord) {
    await db
      .update(settingsTable)
      .set({ data: normalized, updatedAt: new Date() })
      .where(eq(settingsTable.id, ABOUT_PAGE_CONTROL_ID));
  } else {
    await db.insert(settingsTable).values({
      id: ABOUT_PAGE_CONTROL_ID,
      data: normalized,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  revalidatePath("/about");
  revalidatePath("/admin");

  return normalized;
}
