"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDisabledFeatureKeys,
  isMaintenanceActive,
  type SystemControlSettings,
} from "@/lib/system-control";
import type {
  ActivityEntry,
  Announcement,
  MyProject,
  Notification,
  PortalDataState,
  PortalUser,
  QuizLeaderboardGroups,
} from "./types";

export function usePortalData(user: PortalUser): PortalDataState {
  const userId = user?.id ?? null;
  const userImage = user?.image ?? null;
  const userProfileImageKey = user?.profileImageKey ?? null;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [portalAnnouncements, setPortalAnnouncements] = useState<Announcement[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [systemControl, setSystemControl] = useState<SystemControlSettings | null>(null);
  const [myProjects, setMyProjects] = useState<MyProject[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [portalMetaLoading, setPortalMetaLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [leaderboards, setLeaderboards] = useState<QuizLeaderboardGroups>({
    daily: [],
    weekly: [],
    monthly: [],
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const fetchPortalData = useCallback(async () => {
    if (!userId) return;

    setNotificationsLoading(true);
    setPortalMetaLoading(true);
    setProjectsLoading(true);

    try {
      const [
        { getMyNotificationsAction, getMyProjectsAction },
        { getSystemControlPublicSnapshotAction },
        { getMyAnnouncementsAction },
        { getMyRecentActivityAction },
      ] = await Promise.all([
        import("@/app/actions/notifications"),
        import("@/app/actions/system-control"),
        import("@/app/actions/announcements"),
        import("@/app/actions/activity-logs"),
      ]);

      const [notifs, projects] = await Promise.all([
        getMyNotificationsAction(),
        getMyProjectsAction(),
      ]);

      const [control, announcementRows, activityRows] = await Promise.all([
        getSystemControlPublicSnapshotAction(),
        getMyAnnouncementsAction(),
        getMyRecentActivityAction(),
      ]);

      setNotifications(notifs);
      setMyProjects(projects);
      setSystemControl(control);
      setPortalAnnouncements(announcementRows);
      setRecentActivity(activityRows);
    } catch (err) {
      console.error("[Portal] fetchPortalData error:", err);
    } finally {
      setNotificationsLoading(false);
      setPortalMetaLoading(false);
      setProjectsLoading(false);
    }
  }, [userId]);

  const loadLeaderboards = useCallback(async () => {
    if (!userId) return;

    try {
      const { getQuizLeaderboardAction } = await import("@/app/actions/quizzes");
      const [daily, weekly, monthly] = await Promise.all([
        getQuizLeaderboardAction("daily"),
        getQuizLeaderboardAction("weekly"),
        getQuizLeaderboardAction("monthly"),
      ]);
      setLeaderboards({ daily, weekly, monthly });
    } catch (err) {
      console.error("[Portal] loadLeaderboards error:", err);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setPortalAnnouncements([]);
      setRecentActivity([]);
      setMyProjects([]);
      setLeaderboards({ daily: [], weekly: [], monthly: [] });
      setSystemControl(null);
      return;
    }

    fetchPortalData();
    loadLeaderboards();
  }, [fetchPortalData, loadLeaderboards, userId]);

  useEffect(() => {
    if (!userId) {
      setProfileImageUrl(null);
      setImgError(false);
      setSystemControl(null);
      return;
    }

    const nextProfileSrc =
      userImage ||
      (userProfileImageKey
        ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ""}/${userProfileImageKey}`
        : null);

    setProfileImageUrl(nextProfileSrc);
    setImgError(false);
  }, [userId, userImage, userProfileImageKey]);

  const disabledFeatures = systemControl ? getDisabledFeatureKeys(systemControl) : [];
  const maintenanceActive = systemControl ? isMaintenanceActive(systemControl) : false;

  const formatTimestamp = (value: string | null) =>
    value
      ? new Date(value).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Kolkata",
        })
      : "Unknown";

  const formatRelativeTime = (value: string) => {
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return {
    notifications,
    portalAnnouncements,
    recentActivity,
    systemControl,
    myProjects,
    notificationsLoading,
    portalMetaLoading,
    projectsLoading,
    leaderboards,
    profileImageUrl,
    imgError,
    disabledFeatures,
    maintenanceActive,
    setNotifications,
    setProfileImageUrl,
    setImgError,
    formatTimestamp,
    formatRelativeTime,
  };
}
