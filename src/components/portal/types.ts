"use client";

import type { SystemControlSettings, SystemFeatureFlags } from "@/lib/system-control";

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  targetRoles: string[];
  createdAt: string | null;
};

export type ActivityEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  timestamp: string | null;
};

export type MyProject = {
  id: string;
  name: string;
  status: string;
  role: string;
  progress: number;
};

export type LeaderboardRow = {
  name: string;
  score: number;
  userId: string;
};

export type QuizLeaderboardGroups = {
  daily: LeaderboardRow[];
  weekly: LeaderboardRow[];
  monthly: LeaderboardRow[];
};

export type PortalUser = {
  id?: string | null;
  image?: string | null;
  name?: string | null;
  email?: string | null;
  profileImageKey?: string | null;
  quote?: string | null;
} | null;

export type PortalDataState = {
  notifications: Notification[];
  portalAnnouncements: Announcement[];
  recentActivity: ActivityEntry[];
  systemControl: SystemControlSettings | null;
  myProjects: MyProject[];
  notificationsLoading: boolean;
  portalMetaLoading: boolean;
  projectsLoading: boolean;
  leaderboards: QuizLeaderboardGroups;
  profileImageUrl: string | null;
  imgError: boolean;
  disabledFeatures: Array<keyof SystemFeatureFlags>;
  maintenanceActive: boolean;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setProfileImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setImgError: React.Dispatch<React.SetStateAction<boolean>>;
  formatTimestamp: (value: string | null) => string;
  formatRelativeTime: (value: string) => string;
};
