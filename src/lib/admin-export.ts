import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activity_logs, files, form_responses, project_files, settingsTable, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getSystemAccess } from "@/lib/system-rbac";
import { writeAuditLog } from "@/lib/audit";

function isMissingTableError(error: unknown, tableName: string) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(tableName) && (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("Failed query")
  );
}

async function safeQuery<T>(tableName: string, factory: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await factory();
  } catch (error) {
    if (isMissingTableError(error, tableName)) {
      console.warn(`[admin-export] ${tableName} not available yet; returning fallback payload.`);
      return fallback;
    }
    throw error;
  }
}

export async function requireAdminExportAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const access = await getSystemAccess(session.user.id);
  if (!access.isAdmin) {
    throw new Error("Forbidden");
  }

  return session.user;
}

export async function recordAdminExportAction(exportType: string, metadata?: Record<string, unknown>) {
  const user = await requireAdminExportAccess();
  await writeAuditLog({
    action: "admin_export",
    entityType: "export",
    entityId: exportType,
    performedBy: user.id,
    metadata: {
      exportType,
      ...(metadata || {}),
    },
  });
  return user;
}

function formatValue(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "";
  }

  const columns = Array.from(
    rows.reduce((set, row) => {
      for (const key of Object.keys(row)) set.add(key);
      return set;
    }, new Set<string>())
  );

  const escape = (value: unknown) => `"${formatValue(value).replace(/"/g, '""')}"`;
  const header = columns.map((column) => escape(column)).join(",");
  const body = rows.map((row) => columns.map((column) => escape(row[column])).join(","));
  return [header, ...body].join("\n");
}

export function downloadResponse(content: string, filename: string, contentType: string) {
  return new Response(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function getDocsExportPayload() {
  const [projectFileRows, fileRows, formResponseRows] = await Promise.all([
    safeQuery("project_files", () => db.select().from(project_files), [] as any[]),
    safeQuery("files", () => db.select().from(files), [] as any[]),
    safeQuery("form_responses", () => db.select().from(form_responses), [] as any[]),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    projectFiles: projectFileRows,
    files: fileRows,
    formResponses: formResponseRows,
  };
}

export async function getDocsExportCsvRows() {
  const payload = await getDocsExportPayload();
  return [
    ...payload.projectFiles.map((row) => ({ dataset: "project_files", ...row })),
    ...payload.files.map((row) => ({ dataset: "files", ...row })),
    ...payload.formResponses.map((row) => ({ dataset: "form_responses", ...row })),
  ];
}

export async function getFormResponseExportRows(formId?: string | null) {
  return safeQuery(
    "form_responses",
    () =>
      formId?.trim()
        ? db.select().from(form_responses).where(eq(form_responses.formId, formId.trim()))
        : db.select().from(form_responses),
    [] as any[]
  );
}

export async function getActivityExportRows() {
  return safeQuery("activity_logs", () => db.select().from(activity_logs), [] as any[]);
}

export async function getFullBackupPayload() {
  const [userRows, docsPayload, activityRows, settingsRows] = await Promise.all([
    safeQuery(
      "user",
      () =>
        db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          status: users.status,
          role: users.role,
          roleId: users.roleId,
          department: users.department,
          quote: users.quote,
          responsibility: users.responsibility,
          isPublic: users.isPublic,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }).from(users),
      [] as any[]
    ),
    getDocsExportPayload(),
    getActivityExportRows(),
    safeQuery("settings", () => db.select().from(settingsTable), [] as any[]),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    users: userRows,
    projectFiles: docsPayload.projectFiles,
    files: docsPayload.files,
    formResponses: docsPayload.formResponses,
    activityLogs: activityRows,
    settings: settingsRows,
  };
}
