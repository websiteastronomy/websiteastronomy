import {
  fetchCollectionAction,
  fetchDocumentAction,
  addDocumentAction,
  updateDocumentAction,
  deleteDocumentAction,
  updateAboutSettingsAction
} from "@/app/actions";
import { getAboutPageDataAction } from "@/app/actions/about-page-control";
import {
  readAboutSettingsLocal,
  writeAboutSettingsLocal,
  stripUndefinedDeep,
} from "./settingsLocal";
import type { NightSkySettings } from "@/data/mockNightSky";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface SiteSettings {
  id?: string;
  isRecruiting: boolean;
  heroStats: {
    members: number;
    projects: number;
    events: number;
    impact: number;
  };
  dailyFact: {
    text: string;
    source: string;
  };
  featuredProjectId: string;
  featuredEventId: string;
  nightSky?: NightSkySettings;
  nightSkyStructured?: NightSkySettings;
}

export interface AboutPageSettings {
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
}

function localOverlayAbout(base: AboutPageSettings, local: Record<string, unknown> | null): AboutPageSettings {
  if (!local) return base;
  const v = local.vision;
  const m = local.mission;
  return {
    vision: {
      ...base.vision,
      ...(v && typeof v === "object" && !Array.isArray(v) ? (v as AboutPageSettings["vision"]) : {}),
    },
    mission: {
      ...base.mission,
      ...(m && typeof m === "object" && !Array.isArray(m) ? (m as AboutPageSettings["mission"]) : {}),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC CRUD WRAPPER (Server Actions Proxy)
// ─────────────────────────────────────────────────────────────────────────────
export const getCollection = async <T>(collectionName: string) => {
  return await fetchCollectionAction(collectionName) as unknown as Promise<T[]>;
};

export const getDocument = async <T>(collectionName: string, id: string) => {
  return await fetchDocumentAction(collectionName, id) as unknown as Promise<T | null>;
};

export const addDocument = async (collectionName: string, data: any) => {
  return await addDocumentAction(collectionName, data);
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  return await updateDocumentAction(collectionName, id, data);
};

export const deleteDocument = async (collectionName: string, id: string) => {
  return await deleteDocumentAction(collectionName, id);
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIZED HOOKS & UTILS
// ─────────────────────────────────────────────────────────────────────────────
export const getAboutSettings = async (): Promise<AboutPageSettings> => {
  const defaults: AboutPageSettings = {
    vision: {
      title: "Our Vision",
      text: "To be a leading student astronomy community that inspires curiosity, drives innovation through hands-on research, and builds a bridge between engineering and the cosmos.",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80"
    },
    mission: {
      title: "Our Mission",
      text: "Through weekly observation nights, hands-on optomechanical projects, and community outreach, we empower students to explore the universe beyond textbooks and classrooms.",
      imageUrl: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800&q=80"
    }
  };
  
  let base: AboutPageSettings = defaults;
  try {
    base = await getAboutPageDataAction();
  } catch (err) {
    console.error('[getAboutSettings] DB error, returning defaults:', err);
  }
  return localOverlayAbout(base, readAboutSettingsLocal());
};

export const updateAboutSettings = async (data: Partial<AboutPageSettings>) => {
  const raw = { ...data } as Record<string, unknown>;
  const payload = stripUndefinedDeep(raw) as Record<string, unknown>;
  try {
    await updateAboutSettingsAction(payload);
    writeAboutSettingsLocal({ ...data } as Record<string, unknown>);
  } catch (e) {
    console.warn("[updateAboutSettings] DB error, persisting locally:", e);
    writeAboutSettingsLocal({ ...data } as Record<string, unknown>);
  }
};

/**
 * Replaces Firestore real-time snapshots with a polling mechanism.
 * Fetches immediately, then poles every 5 seconds.
 */
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  let isSubscribed = true;

  const fetchData = async () => {
    try {
      if (!isSubscribed) return;
      const items = await fetchCollectionAction(collectionName);
      if (isSubscribed) callback(items);
    } catch (e) {
      console.error(`Error fetching collection ${collectionName}:`, e);
    }
  };

  fetchData();

  return () => {
    isSubscribed = false;
  };
};
