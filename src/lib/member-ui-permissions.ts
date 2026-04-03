type AccessLike = {
  isAdmin: boolean;
  hasPermission: (key: string) => boolean;
};

export function canApproveMembers(access: AccessLike) {
  return access.isAdmin || access.hasPermission("approve_actions");
}

export function canEditRole(access: AccessLike) {
  return access.isAdmin;
}

export function canDeleteUser(access: AccessLike) {
  return access.isAdmin;
}

export function canEditResponsibility(access: AccessLike) {
  return access.isAdmin || access.hasPermission("approve_actions");
}

export function canTogglePublic(access: AccessLike) {
  return access.isAdmin;
}

export function canManagePublicDirectory(access: AccessLike) {
  return access.isAdmin;
}
