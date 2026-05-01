"use server";

import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { expenses, projects, users } from "@/db/schema";
import { logActivity } from "@/lib/activity-logs";
import {
  getCurrentFinanceSession,
  getFinanceAccess,
  requireExpenseSubmissionAccess,
  requireFinanceApprovalAccess,
  requireFinanceExportAccess,
  requireFinanceViewAccess,
} from "@/lib/finance";
import { createNotificationsForUsers, createNotificationForUser } from "./notifications";

type FinanceCapabilities = {
  hasExpenses: boolean;
};

let financeCapabilitiesPromise: Promise<FinanceCapabilities> | null = null;

function extractRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object" && "rows" in result && Array.isArray((result as any).rows)) {
    return (result as any).rows as Array<Record<string, unknown>>;
  }
  return [];
}

async function getFinanceCapabilities(): Promise<FinanceCapabilities> {
  if (!financeCapabilitiesPromise) {
    financeCapabilitiesPromise = (async () => {
      const result = await db.execute(sql`
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_name in ('expenses')
      `);
      const tableNames = new Set(extractRows(result).map((row) => String(row.table_name)));
      return {
        hasExpenses: tableNames.has("expenses"),
      };
    })();
  }

  return financeCapabilitiesPromise;
}

async function requireFinanceExpensesMigration() {
  const capabilities = await getFinanceCapabilities();
  if (!capabilities.hasExpenses) {
    throw new Error("Finance migration has not been applied yet.");
  }
}

type ExpenseInput = {
  title: string;
  amount: number;
  category: string;
  projectId?: string | null;
  paidTo: string;
  receiptUrl: string;
};

function parseAmount(amount: number) {
  const rounded = Math.round(Number(amount));
  if (!Number.isFinite(rounded) || rounded <= 0) {
    throw new Error("Amount must be a positive number.");
  }
  return rounded;
}

async function getFinanceNotificationRecipients() {
  const approvedUsers = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.status, "approved"));

  return approvedUsers
    .filter((user) => {
      const normalizedRole = String(user.role || "").toLowerCase();
      return normalizedRole.includes("admin") || normalizedRole.includes("core");
    })
    .map((user) => user.id);
}

async function logFinanceActivity(input: {
  userId?: string | null;
  role?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}) {
  await logActivity({
    userId: input.userId || null,
    role: input.role || null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId || null,
    details: input.details || {},
  });
}

function revalidateFinancePaths() {
  revalidatePath("/admin");
  revalidatePath("/portal");
  revalidatePath("/documentation");
}

export async function addExpenseAction(input: ExpenseInput) {
  await requireFinanceExpensesMigration();
  const { user, access } = await requireExpenseSubmissionAccess();

  const amount = parseAmount(input.amount);
  if (!input.title.trim() || !input.category.trim() || !input.paidTo.trim() || !input.receiptUrl.trim()) {
    throw new Error("All expense fields are required.");
  }

  const id = uuidv4();
  await db.insert(expenses).values({
    id,
    title: input.title.trim(),
    amount,
    category: input.category.trim(),
    projectId: input.projectId || null,
    paidTo: input.paidTo.trim(),
    receiptUrl: input.receiptUrl.trim(),
    status: "pending",
    createdBy: user.id,
    approvedBy: null,
    createdAt: new Date(),
  });

  await logFinanceActivity({
    userId: user.id,
    role: access.roleName,
    action: "create_expense",
    entityType: "expense",
    entityId: id,
    details: {
      title: input.title.trim(),
      amount,
      category: input.category.trim(),
      projectId: input.projectId || null,
    },
  });

  const recipients = await getFinanceNotificationRecipients();
  if (recipients.length > 0) {
    await createNotificationsForUsers(
      recipients
        .filter((recipientId) => recipientId !== user.id)
        .map((recipientId) => ({
          userId: recipientId,
          type: "system",
          title: "New Expense Submitted",
          message: `${input.title.trim()} for Rs. ${amount} is awaiting finance review.`,
          referenceId: id,
          link: "/admin/finance",
        }))
    );
  }

  revalidateFinancePaths();
  return { success: true, id };
}

export async function updateExpenseStatusAction(expenseId: string, status: "approved" | "rejected") {
  await requireFinanceExpensesMigration();
  const { user, access } = await requireFinanceApprovalAccess();
  const [expense] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, expenseId))
    .limit(1);

  if (!expense) {
    throw new Error("Expense not found.");
  }

  await db
    .update(expenses)
    .set({
      status,
      approvedBy: user.id,
    })
    .where(eq(expenses.id, expenseId));

  await logFinanceActivity({
    userId: user.id,
    role: access.roleName,
    action: status === "approved" ? "approve_expense" : "reject_expense",
    entityType: "expense",
    entityId: expenseId,
    details: {
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
    },
  });

  if (expense.createdBy) {
    await createNotificationForUser({
      userId: expense.createdBy,
      type: "system",
      title: status === "approved" ? "Expense Approved" : "Expense Rejected",
      message: `${expense.title} (${expense.amount}) was ${status}.`,
      referenceId: expenseId,
      link: "/admin/finance",
    });
  }

  revalidateFinancePaths();
  return { success: true };
}

export async function getExpensesAction() {
  const { access, user } = await requireFinanceViewAccess();
  const capabilities = await getFinanceCapabilities();
  if (!capabilities.hasExpenses) {
    return [];
  }

  const rows = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      amount: expenses.amount,
      category: expenses.category,
      projectId: expenses.projectId,
      paidTo: expenses.paidTo,
      receiptUrl: expenses.receiptUrl,
      status: expenses.status,
      createdBy: expenses.createdBy,
      approvedBy: expenses.approvedBy,
      createdAt: expenses.createdAt,
      projectTitle: projects.title,
      createdByName: users.name,
    })
    .from(expenses)
    .leftJoin(projects, eq(expenses.projectId, projects.id))
    .leftJoin(users, eq(expenses.createdBy, users.id))
    .orderBy(desc(expenses.createdAt));

  return access.canApproveExpenses ? rows : rows.filter((row) => row.createdBy === user.id);
}

export async function getFinanceSummaryAction() {
  await requireFinanceViewAccess();
  const capabilities = await getFinanceCapabilities();
  if (!capabilities.hasExpenses) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    };
  }

  const expenseRows = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(eq(expenses.status, "approved"));

  const totalExpenses = Number(expenseRows[0]?.total || 0);
  return {
    totalIncome: 0,
    totalExpenses,
    balance: -totalExpenses,
  };
}

export async function getFinanceDashboardAction() {
  const [summary, expenseRows] = await Promise.all([
    getFinanceSummaryAction(),
    getExpensesAction(),
  ]);

  return {
    ...summary,
    recentExpenses: expenseRows.slice(0, 10),
  };
}

export async function getFinanceAccessSnapshotAction() {
  const user = await getCurrentFinanceSession();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const access = await getFinanceAccess(user.id);
  return {
    roleName: access.roleName,
    isAdmin: access.isAdmin,
    isFinanceHead: access.isFinanceHead,
    canSubmitExpenses: access.canSubmitExpenses,
    canApproveExpenses: access.canApproveExpenses,
    canViewFinance: access.canViewFinance,
    canExportFinance: access.canExportFinance,
  };
}

export async function getFinanceExportPayloads() {
  await requireFinanceExportAccess();
  const capabilities = await getFinanceCapabilities();
  const [expenseRows, activityRows] = await Promise.all([
    capabilities.hasExpenses ? db.select().from(expenses).orderBy(desc(expenses.createdAt)) : Promise.resolve([]),
    db.execute(sql`
      select *
      from activity_logs
      where entity_type in ('expense')
      order by timestamp desc
    `),
  ]);

  const activityRowsNormalized = Array.isArray(activityRows.rows) ? activityRows.rows : [];
  return {
    expenses: expenseRows,
    activity: activityRowsNormalized as Record<string, unknown>[],
  };
}

export async function getFinanceBackupPayload() {
  await requireFinanceExportAccess();
  const [exportsPayload, safeUsers] = await Promise.all([
    getFinanceExportPayloads(),
    db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      role: users.role,
      roleId: users.roleId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    users: safeUsers,
    expenses: exportsPayload.expenses,
    activity: exportsPayload.activity,
  };
}
