"use server";

import crypto from "crypto";
import Razorpay from "razorpay";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { expenses, files, form_responses, notifications, payments, project_files, projects, users } from "@/db/schema";
import { logActivity } from "@/lib/activity-logs";
import {
  FinancePaymentType,
  getCurrentFinanceSession,
  getFinanceAccess,
  requireExpenseSubmissionAccess,
  requireFinanceApprovalAccess,
  requireFinanceExportAccess,
  requireFinanceViewAccess,
} from "@/lib/finance";
import { createNotificationsForUsers, createNotificationForUser } from "./notifications";

type FinanceCapabilities = {
  hasPayments: boolean;
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
          and table_name in ('payments', 'expenses')
      `);
      const tableNames = new Set(extractRows(result).map((row) => String(row.table_name)));
      return {
        hasPayments: tableNames.has("payments"),
        hasExpenses: tableNames.has("expenses"),
      };
    })();
  }

  return financeCapabilitiesPromise;
}

async function requireFinancePaymentsMigration() {
  const capabilities = await getFinanceCapabilities();
  if (!capabilities.hasPayments) {
    throw new Error("Finance migration has not been applied yet.");
  }
}

async function requireFinanceExpensesMigration() {
  const capabilities = await getFinanceCapabilities();
  if (!capabilities.hasExpenses) {
    throw new Error("Finance migration has not been applied yet.");
  }
}

type CreateOrderInput = {
  amount: number;
  type: FinancePaymentType;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
};

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

function getRazorpayConfig() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay environment variables are not configured.");
  }

  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  };
}

function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayConfig();
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
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

async function resolvePaymentAmount(input: CreateOrderInput) {
  if (input.type !== "form") {
    return parseAmount(input.amount);
  }

  if (!input.referenceId) {
    throw new Error("Form payments require a reference id.");
  }

  const [form] = await db
    .select({ content: project_files.content, name: project_files.name })
    .from(project_files)
    .where(eq(project_files.id, input.referenceId))
    .limit(1);

  if (!form) {
    throw new Error("Referenced form not found.");
  }

  const settings = (form.content && typeof form.content === "object" ? (form.content as Record<string, any>).settings : null) || {};
  const amount = parseAmount(Number(settings.amount || input.amount));
  if (settings.paymentEnabled !== true) {
    throw new Error("This form does not have payments enabled.");
  }
  return amount;
}

function buildOrderReceipt(input: CreateOrderInput) {
  const referencePart = input.referenceId ? String(input.referenceId).slice(0, 18) : "general";
  return `${input.type}_${referencePart}_${Date.now()}`.slice(0, 40);
}

export async function createPaymentOrderAction(input: CreateOrderInput) {
  await requireFinancePaymentsMigration();
  const razorpay = getRazorpayClient();
  const user = await getCurrentFinanceSession();
  if (!user?.id || !user.email) {
    throw new Error("Unauthorized");
  }

  const amount = await resolvePaymentAmount(input);
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: buildOrderReceipt(input),
    notes: {
      type: input.type,
      referenceId: input.referenceId || "",
      createdBy: user.id,
    },
  });

  const paymentId = uuidv4();
  await db.insert(payments).values({
    id: paymentId,
    userId: user.id,
    email: user.email,
    amount,
    currency: "INR",
    razorpayOrderId: order.id,
    status: "pending",
    type: input.type,
    referenceId: input.referenceId || null,
    paymentMethod: null,
    details: input.metadata || {},
    createdAt: new Date(),
  });

  const access = await getFinanceAccess(user.id);
  await logFinanceActivity({
    userId: user.id,
    role: access.roleName,
    action: "create_payment_order",
    entityType: "payment",
    entityId: paymentId,
    details: {
      amount,
      type: input.type,
      referenceId: input.referenceId || null,
      razorpayOrderId: order.id,
    },
  });

  revalidateFinancePaths();
  return {
    paymentRecordId: paymentId,
    orderId: order.id,
    amount,
    currency: "INR",
    key: process.env.RAZORPAY_KEY_ID || "",
  };
}

export async function recordPaymentAttemptAction(input: {
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
}) {
  await requireFinancePaymentsMigration();
  const user = await getCurrentFinanceSession();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.razorpayOrderId, input.razorpayOrderId))
    .limit(1);

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  if (payment.userId && payment.userId !== user.id) {
    throw new Error("Forbidden");
  }

  if (input.razorpayPaymentId && !payment.razorpayPaymentId) {
    await db
      .update(payments)
      .set({ razorpayPaymentId: input.razorpayPaymentId })
      .where(eq(payments.id, payment.id));
  }

  return { success: true };
}

async function markFormResponsePaid(payment: typeof payments.$inferSelect) {
  const details = (payment.details || {}) as Record<string, unknown>;
  const formResponseId = typeof details.formResponseId === "string" ? details.formResponseId : null;
  if (!formResponseId) {
    return;
  }

  await db
    .update(form_responses)
    .set({
      paymentStatus: "success",
      paymentId: payment.razorpayPaymentId,
    })
    .where(eq(form_responses.id, formResponseId));
}

export async function processCapturedPaymentAction(payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  paymentMethod?: string | null;
}) {
  await requireFinancePaymentsMigration();
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.razorpayOrderId, payload.razorpayOrderId))
    .limit(1);

  if (!payment) {
    return { ignored: true, reason: "payment_not_found" as const };
  }

  if (payment.status === "success") {
    return { ignored: true, reason: "already_processed" as const };
  }

  const conflict = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.razorpayPaymentId, payload.razorpayPaymentId))
    .limit(1);

  if (conflict.length > 0 && conflict[0].id !== payment.id) {
    return { ignored: true, reason: "duplicate_payment_id" as const };
  }

  await db
    .update(payments)
    .set({
      status: "success",
      razorpayPaymentId: payload.razorpayPaymentId,
      paymentMethod: payload.paymentMethod || null,
    })
    .where(eq(payments.id, payment.id));

  const paymentAfterUpdate = { ...payment, razorpayPaymentId: payload.razorpayPaymentId, paymentMethod: payload.paymentMethod || null };
  if (payment.type === "form") {
    await markFormResponsePaid(paymentAfterUpdate);
  }

  const roleName = payment.userId ? (await getFinanceAccess(payment.userId)).roleName : null;
  await logFinanceActivity({
    userId: payment.userId,
    role: roleName,
    action: "payment_success",
    entityType: "payment",
    entityId: payment.id,
    details: {
      amount: payment.amount,
      type: payment.type,
      referenceId: payment.referenceId,
      razorpayPaymentId: payload.razorpayPaymentId,
      paymentMethod: payload.paymentMethod || null,
    },
  });

  if (payment.userId) {
    await createNotificationForUser({
      userId: payment.userId,
      type: payment.type === "form" ? "form" : "system",
      title: "Payment Successful",
      message: `Your ${payment.type} payment of Rs. ${payment.amount} was confirmed.`,
      referenceId: payment.id,
      link: payment.type === "form" && payment.referenceId ? `/forms/${payment.referenceId}` : "/portal",
    });
  }

  revalidateFinancePaths();
  return { ignored: false };
}

export async function verifyWebhookSignatureAction(rawBody: string, signature: string | null) {
  const { webhookSecret } = getRazorpayConfig();
  if (!webhookSecret) {
    throw new Error("Razorpay webhook secret is not configured.");
  }
  if (!signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
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
          link: "/admin?tab=finance",
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
      link: "/admin?tab=finance",
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

export async function getPaymentsAction() {
  const { access, user } = await requireFinanceViewAccess();
  const capabilities = await getFinanceCapabilities();
  if (!capabilities.hasPayments) {
    return [];
  }
  const rows = await db
    .select({
      id: payments.id,
      userId: payments.userId,
      email: payments.email,
      amount: payments.amount,
      currency: payments.currency,
      razorpayOrderId: payments.razorpayOrderId,
      razorpayPaymentId: payments.razorpayPaymentId,
      status: payments.status,
      type: payments.type,
      referenceId: payments.referenceId,
      paymentMethod: payments.paymentMethod,
      details: payments.details,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .orderBy(desc(payments.createdAt));

  return access.canApproveExpenses ? rows : rows.filter((row) => row.userId === user.id);
}

export async function getMyPaymentsAction() {
  const user = await getCurrentFinanceSession();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }
  const capabilities = await getFinanceCapabilities();
  if (!capabilities.hasPayments) {
    return [];
  }

  return db
    .select({
      id: payments.id,
      userId: payments.userId,
      email: payments.email,
      amount: payments.amount,
      currency: payments.currency,
      razorpayOrderId: payments.razorpayOrderId,
      razorpayPaymentId: payments.razorpayPaymentId,
      status: payments.status,
      type: payments.type,
      referenceId: payments.referenceId,
      paymentMethod: payments.paymentMethod,
      details: payments.details,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.createdAt));
}

export async function getFinanceSummaryAction() {
  await requireFinanceViewAccess();
  const capabilities = await getFinanceCapabilities();
  if (!capabilities.hasPayments || !capabilities.hasExpenses) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    };
  }

  const [incomeRows, expenseRows] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(eq(payments.status, "success")),
    db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(eq(expenses.status, "approved")),
  ]);

  const totalIncome = Number(incomeRows[0]?.total || 0);
  const totalExpenses = Number(expenseRows[0]?.total || 0);
  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
  };
}

export async function getFinanceDashboardAction() {
  const [summary, paymentRows, expenseRows] = await Promise.all([
    getFinanceSummaryAction(),
    getPaymentsAction(),
    getExpensesAction(),
  ]);

  return {
    ...summary,
    recentPayments: paymentRows.slice(0, 10),
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
  const [paymentRows, expenseRows, activityRows] = await Promise.all([
    capabilities.hasPayments ? db.select().from(payments).orderBy(desc(payments.createdAt)) : Promise.resolve([]),
    capabilities.hasExpenses ? db.select().from(expenses).orderBy(desc(expenses.createdAt)) : Promise.resolve([]),
    db.execute(sql`
      select *
      from activity_logs
      where entity_type in ('payment', 'expense')
      order by timestamp desc
    `),
  ]);

  const activityRowsNormalized = Array.isArray(activityRows.rows) ? activityRows.rows : [];
  return {
    payments: paymentRows,
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
    payments: exportsPayload.payments,
    expenses: exportsPayload.expenses,
    activity: exportsPayload.activity,
  };
}

export async function getFormPendingPaymentContextAction(formId: string, formResponseId: string) {
  await requireFinancePaymentsMigration();
  const user = await getCurrentFinanceSession();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const [response] = await db
    .select()
    .from(form_responses)
    .where(eq(form_responses.id, formResponseId))
    .limit(1);

  if (!response || response.formId !== formId) {
    throw new Error("Form response not found.");
  }

  if (response.userId && response.userId !== user.id) {
    throw new Error("Forbidden");
  }

  const [form] = await db
    .select({ content: project_files.content, name: project_files.name })
    .from(project_files)
    .where(eq(project_files.id, formId))
    .limit(1);

  if (!form) {
    throw new Error("Form not found.");
  }

  const settings = (form.content && typeof form.content === "object" ? (form.content as Record<string, any>).settings : null) || {};
  if (settings.paymentEnabled !== true) {
    throw new Error("Payments are not enabled for this form.");
  }

  return {
    amount: parseAmount(Number(settings.amount || 0)),
    title: form.name,
  };
}
