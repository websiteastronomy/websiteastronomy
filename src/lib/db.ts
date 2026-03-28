import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  onSnapshot,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";
import {
  readSiteSettingsLocal,
  readAboutSettingsLocal,
  writeSiteSettingsLocal,
  writeAboutSettingsLocal,
  stripUndefinedDeep,
} from "./settingsLocal";

function finiteOr(n: unknown, fallback: number): number {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string" && n.trim() !== "") {
    const v = Number(n);
    if (Number.isFinite(v)) return v;
  }
  return fallback;
}

function sanitizeHeroStats(h: SiteSettings["heroStats"]): SiteSettings["heroStats"] {
  return {
    members: finiteOr(h.members, 0),
    projects: finiteOr(h.projects, 0),
    events: finiteOr(h.events, 0),
    impact: finiteOr(h.impact, 0),
  };
}

function localOverlaySite(base: SiteSettings, local: Record<string, unknown> | null): SiteSettings {
  if (!local) return { ...base, heroStats: sanitizeHeroStats(base.heroStats) };
  const h = local.heroStats;
  const d = local.dailyFact;
  const merged = {
    ...base,
    isRecruiting: typeof local.isRecruiting === "boolean" ? local.isRecruiting : base.isRecruiting,
    heroStats: {
      ...base.heroStats,
      ...(h && typeof h === "object" && !Array.isArray(h) ? (h as SiteSettings["heroStats"]) : {}),
    },
    dailyFact: {
      ...base.dailyFact,
      ...(d && typeof d === "object" && !Array.isArray(d) ? (d as SiteSettings["dailyFact"]) : {}),
    },
    featuredProjectId:
      typeof local.featuredProjectId === "string" ? local.featuredProjectId : base.featuredProjectId,
    featuredEventId:
      typeof local.featuredEventId === "string" ? local.featuredEventId : base.featuredEventId,
    nightSky: local.nightSky !== undefined ? local.nightSky : base.nightSky,
  };
  return { ...merged, heroStats: sanitizeHeroStats(merged.heroStats) };
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
// TYPES (Ported from Mock Data)
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
  nightSky?: any;
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

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC CRUD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

export const getCollection = async <T>(collectionName: string) => {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

export const getDocument = async <T>(collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
};

export const addDocument = async (collectionName: string, data: any) => {
  const colRef = collection(db, collectionName);
  return await addDoc(colRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  const docRef = doc(db, collectionName, id);
  return await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteDocument = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  return await deleteDoc(docRef);
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIZED HOOKS & UTILS
// ─────────────────────────────────────────────────────────────────────────────

// Site Settings (Singleton in Firestore)
const SETTINGS_ID = "global_config";

export const getSiteSettings = async (): Promise<SiteSettings> => {
  const defaults: SiteSettings = {
    isRecruiting: true,
    heroStats: { members: 120, projects: 8, events: 50, impact: 1000 },
    dailyFact: { text: "The universe is expanding.", source: "NASA" },
    featuredProjectId: "",
    featuredEventId: ""
  };
  let base: SiteSettings = { id: SETTINGS_ID, ...defaults };
  try {
    const settings = await getDocument<SiteSettings>("settings", SETTINGS_ID);
    if (!settings) {
      try { await setDoc(doc(db, "settings", SETTINGS_ID), defaults); } catch (e) { /* write may fail */ }
      base = { id: SETTINGS_ID, ...defaults };
    } else {
      base = { id: SETTINGS_ID, ...settings };
    }
  } catch (err) {
    console.error('[getSiteSettings] Firestore error, returning defaults:', err);
    base = { id: SETTINGS_ID, ...defaults };
  }
  // Always merge localStorage on top so offline / failed Firestore writes still appear (same browser).
  return localOverlaySite(base, readSiteSettingsLocal());
};

/** Upsert site settings — merge write; mirrors to localStorage on success or if Firestore fails. */
export const updateSiteSettings = async (data: Partial<SiteSettings>) => {
  const docRef = doc(db, "settings", SETTINGS_ID);
  const normalized: Partial<SiteSettings> = { ...data };
  if (normalized.heroStats) {
    normalized.heroStats = sanitizeHeroStats(normalized.heroStats);
  }
  const raw = { ...normalized, updatedAt: Timestamp.now() } as Record<string, unknown>;
  delete raw.id;
  const payload = stripUndefinedDeep(raw) as Record<string, unknown>;
  try {
    await setDoc(docRef, payload, { merge: true });
    writeSiteSettingsLocal({ ...normalized } as Record<string, unknown>);
  } catch (e) {
    console.warn("[updateSiteSettings] Firestore error, persisting locally:", e);
    writeSiteSettingsLocal({ ...normalized } as Record<string, unknown>);
  }
};

// About Page Settings (Singleton)
const ABOUT_SETTINGS_ID = "about_page";

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
    const settings = await getDocument<AboutPageSettings>("settings", ABOUT_SETTINGS_ID);
    if (!settings) {
      try { await setDoc(doc(db, "settings", ABOUT_SETTINGS_ID), defaults); } catch (e) { /* write may fail due to permissions */ }
      base = defaults;
    } else {
      base = settings;
    }
  } catch (err) {
    console.error('[getAboutSettings] Firestore error, returning defaults:', err);
    base = defaults;
  }
  return localOverlayAbout(base, readAboutSettingsLocal());
};

/** Upsert about page settings — merge write; mirrors to localStorage on success or if Firestore fails. */
export const updateAboutSettings = async (data: Partial<AboutPageSettings>) => {
  const docRef = doc(db, "settings", ABOUT_SETTINGS_ID);
  const raw = { ...data, updatedAt: Timestamp.now() } as Record<string, unknown>;
  const payload = stripUndefinedDeep(raw) as Record<string, unknown>;
  try {
    await setDoc(docRef, payload, { merge: true });
    writeAboutSettingsLocal({ ...data } as Record<string, unknown>);
  } catch (e) {
    console.warn("[updateAboutSettings] Firestore error, persisting locally:", e);
    writeAboutSettingsLocal({ ...data } as Record<string, unknown>);
  }
};

// Real-time Listeners for Admin Dashboard
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  const colRef = collection(db, collectionName);
  // Try ordered query first; fall back to unordered if updatedAt field is missing
  let unsubscribe: (() => void) | null = null;
  try {
    const q = query(colRef, orderBy("updatedAt", "desc"));
    unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    }, (error) => {
      // Firestore index or field error — fallback to unordered query
      console.warn(`[subscribeToCollection] Ordered query failed for '${collectionName}', falling back to unordered:`, error.message);
      unsubscribe = onSnapshot(colRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(items);
      });
    });
  } catch (e) {
    // Sync error fallback
    unsubscribe = onSnapshot(colRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    });
  }
  return () => { if (unsubscribe) unsubscribe(); };
};
