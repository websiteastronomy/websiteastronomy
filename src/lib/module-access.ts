export type DashboardRole = "member" | "core" | "finance_head" | "admin";

export type DashboardModuleKey =
  | "overview"
  | "events"
  | "members"
  | "articles_facts"
  | "projects"
  | "documentation"
  | "observations"
  | "quizzes"
  | "outreach"
  | "achievements"
  | "night_sky"
  | "system_control"
  | "announcements"
  | "finance"
  | "activity_logs"
  | "site_settings"
  | "system_storage";

export type DashboardModuleDefinition = {
  key: DashboardModuleKey;
  label: string;
  shortLabel: string;
  href: string;
  roles: DashboardRole[];
};

export const moduleAccess: Record<DashboardModuleKey, DashboardRole[]> = {
  overview: ["member", "core", "finance_head", "admin"],
  events: ["core", "finance_head", "admin"],
  members: ["member", "core", "finance_head", "admin"],
  articles_facts: ["member", "core", "finance_head", "admin"],
  projects: ["member", "core", "finance_head", "admin"],
  documentation: ["member", "core", "finance_head", "admin"],
  observations: ["member", "core", "finance_head", "admin"],
  quizzes: ["member", "core", "finance_head", "admin"],
  outreach: ["core", "finance_head", "admin"],
  achievements: ["member", "core", "finance_head", "admin"],
  night_sky: ["member", "core", "finance_head", "admin"],
  system_control: ["admin"],
  announcements: ["member", "core", "finance_head", "admin"],
  finance: ["finance_head", "admin"],
  activity_logs: ["member", "core", "finance_head", "admin"],
  site_settings: ["admin"],
  system_storage: ["admin"],
};

export const dashboardModules: DashboardModuleDefinition[] = [
  { key: "overview", label: "Overview", shortLabel: "OV", href: "/dashboard/overview", roles: moduleAccess.overview },
  { key: "events", label: "Events", shortLabel: "EV", href: "/dashboard/events", roles: moduleAccess.events },
  { key: "members", label: "Directory & Approvals", shortLabel: "MB", href: "/dashboard/members", roles: moduleAccess.members },
  { key: "articles_facts", label: "Articles & Facts", shortLabel: "AR", href: "/dashboard/education", roles: moduleAccess.articles_facts },
  { key: "projects", label: "Projects", shortLabel: "PR", href: "/dashboard/projects", roles: moduleAccess.projects },
  { key: "documentation", label: "Documentation", shortLabel: "DC", href: "/dashboard/documentation", roles: moduleAccess.documentation },
  { key: "observations", label: "Observations", shortLabel: "OB", href: "/dashboard/observations", roles: moduleAccess.observations },
  { key: "quizzes", label: "Quizzes", shortLabel: "QZ", href: "/education/quizzes", roles: moduleAccess.quizzes },
  { key: "outreach", label: "Outreach", shortLabel: "OT", href: "/dashboard/outreach", roles: moduleAccess.outreach },
  { key: "achievements", label: "Achievements", shortLabel: "AC", href: "/dashboard/achievements", roles: moduleAccess.achievements },
  { key: "night_sky", label: "Night Sky", shortLabel: "NS", href: "/dashboard/night-sky", roles: moduleAccess.night_sky },
  { key: "system_control", label: "System Control", shortLabel: "SC", href: "/admin?tab=system-control", roles: moduleAccess.system_control },
  { key: "announcements", label: "Announcements", shortLabel: "AN", href: "/dashboard/announcements", roles: moduleAccess.announcements },
  { key: "finance", label: "Finance", shortLabel: "FN", href: "/dashboard/finance", roles: moduleAccess.finance },
  { key: "activity_logs", label: "Activity Logs", shortLabel: "LG", href: "/dashboard/activity-logs", roles: moduleAccess.activity_logs },
  { key: "site_settings", label: "Site Settings", shortLabel: "ST", href: "/admin?tab=settings", roles: moduleAccess.site_settings },
  { key: "system_storage", label: "System Storage", shortLabel: "SS", href: "/admin?tab=system", roles: moduleAccess.system_storage },
];

type DashboardAccessInput = {
  roleName?: string | null;
  isAdmin?: boolean;
  permissions?: string[];
};

export function deriveDashboardRole({
  roleName,
  isAdmin = false,
  permissions = [],
}: DashboardAccessInput): DashboardRole {
  if (
    isAdmin ||
    roleName === "Admin" ||
    permissions.includes("assign_roles") ||
    permissions.includes("delete_files")
  ) {
    return "admin";
  }

  if (
    roleName === "Finance Head" ||
    permissions.includes("manage_finance") ||
    permissions.includes("export_finance")
  ) {
    return "finance_head";
  }

  if (
    roleName === "Core Committee" ||
    permissions.includes("manage_projects") ||
    permissions.includes("approve_actions") ||
    permissions.includes("manage_events") ||
    permissions.includes("manage_members")
  ) {
    return "core";
  }

  return "member";
}

export function canAccessDashboardModule(
  moduleKey: DashboardModuleKey,
  role: DashboardRole,
) {
  return moduleAccess[moduleKey].includes(role);
}

export function getAccessibleDashboardModules(role: DashboardRole) {
  return dashboardModules.filter((module) => canAccessDashboardModule(module.key, role));
}

export function getDefaultDashboardHref(role: DashboardRole) {
  return getAccessibleDashboardModules(role)[0]?.href || "/dashboard/overview";
}

export function getDashboardRouteModule(
  pathname: string,
): DashboardModuleKey | null {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/overview")) {
    return "overview";
  }
  if (pathname.startsWith("/dashboard/projects")) {
    return "projects";
  }
  if (pathname.startsWith("/dashboard/documentation") || pathname.startsWith("/dashboard/forms")) {
    return "documentation";
  }
  if (pathname.startsWith("/dashboard/finance")) {
    return "finance";
  }
  if (pathname.startsWith("/dashboard/announcements") || pathname.startsWith("/dashboard/notifications")) {
    return "announcements";
  }
  if (pathname.startsWith("/dashboard/activity-logs") || pathname.startsWith("/dashboard/activity")) {
    return "activity_logs";
  }
  if (pathname.startsWith("/dashboard/members")) {
    return "members";
  }
  if (pathname.startsWith("/dashboard/events")) {
    return "events";
  }
  if (pathname.startsWith("/dashboard/observations")) {
    return "observations";
  }
  if (pathname.startsWith("/dashboard/education")) {
    return "articles_facts";
  }
  if (pathname.startsWith("/dashboard/outreach")) {
    return "outreach";
  }
  if (pathname.startsWith("/dashboard/achievements")) {
    return "achievements";
  }
  if (pathname.startsWith("/dashboard/night-sky")) {
    return "night_sky";
  }
  return null;
}
