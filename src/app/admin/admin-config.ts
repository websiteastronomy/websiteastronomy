type AccessLike = {
  isAdmin: boolean;
  hasPermission: (key: string) => boolean;
};

export type AdminRouteId =
  | "overview"
  | "events"
  | "members"
  | "articles"
  | "projects"
  | "docs"
  | "observations"
  | "quizzes"
  | "outreach"
  | "achievements"
  | "night-sky"
  | "system-control"
  | "announcements"
  | "finance"
  | "activity-logs"
  | "site-settings"
  | "storage";

export type AdminNavItem = {
  id: AdminRouteId;
  label: string;
  icon: string;
  href: string;
  isVisible: (access: AccessLike) => boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: "overview", label: "Overview", icon: "Overview", href: "/admin/overview", isVisible: (access) => access.isAdmin || access.hasPermission("manage_finance") || access.hasPermission("export_finance") || access.hasPermission("manage_projects") || access.hasPermission("approve_actions") },
  { id: "events", label: "Events", icon: "Events", href: "/admin/events", isVisible: (access) => access.isAdmin || access.hasPermission("manage_events") },
  { id: "members", label: "Directory & Approvals", icon: "Members", href: "/admin/members", isVisible: (access) => access.isAdmin || access.hasPermission("approve_actions") },
  { id: "articles", label: "Articles & Facts", icon: "Articles", href: "/admin/articles", isVisible: (access) => access.isAdmin || access.hasPermission("approve_actions") },
  { id: "projects", label: "Projects", icon: "Projects", href: "/admin/projects", isVisible: (access) => access.isAdmin || access.hasPermission("manage_projects") },
  { id: "docs", label: "Documentation", icon: "Docs", href: "/admin/docs", isVisible: (access) => access.isAdmin || access.hasPermission("manage_projects") },
  { id: "observations", label: "Observations", icon: "Obs", href: "/admin/observations", isVisible: (access) => access.isAdmin || access.hasPermission("manage_projects") },
  { id: "quizzes", label: "Quizzes", icon: "Quiz", href: "/admin/quizzes", isVisible: (access) => access.isAdmin || access.hasPermission("approve_actions") },
  { id: "outreach", label: "Outreach", icon: "Reach", href: "/admin/outreach", isVisible: (access) => access.isAdmin },
  { id: "achievements", label: "Achievements", icon: "Awards", href: "/admin/achievements", isVisible: (access) => access.isAdmin },
  { id: "night-sky", label: "Night Sky", icon: "Sky", href: "/admin/night-sky", isVisible: (access) => access.isAdmin },
  { id: "system-control", label: "System Control", icon: "Control", href: "/admin/system-control", isVisible: (access) => access.isAdmin },
  { id: "announcements", label: "Announcements", icon: "News", href: "/admin/announcements", isVisible: (access) => access.isAdmin || access.hasPermission("approve_actions") },
  { id: "finance", label: "Finance", icon: "Funds", href: "/admin/finance", isVisible: (access) => access.isAdmin || access.hasPermission("manage_finance") || access.hasPermission("export_finance") },
  { id: "activity-logs", label: "Activity Logs", icon: "Logs", href: "/admin/activity-logs", isVisible: (access) => access.isAdmin || access.hasPermission("approve_actions") },
  { id: "site-settings", label: "Site Settings", icon: "Settings", href: "/admin/site-settings", isVisible: (access) => access.isAdmin },
  { id: "storage", label: "System Storage", icon: "Storage", href: "/admin/storage", isVisible: (access) => access.isAdmin },
];

export function canAccessAdmin(access: AccessLike) {
  return ADMIN_NAV_ITEMS.some((item) => item.isVisible(access));
}

export function getVisibleAdminNavItems(access: AccessLike) {
  return ADMIN_NAV_ITEMS.filter((item) => item.isVisible(access));
}

export function getAdminHref(id: AdminRouteId) {
  return ADMIN_NAV_ITEMS.find((item) => item.id === id)?.href || "/admin/overview";
}

export function getAdminRouteIdFromPathname(pathname: string): AdminRouteId | null {
  const matched = ADMIN_NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return matched?.id || null;
}
