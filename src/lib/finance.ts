import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSystemAccess } from "@/lib/system-rbac";
import { getUserProfile, hasPermission } from "@/lib/permissions";

export async function getCurrentFinanceSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function getFinanceAccess(userId: string) {
  const [systemAccess, profile, manageFinancePermission, exportFinancePermission, manageProjectsPermission, approveActionsPermission] = await Promise.all([
    getSystemAccess(userId),
    getUserProfile(userId),
    hasPermission(userId, "manage_finance").catch(() => false),
    hasPermission(userId, "export_finance").catch(() => false),
    hasPermission(userId, "manage_projects").catch(() => false),
    hasPermission(userId, "approve_actions").catch(() => false),
  ]);

  const normalizedRole = String(profile?.normalizedRole || "");
  const isFinanceHead = normalizedRole === "Finance Head" || manageFinancePermission;
  const canSubmitExpenses = systemAccess.isAdmin || isFinanceHead || manageProjectsPermission || approveActionsPermission;
  const canApproveExpenses = systemAccess.isAdmin || isFinanceHead;
  const canViewFinance = systemAccess.isAdmin || isFinanceHead || manageProjectsPermission || approveActionsPermission;
  const canExportFinance = systemAccess.isAdmin || isFinanceHead || exportFinancePermission;

  return {
    roleName: normalizedRole || "none",
    isAdmin: systemAccess.isAdmin,
    isFinanceHead,
    canSubmitExpenses,
    canApproveExpenses,
    canViewFinance,
    canExportFinance,
  };
}

export async function requireAuthenticatedFinanceUser() {
  const user = await getCurrentFinanceSession();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireFinanceViewAccess() {
  const user = await requireAuthenticatedFinanceUser();
  const access = await getFinanceAccess(user.id);
  if (!access.canViewFinance) {
    throw new Error("Forbidden");
  }
  return { user, access };
}

export async function requireFinanceApprovalAccess() {
  const user = await requireAuthenticatedFinanceUser();
  const access = await getFinanceAccess(user.id);
  if (!access.canApproveExpenses) {
    throw new Error("Forbidden");
  }
  return { user, access };
}

export async function requireFinanceExportAccess() {
  const user = await requireAuthenticatedFinanceUser();
  const access = await getFinanceAccess(user.id);
  if (!access.canExportFinance) {
    throw new Error("Forbidden");
  }
  return { user, access };
}

export async function requireExpenseSubmissionAccess() {
  const user = await requireAuthenticatedFinanceUser();
  const access = await getFinanceAccess(user.id);
  if (!access.canSubmitExpenses) {
    throw new Error("Forbidden");
  }
  return { user, access };
}
