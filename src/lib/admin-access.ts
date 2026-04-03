type AccessLike = {
  isAdmin: boolean;
  hasPermission: (key: string) => boolean;
};

export const ADMIN_PAGE_PERMISSIONS = {
  overview: (access: AccessLike) =>
    access.isAdmin ||
    access.hasPermission("manage_projects") ||
    access.hasPermission("approve_actions"),
  events: (access: AccessLike) =>
    access.isAdmin || access.hasPermission("manage_events"),
  members: (access: AccessLike) =>
    access.isAdmin || access.hasPermission("approve_actions"),
  articles: (access: AccessLike) =>
    access.isAdmin || access.hasPermission("approve_actions"),
  projects: (access: AccessLike) =>
    access.isAdmin || access.hasPermission("manage_projects"),
  observations: (access: AccessLike) =>
    access.isAdmin || access.hasPermission("manage_projects"),
  outreach: (access: AccessLike) => access.isAdmin,
  achievements: (access: AccessLike) => access.isAdmin,
  nightSky: (access: AccessLike) => access.isAdmin,
  gallery: (access: AccessLike) => access.isAdmin,
  settings: (access: AccessLike) => access.isAdmin,
  system: (access: AccessLike) => access.isAdmin,
} as const;

export function canAccessAdminPage(access: AccessLike) {
  return (
    access.isAdmin ||
    access.hasPermission("manage_projects") ||
    access.hasPermission("approve_actions")
  );
}
