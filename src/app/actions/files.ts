"use server";

import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db } from "@/db";
import { announcements, files, form_responses, project_files, project_members, projects, resource_permissions, users } from "@/db/schema";
import { and, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { logActivityAction } from "./activity";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { assertProjectPermission } from "@/lib/project_permissions";
import { getSystemAccess } from "@/lib/system-rbac";
import { logActivity } from "@/lib/activity-logs";
import { createNotificationsForUsers } from "./notifications";

import { getUserPermissionOverride, getUserProfile } from "@/lib/permissions";

export type ProjectFileType = "file" | "folder" | "doc" | "form" | "sheet";

export interface ProjectFile {
  id: string;
  projectId: string | null;
  projectTitle?: string | null;
  name: string;
  type: ProjectFileType;
  parentId: string | null;
  fileId: string | null;
  fileSize: string | null;
  mimeType: string | null;
  url: string | null;
  content: Record<string, unknown> | null;
  isGlobal: boolean;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
  hasCustomAccess?: boolean;
  accessState?: "restricted" | "inherited";
  visibleTo?: string[];
  editableBy?: string[];
}

export interface DocumentationManagerItem extends ProjectFile {
  projectTitle: string | null;
}

export type DocumentationSearchFilters = {
  type?: ProjectFileType | "all";
  projectId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
};

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

type DocumentationAction = "view" | "create" | "upload" | "edit" | "delete";

type StructuredItemInput = {
  projectId?: string | null;
  name: string;
  type: ProjectFileType;
  parentId?: string | null;
  fileId?: string | null;
  fileSize?: string | null;
  mimeType?: string | null;
  url?: string | null;
  content?: Record<string, unknown> | null;
  isGlobal?: boolean;
  uploadedBy?: string;
};

export type FormMode = "internal" | "external" | "hybrid";
export type FormQuestionType = "short_answer" | "paragraph" | "multiple_choice" | "checkbox";
export type FormStatus = "draft" | "published";

type FormQuestion = {
  id: string;
  label: string;
  type: FormQuestionType;
  required?: boolean;
  options?: string[];
};

type FormSettings = {
  allowMultiple: boolean;
  requireLogin: boolean;
  collectEmail: boolean;
  paymentEnabled: boolean;
  amount: number;
  deadline: string | null;
  notifyOnSubmit: boolean;
  announcementEnabled: boolean;
  emailEnabled: boolean;
};

export type FormContent = {
  title: string;
  description: string;
  mode: FormMode;
  status: FormStatus;
  fields: FormQuestion[];
  questions: FormQuestion[];
  settings: FormSettings;
};

export type FormExternalDetails = {
  name?: string;
  email?: string;
  phone?: string;
};

export type FormResponseRecord = {
  id: string;
  formId: string;
  userId: string | null;
  isExternal: boolean;
  externalDetails: FormExternalDetails;
  answers: Record<string, unknown>;
  paymentStatus: "pending" | "success" | "failed";
  paymentId: string | null;
  createdAt: Date;
};

export type FormResponseAnswerView = {
  questionId: string;
  question: string;
  type: FormQuestionType;
  answer: string;
};

export type FormResponseView = FormResponseRecord & {
  submitterName: string;
  submitterEmail: string;
  answerViews: FormResponseAnswerView[];
};

export type FormQuestionAnalytics = {
  questionId: string;
  question: string;
  type: FormQuestionType;
  totalResponses: number;
  options?: Array<{ label: string; count: number }>;
  answers?: string[];
};

export type FormAnalytics = {
  totalResponses: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  internalResponses: number;
  externalResponses: number;
  questions: FormQuestionAnalytics[];
};

export type AdminFormListItem = {
  id: string;
  title: string;
  status: FormStatus;
  submissionCount: number;
  createdAt: Date;
};

type ProjectFilesCapabilities = {
  hasFileId: boolean;
  hasContent: boolean;
  hasIsGlobal: boolean;
  hasFormResponses: boolean;
  hasResourcePermissions: boolean;
  fileIdColumn: "file_id" | "fileId" | null;
  isGlobalColumn: "is_global" | "isGlobal" | null;
};

export type ResourceRole = "admin" | "core" | "crew";
type ResourceAction = "view" | "edit";

type ResourcePermissionEntry = {
  id: string;
  resourceId: string;
  resourceType: ProjectFileType;
  role: ResourceRole;
  canView: boolean;
  canEdit: boolean;
  createdAt: Date;
};

export type ResourceAccessConfig = {
  roles: Array<{
    role: ResourceRole;
    canView: boolean;
    canEdit: boolean;
  }>;
  inheritedFromId: string | null;
};

let projectFilesCapabilitiesPromise: Promise<ProjectFilesCapabilities> | null = null;

function extractRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object" && "rows" in result && Array.isArray((result as any).rows)) {
    return (result as any).rows as Array<Record<string, unknown>>;
  }
  return [];
}

async function getProjectFilesCapabilities(): Promise<ProjectFilesCapabilities> {
  if (!projectFilesCapabilitiesPromise) {
    projectFilesCapabilitiesPromise = (async () => {
      const [columnsResult, tablesResult] = await Promise.all([
        db.execute(sql`
          select column_name
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'project_files'
            and column_name in ('file_id', 'fileId', 'content', 'is_global', 'isGlobal')
        `),
        db.execute(sql`
          select table_name
          from information_schema.tables
          where table_schema = 'public'
            and table_name in ('form_responses', 'resource_permissions')
        `),
      ]);

      const columnNames = new Set(extractRows(columnsResult).map((row) => String(row.column_name)));
      const tableNames = new Set(extractRows(tablesResult).map((row) => String(row.table_name)));

      return {
        hasFileId: columnNames.has("file_id") || columnNames.has("fileId"),
        hasContent: columnNames.has("content"),
        hasIsGlobal: columnNames.has("is_global") || columnNames.has("isGlobal"),
        hasFormResponses: tableNames.has("form_responses"),
        hasResourcePermissions: tableNames.has("resource_permissions"),
        fileIdColumn: columnNames.has("file_id") ? "file_id" : columnNames.has("fileId") ? "fileId" : null,
        isGlobalColumn: columnNames.has("is_global") ? "is_global" : columnNames.has("isGlobal") ? "isGlobal" : null,
      };
    })();
  }

  return projectFilesCapabilitiesPromise;
}

function mapLegacyProjectFile(row: {
  id: string;
  projectId: string | null;
  name: string;
  type: string;
  parentId: string | null;
  fileSize: string | null;
  mimeType: string | null;
  url: string | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}): ProjectFile {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    type: (row.type || "file") as ProjectFileType,
    parentId: row.parentId,
    fileId: null,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    url: row.url,
    content: null,
    isGlobal: false,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function fileIdSelectSql(capabilities: ProjectFilesCapabilities) {
  return capabilities.fileIdColumn
    ? (sql.raw(`"project_files"."${capabilities.fileIdColumn}"`) as any)
    : sql<string | null>`null`;
}

function isGlobalSelectSql(capabilities: ProjectFilesCapabilities) {
  return capabilities.isGlobalColumn
    ? (sql.raw(`"project_files"."${capabilities.isGlobalColumn}"`) as any)
    : sql<boolean>`false`;
}

function normalizeQuestionType(type: unknown): FormQuestionType {
  if (type === "paragraph" || type === "multiple_choice" || type === "checkbox" || type === "short_answer") {
    return type;
  }
  if (type === "textarea") return "paragraph";
  if (type === "select") return "multiple_choice";
  return "short_answer";
}

function normalizeFormStatus(status: unknown): FormStatus {
  return status === "draft" ? "draft" : "published";
}

function parseFormDeadline(deadline: unknown): string | null {
  if (typeof deadline !== "string" || !deadline.trim()) return null;
  const parsed = new Date(deadline);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeFilterDateStart(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeFilterDateEnd(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAnswerValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((entry) => formatAnswerValue(entry)).filter(Boolean).join(", ");
  }
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value == null) return "";
  return String(value);
}

function isFormClosed(deadline: string | null | undefined) {
  if (!deadline) return false;
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return false;
  return Date.now() > parsed.getTime();
}

function normalizeFormContent(content: Record<string, unknown> | null | undefined, fallbackTitle: string): FormContent {
  const rawQuestions = Array.isArray(content?.fields)
    ? content?.fields
    : Array.isArray(content?.questions)
      ? content?.questions
      : [];

  const fields = rawQuestions.map((field, index) => {
    const record = (field && typeof field === "object" ? field : {}) as Record<string, unknown>;
    return {
      id: typeof record.id === "string" && record.id ? record.id : `${fallbackTitle}-${index + 1}`,
      label: typeof record.label === "string" && record.label.trim() ? record.label : `Question ${index + 1}`,
      type: normalizeQuestionType(record.type),
      required: record.required === true,
      options: Array.isArray(record.options) ? record.options.map((option) => String(option)).filter(Boolean) : [],
    } satisfies FormQuestion;
  });

  const settingsInput = (content?.settings && typeof content.settings === "object" ? content.settings : {}) as Record<string, unknown>;
  const amountInput = Number(settingsInput.amount ?? 0);

  return {
    title: typeof content?.title === "string" && content.title.trim() ? content.title : fallbackTitle,
    description: typeof content?.description === "string" ? content.description : "",
    mode: content?.mode === "external" || content?.mode === "hybrid" ? content.mode : "internal",
    status: normalizeFormStatus(content?.status),
    fields,
    questions: fields,
    settings: {
      allowMultiple: settingsInput.allowMultiple === true,
      requireLogin: settingsInput.requireLogin === true,
      collectEmail: settingsInput.collectEmail !== false,
      paymentEnabled: settingsInput.paymentEnabled === true,
      amount: Number.isFinite(amountInput) ? Math.max(0, amountInput) : 0,
      deadline: parseFormDeadline(settingsInput.deadline),
      notifyOnSubmit: settingsInput.notifyOnSubmit !== false,
      announcementEnabled: settingsInput.announcementEnabled === true,
      emailEnabled: settingsInput.emailEnabled === true,
    },
  };
}

function serializeFormContent(content: Record<string, unknown> | null | undefined, fallbackTitle: string) {
  const normalized = normalizeFormContent(content, fallbackTitle);
  return {
    title: normalized.title,
    description: normalized.description,
    mode: normalized.mode,
    status: normalized.status,
    fields: normalized.fields,
    questions: normalized.fields,
    settings: normalized.settings,
    updatedAt: new Date().toISOString(),
  };
}

function getSubmitterLabel(session: Awaited<ReturnType<typeof getCurrentSession>>, externalDetails: FormExternalDetails) {
  return session?.user?.name || externalDetails.name || externalDetails.email || "External user";
}

function buildAnswerViews(config: FormContent, answers: Record<string, unknown>): FormResponseAnswerView[] {
  return config.fields.map((field) => ({
    questionId: field.id,
    question: field.label,
    type: field.type,
    answer: formatAnswerValue(answers[field.id]) || "No response",
  }));
}

function buildFormAnalytics(config: FormContent, responses: FormResponseRecord[]): FormAnalytics {
  const questions = config.fields.map<FormQuestionAnalytics>((field) => {
    if (field.type === "multiple_choice") {
      const counts = new Map<string, number>();
      for (const option of field.options || []) counts.set(option, 0);
      for (const response of responses) {
        const value = formatAnswerValue(response.answers[field.id]);
        if (!value) continue;
        counts.set(value, (counts.get(value) || 0) + 1);
      }
      return {
        questionId: field.id,
        question: field.label,
        type: field.type,
        totalResponses: responses.length,
        options: [...counts.entries()].map(([label, count]) => ({ label, count })),
      };
    }

    if (field.type === "checkbox") {
      let yes = 0;
      let no = 0;
      for (const response of responses) {
        if (response.answers[field.id] === true) yes += 1;
        else no += 1;
      }
      return {
        questionId: field.id,
        question: field.label,
        type: field.type,
        totalResponses: responses.length,
        options: [
          { label: "Yes", count: yes },
          { label: "No", count: no },
        ],
      };
    }

    return {
      questionId: field.id,
      question: field.label,
      type: field.type,
      totalResponses: responses.length,
      answers: responses
        .map((response) => formatAnswerValue(response.answers[field.id]))
        .filter(Boolean),
    };
  });

  return {
    totalResponses: responses.length,
    completedPayments: responses.filter((response) => response.paymentStatus === "success").length,
    pendingPayments: responses.filter((response) => response.paymentStatus === "pending").length,
    failedPayments: responses.filter((response) => response.paymentStatus === "failed").length,
    internalResponses: responses.filter((response) => !response.isExternal).length,
    externalResponses: responses.filter((response) => response.isExternal).length,
    questions,
  };
}

function sortStructuredItems(rows: ProjectFile[]) {
  return [...rows].sort((a, b) => {
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });
}

function getRoleBucket(normalizedRole: string | null | undefined): ResourceRole {
  const role = String(normalizedRole || "").toLowerCase();
  if (role === "admin") return "admin";
  if (role.includes("core")) return "core";
  return "crew";
}

function getDocumentationPermissionKey(action: DocumentationAction): string {
  if (action === "delete") return "delete_files";
  if (action === "view") return "manage_projects";
  return "manage_projects";
}

async function getResourcePermissionEntries(resourceIds: string[]): Promise<ResourcePermissionEntry[]> {
  const capabilities = await getProjectFilesCapabilities();
  if (!capabilities.hasResourcePermissions || resourceIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: resource_permissions.id,
      resourceId: resource_permissions.resourceId,
      resourceType: resource_permissions.resourceType,
      role: resource_permissions.role,
      canView: resource_permissions.canView,
      canEdit: resource_permissions.canEdit,
      createdAt: resource_permissions.createdAt,
    })
    .from(resource_permissions)
    .where(inArray(resource_permissions.resourceId, resourceIds)) as Promise<ResourcePermissionEntry[]>;
}

async function getRoleBasedDocumentationAccess(
  projectId: string | null | undefined,
  isGlobal: boolean,
  userId: string | null | undefined,
  action: DocumentationAction
) {
  try {
    await assertDocumentationPermission(projectId, isGlobal, userId, action);
    return true;
  } catch {
    return false;
  }
}

async function resolveResourcePermissionConfig(
  resource: ProjectFile,
  scopedItems: ProjectFile[],
  scopedPermissions: ResourcePermissionEntry[]
): Promise<ResourceAccessConfig> {
  const directEntries = scopedPermissions.filter((entry) => entry.resourceId === resource.id);
  if (directEntries.length > 0) {
    return {
      roles: directEntries.map((entry) => ({
        role: entry.role,
        canView: entry.canView,
        canEdit: entry.canEdit,
      })),
      inheritedFromId: null,
    };
  }

  if (!resource.parentId) {
    return { roles: [], inheritedFromId: null };
  }

  const parent = scopedItems.find((item) => item.id === resource.parentId) || null;
  if (!parent) {
    return { roles: [], inheritedFromId: null };
  }

  const inherited = await resolveResourcePermissionConfig(parent, scopedItems, scopedPermissions);
  return inherited.roles.length
    ? { roles: inherited.roles, inheritedFromId: parent.id }
    : inherited;
}

function summarizeResourceAccess(config: ResourceAccessConfig) {
  if (!config.roles.length) {
    return {
      hasCustomAccess: false,
      accessState: "inherited" as const,
      visibleTo: [] as string[],
      editableBy: [] as string[],
    };
  }

  const visibleTo = config.roles.filter((role) => role.canView).map((role) => role.role);
  const editableBy = config.roles.filter((role) => role.canEdit).map((role) => role.role);

  return {
    hasCustomAccess: true,
    accessState: config.inheritedFromId ? "inherited" as const : "restricted" as const,
    visibleTo,
    editableBy,
  };
}

export async function canUserAccess(
  userId: string | null | undefined,
  resource: ProjectFile,
  action: ResourceAction,
  scopedItems?: ProjectFile[],
  scopedPermissions?: ResourcePermissionEntry[]
) {
  const permissionKey = getDocumentationPermissionKey(action === "view" ? "view" : "edit");
  if (userId) {
    const override = await getUserPermissionOverride(userId, permissionKey);
    if (override !== null) {
      return override;
    }
  }

  const capabilities = await getProjectFilesCapabilities();
  if (capabilities.hasResourcePermissions && userId) {
    const profile = await getUserProfile(userId);
    const bucket = getRoleBucket(profile?.normalizedRole);
    const items = scopedItems || [resource];
    const permissions = scopedPermissions || await getResourcePermissionEntries(items.map((item) => item.id));
    const config = await resolveResourcePermissionConfig(resource, items, permissions);
    const roleEntry = config.roles.find((entry) => entry.role === bucket);
    if (roleEntry) {
      return action === "edit" ? roleEntry.canEdit : roleEntry.canView;
    }
  }

  return getRoleBasedDocumentationAccess(
    resource.projectId,
    resource.isGlobal,
    userId,
    action === "edit" ? "edit" : "view"
  );
}

function mapProjectAction(action: DocumentationAction) {
  if (action === "view") return "canView" as const;
  if (action === "create" || action === "upload") return "canUpload" as const;
  return "canEdit" as const;
}

async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

async function assertGlobalDocumentationPermission(userId: string | null | undefined, action: DocumentationAction) {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const access = await getSystemAccess(userId);
  if (action === "view") {
    return access;
  }

  if (!(access.isAdmin || access.canManageProjects || access.canApproveActions)) {
    throw new Error("Unauthorized: Documentation access denied");
  }

  return access;
}

async function assertDocumentationPermission(
  projectId: string | null | undefined,
  isGlobal: boolean,
  userId: string | null | undefined,
  action: DocumentationAction
) {
  if (userId) {
    const override = await getUserPermissionOverride(userId, getDocumentationPermissionKey(action));
    if (override === false) {
      throw new Error("Unauthorized: Documentation access denied");
    }
    if (override === true) {
      return null;
    }
  }

  if (isGlobal) {
    return assertGlobalDocumentationPermission(userId, action);
  }

  if (!projectId) {
    throw new Error("A projectId is required for project-scoped documentation.");
  }

  await assertProjectPermission(projectId, userId, mapProjectAction(action));
  return null;
}

async function logDocumentationMutation(params: {
  projectId?: string | null;
  isGlobal?: boolean;
  actorName: string;
  actorUserId?: string | null;
  action: string;
  entityId: string;
  entityTitle?: string;
}) {
  if (params.projectId) {
    await logActivityAction(
      params.projectId,
      params.actorName,
      params.action,
      "file",
      params.entityId,
      params.entityTitle
    );
    return;
  }

  const access = params.actorUserId ? await getSystemAccess(params.actorUserId) : null;
  await logActivity({
    userId: params.actorUserId || null,
    action: params.action,
    entityType: "documentation",
    entityId: params.entityId,
    role: access?.roleName || null,
    details: {
      title: params.entityTitle || null,
      scope: params.isGlobal ? "global" : "project",
    },
  });

  const notificationMeta = getDocumentationNotificationMeta(params.action, params.actorName, params.entityTitle);
  if (!notificationMeta) {
    return;
  }

  const recipientIds = (await getDocumentationNotificationRecipients(params.projectId)).filter(
    (userId) => userId !== params.actorUserId
  );

  if (recipientIds.length === 0) {
    return;
  }

  await createNotificationsForUsers(
    recipientIds.map((userId) => ({
      userId,
      type: notificationMeta.type,
      title: notificationMeta.title,
      message: notificationMeta.message,
      referenceId: params.entityId,
      link: params.projectId ? `/projects/${params.projectId}` : "/documentation",
    }))
  );
}

async function getFormNotificationRecipients(form: ProjectFile) {
  const approvedUsers = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.status, "approved"));

  const privileged = approvedUsers
    .filter((user) => {
      const normalizedRole = String(user.role || "").toLowerCase();
      return normalizedRole.includes("admin") || normalizedRole.includes("core");
    })
    .map((user) => user.id);

  if (!form.projectId) {
    return Array.from(new Set(privileged));
  }

  const members = await db
    .select({ userId: project_members.userId })
    .from(project_members)
    .where(eq(project_members.projectId, form.projectId));

  return Array.from(new Set([...privileged, ...members.map((member) => member.userId)]));
}

async function getDocumentationNotificationRecipients(projectId: string | null | undefined) {
  const approvedUsers = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.status, "approved"));

  const privileged = approvedUsers
    .filter((user) => {
      const normalizedRole = String(user.role || "").toLowerCase();
      return normalizedRole.includes("admin") || normalizedRole.includes("core");
    })
    .map((user) => user.id);

  if (!projectId) {
    return Array.from(new Set(privileged));
  }

  const members = await db
    .select({ userId: project_members.userId })
    .from(project_members)
    .where(eq(project_members.projectId, projectId));

  return Array.from(new Set([...privileged, ...members.map((member) => member.userId)]));
}

function getDocumentationNotificationMeta(action: string, actorName: string, entityTitle?: string) {
  const resourceLabel = entityTitle || "documentation item";

  if (action === "uploaded_file") {
    return {
      type: "system" as const,
      title: "File Uploaded",
      message: `${actorName} uploaded ${resourceLabel}.`,
    };
  }

  if (action === "created_folder") {
    return {
      type: "system" as const,
      title: "Folder Created",
      message: `${actorName} created ${resourceLabel}.`,
    };
  }

  if (action === "created_doc" || action === "updated_doc") {
    return {
      type: "system" as const,
      title: action === "created_doc" ? "Doc Created" : "Doc Updated",
      message: `${actorName} ${action === "created_doc" ? "created" : "updated"} ${resourceLabel}.`,
    };
  }

  if (action === "created_form" || action === "updated_form") {
    return {
      type: "form" as const,
      title: action === "created_form" ? "Form Created" : "Form Updated",
      message: `${actorName} ${action === "created_form" ? "created" : "updated"} ${resourceLabel}.`,
    };
  }

  if (action === "deleted_file") {
    return {
      type: "system" as const,
      title: "Documentation Item Deleted",
      message: `${actorName} deleted ${resourceLabel}.`,
    };
  }

  if (action === "renamed_file") {
    return {
      type: "system" as const,
      title: "Documentation Item Renamed",
      message: `${actorName} renamed ${resourceLabel}.`,
    };
  }

  if (action === "updated_resource_permissions") {
    return {
      type: "system" as const,
      title: "Access Updated",
      message: `${actorName} updated access for ${resourceLabel}.`,
    };
  }

  return null;
}

async function createFormSubmissionAnnouncement(form: ProjectFile, submitterName: string) {
  const title = `New Form Submission`;
  const message = `${submitterName} submitted ${form.name}.`;
  await db.insert(announcements).values({
    id: uuidv4(),
    title,
    message,
    targetRoles: [],
    sendEmail: false,
    sendNotification: true,
    createdBy: null,
    createdAt: new Date(),
  });
}

function revalidateDocumentationPaths(projectId?: string | null) {
  revalidatePath("/projects");
  revalidatePath("/documentation");
  revalidatePath("/portal");
  revalidatePath("/admin");
  revalidatePath("/forms");

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
}

async function notifyFormSubmission(
  form: ProjectFile,
  formConfig: FormContent,
  response: FormResponseRecord,
  submitterName: string
) {
  if (!formConfig.settings.notifyOnSubmit) {
    return;
  }

  const recipientIds = await getFormNotificationRecipients(form);
  if (recipientIds.length) {
    await createNotificationsForUsers(
      recipientIds.map((userId) => ({
        userId,
        type: "form",
        title: "New Form Submission",
        message: `${form.name} received a submission from ${submitterName}.`,
        referenceId: form.id,
        link: `/forms/${form.id}?response=${response.id}`,
      }))
    );
  }

  if (formConfig.settings.announcementEnabled) {
    await createFormSubmissionAnnouncement(form, submitterName);
  }

  if (formConfig.settings.emailEnabled) {
    // Email notification logic has been refactored/removed.
  }
}

async function createStructuredItem(
  sessionUserId: string,
  input: StructuredItemInput
): Promise<ProjectFile> {
  const capabilities = await getProjectFilesCapabilities();
  const projectId = input.projectId ?? null;
  const isGlobal = input.isGlobal ?? false;
  await assertDocumentationPermission(projectId, isGlobal, sessionUserId, input.type === "file" ? "upload" : "create");

  if (input.parentId) {
    const parent = await getDocumentationItemOrThrow(input.parentId);
    const mayUseParent = await canUserAccess(sessionUserId, parent, "edit", [parent]);
    if (!mayUseParent) {
      throw new Error("Unauthorized: Documentation access denied");
    }
  }

  if (isGlobal && !capabilities.hasIsGlobal) {
    throw new Error("Documentation Hub migration has not been applied yet.");
  }

  if ((input.type === "doc" || input.type === "form" || input.type === "sheet" || input.content) && !capabilities.hasContent) {
    throw new Error("Documentation Hub migration has not been applied yet.");
  }

  const now = new Date();
  const item: ProjectFile = {
    id: uuidv4(),
    projectId,
    name: input.name,
    type: input.type,
    parentId: input.parentId ?? null,
    fileId: input.fileId ?? null,
    fileSize: input.fileSize ?? null,
    mimeType: input.mimeType ?? null,
    url: input.url ?? null,
    content: input.content ?? null,
    isGlobal,
    uploadedBy: input.uploadedBy || "Unknown",
    createdAt: now,
    updatedAt: now,
  };

  const insertColumns = [
    "id",
    "project_id",
    "name",
    "type",
    "parent_id",
    "file_size",
    "mime_type",
    "url",
    "uploaded_by",
    "createdAt",
    "updatedAt",
  ];
  const insertValues: unknown[] = [
    item.id,
    item.projectId,
    item.name,
    item.type,
    item.parentId,
    item.fileSize,
    item.mimeType,
    item.url,
    item.uploadedBy,
    item.createdAt,
    item.updatedAt,
  ];

  if (capabilities.hasFileId) {
    insertColumns.push(capabilities.fileIdColumn || "file_id");
    insertValues.push(item.fileId);
  }
  if (capabilities.hasContent) {
    insertColumns.push("content");
    insertValues.push(item.content);
  }
  if (capabilities.hasIsGlobal) {
    insertColumns.push(capabilities.isGlobalColumn || "is_global");
    insertValues.push(item.isGlobal);
  }

  await db.execute(sql`
    insert into "project_files" (${sql.join(insertColumns.map((column) => sql.raw(`"${column}"`)), sql`, `)})
    values (${sql.join(insertValues.map((value) => sql`${value}`), sql`, `)})
  `);
  await logDocumentationMutation({
    projectId,
    isGlobal,
    actorName: item.uploadedBy,
    actorUserId: sessionUserId,
    action: input.type === "folder"
      ? "created_folder"
      : input.type === "doc"
        ? "created_doc"
        : input.type === "form"
          ? "created_form"
          : "uploaded_file",
    entityId: item.id,
    entityTitle: item.name,
  });
  revalidateDocumentationPaths(projectId);
  return item;
}

async function getDocumentationItemOrThrow(itemId: string) {
  const capabilities = await getProjectFilesCapabilities();
  const [item] = capabilities.hasFileId || capabilities.hasContent || capabilities.hasIsGlobal
    ? await db
        .select({
          id: project_files.id,
          projectId: project_files.projectId,
          name: project_files.name,
          type: project_files.type,
          parentId: project_files.parentId,
          fileId: capabilities.hasFileId ? fileIdSelectSql(capabilities) : sql`null`,
          fileSize: project_files.fileSize,
          mimeType: project_files.mimeType,
          url: project_files.url,
          content: capabilities.hasContent ? project_files.content : sql`null`,
          isGlobal: capabilities.hasIsGlobal ? isGlobalSelectSql(capabilities) : sql`false`,
          uploadedBy: project_files.uploadedBy,
          createdAt: project_files.createdAt,
          updatedAt: project_files.updatedAt,
        })
        .from(project_files)
        .where(eq(project_files.id, itemId))
        .limit(1)
    : (await db
        .select({
          id: project_files.id,
          projectId: project_files.projectId,
          name: project_files.name,
          type: project_files.type,
          parentId: project_files.parentId,
          fileSize: project_files.fileSize,
          mimeType: project_files.mimeType,
          url: project_files.url,
          uploadedBy: project_files.uploadedBy,
          createdAt: project_files.createdAt,
          updatedAt: project_files.updatedAt,
        })
        .from(project_files)
        .where(eq(project_files.id, itemId))
        .limit(1))
        .map(mapLegacyProjectFile);
  if (!item) {
    throw new Error("Documentation item not found.");
  }
  return item as unknown as ProjectFile;
}

async function assertResourceAccess(userId: string | null | undefined, item: ProjectFile, action: ResourceAction) {
  const scopedItems = item.isGlobal
    ? await getGlobalDocumentationItemsAction()
    : item.projectId
      ? await getProjectFilesAction(item.projectId)
      : [item];
  const allowed = await canUserAccess(userId, item, action, [...scopedItems, item]);
  if (!allowed) {
    throw new Error("Unauthorized: Documentation access denied");
  }
}

async function resolveLinkedFiles(items: ProjectFile[]) {
  const resolved = new Map<string, { id: string; filePath: string; fileUrl: string | null }>();

  for (const item of items) {
    if (item.type !== "file") continue;

    let linkedFile = null as { id: string; filePath: string; fileUrl: string | null } | null;
    if (item.fileId) {
      const [row] = await db
        .select({ id: files.id, filePath: files.filePath, fileUrl: files.fileUrl })
        .from(files)
        .where(eq(files.id, item.fileId))
        .limit(1);
      linkedFile = row || null;
    } else if (item.url) {
      const [row] = await db
        .select({ id: files.id, filePath: files.filePath, fileUrl: files.fileUrl })
        .from(files)
        .where(eq(files.fileUrl, item.url))
        .limit(1);
      linkedFile = row || null;
    }

    if (linkedFile) {
      resolved.set(linkedFile.id, linkedFile);
    }
  }

  return [...resolved.values()];
}

async function deleteR2Objects(fileRows: Array<{ filePath: string }>) {
  const bucket = process.env.R2_BUCKET_NAME || "";
  for (const row of fileRows) {
    try {
      await r2.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: row.filePath,
      }));
    } catch (error) {
      console.error("[documentation] failed to delete R2 object:", row.filePath, error);
    }
  }
}

function collectDescendantIds(rootId: string, allItems: ProjectFile[]) {
  const byParent = new Map<string | null, ProjectFile[]>();
  for (const item of allItems) {
    const parentKey = item.parentId ?? null;
    const group = byParent.get(parentKey) || [];
    group.push(item);
    byParent.set(parentKey, group);
  }

  const ids = new Set<string>();
  const walk = (id: string) => {
    ids.add(id);
    const children = byParent.get(id) || [];
    for (const child of children) {
      walk(child.id);
    }
  };

  walk(rootId);
  return [...ids];
}

async function decorateAndFilterVisibleItems(
  items: ProjectFile[],
  userId: string | null | undefined
) {
  const permissions = await getResourcePermissionEntries(items.map((item) => item.id));
  const visible: ProjectFile[] = [];

  for (const item of items) {
    if (await canUserAccess(userId, item, "view", items, permissions)) {
      const summary = summarizeResourceAccess(await resolveResourcePermissionConfig(item, items, permissions));
      visible.push({
        ...item,
        hasCustomAccess: summary.hasCustomAccess,
        accessState: summary.accessState,
        visibleTo: summary.visibleTo,
        editableBy: summary.editableBy,
      });
    }
  }

  return visible;
}

export async function getProjectFilesAction(projectId: string): Promise<ProjectFile[]> {
  const session = await getCurrentSession();
  await assertDocumentationPermission(projectId, false, session?.user?.id, "view");
  const capabilities = await getProjectFilesCapabilities();

  const rows = capabilities.hasIsGlobal
    ? await db
        .select({
          id: project_files.id,
          projectId: project_files.projectId,
          name: project_files.name,
          type: project_files.type,
          parentId: project_files.parentId,
          fileId: capabilities.hasFileId ? fileIdSelectSql(capabilities) : sql`null`,
          fileSize: project_files.fileSize,
          mimeType: project_files.mimeType,
          url: project_files.url,
          content: capabilities.hasContent ? project_files.content : sql`null`,
          isGlobal: isGlobalSelectSql(capabilities),
          uploadedBy: project_files.uploadedBy,
          createdAt: project_files.createdAt,
          updatedAt: project_files.updatedAt,
        })
        .from(project_files)
        .where(
          capabilities.isGlobalColumn
            ? sql`"project_files"."project_id" = ${projectId} and ${isGlobalSelectSql(capabilities)} = false`
            : eq(project_files.projectId, projectId)
        )
    : await db
        .select({
          id: project_files.id,
          projectId: project_files.projectId,
          name: project_files.name,
          type: project_files.type,
          parentId: project_files.parentId,
          fileSize: project_files.fileSize,
          mimeType: project_files.mimeType,
          url: project_files.url,
          uploadedBy: project_files.uploadedBy,
          createdAt: project_files.createdAt,
          updatedAt: project_files.updatedAt,
        })
        .from(project_files)
        .where(eq(project_files.projectId, projectId))
        .then((legacyRows) => legacyRows.map(mapLegacyProjectFile));

  return sortStructuredItems(await decorateAndFilterVisibleItems(rows as unknown as ProjectFile[], session?.user?.id));
}

export async function getGlobalDocumentationItemsAction(): Promise<ProjectFile[]> {
  const session = await getCurrentSession();
  await assertDocumentationPermission(null, true, session?.user?.id, "view");
  const capabilities = await getProjectFilesCapabilities();

  if (!capabilities.hasIsGlobal) {
    return [];
  }

  const rows = await db
    .select({
      id: project_files.id,
      projectId: project_files.projectId,
      name: project_files.name,
      type: project_files.type,
      parentId: project_files.parentId,
      fileId: capabilities.hasFileId ? fileIdSelectSql(capabilities) : sql`null`,
      fileSize: project_files.fileSize,
      mimeType: project_files.mimeType,
      url: project_files.url,
      content: capabilities.hasContent ? project_files.content : sql`null`,
      isGlobal: isGlobalSelectSql(capabilities),
      uploadedBy: project_files.uploadedBy,
      createdAt: project_files.createdAt,
      updatedAt: project_files.updatedAt,
    })
    .from(project_files)
    .where(sql`${isGlobalSelectSql(capabilities)} = true and "project_files"."project_id" is null`);

  return sortStructuredItems(await decorateAndFilterVisibleItems(rows as unknown as ProjectFile[], session?.user?.id));
}

export async function searchResourcesAction(
  query: string,
  filters: DocumentationSearchFilters = {}
): Promise<ProjectFile[]> {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  const capabilities = await getProjectFilesCapabilities();
  const trimmedQuery = query.trim();
  const scopedProjectId = filters.projectId?.trim() && filters.projectId !== "__global__"
    ? filters.projectId.trim()
    : null;

  if (scopedProjectId) {
    await assertDocumentationPermission(scopedProjectId, false, userId, "view");
  } else {
    await assertGlobalDocumentationPermission(userId, "view");
  }

  const conditions = [];

  if (trimmedQuery) {
    const pattern = `%${trimmedQuery}%`;
    conditions.push(
      or(
        ilike(project_files.name, pattern),
        ilike(project_files.type, pattern),
        ilike(project_files.uploadedBy, pattern),
        ilike(sql`coalesce("project_files"."project_id", '')`, pattern)
      )
    );
  }

  if (filters.type && filters.type !== "all") {
    conditions.push(eq(project_files.type, filters.type));
  }

  if (filters.projectId?.trim()) {
    if (filters.projectId === "__global__") {
      conditions.push(isNull(project_files.projectId));
      if (capabilities.hasIsGlobal) {
        conditions.push(sql`${isGlobalSelectSql(capabilities)} = true`);
      }
    } else {
      conditions.push(eq(project_files.projectId, filters.projectId.trim()));
    }
  }

  const fromDate = normalizeFilterDateStart(filters.fromDate);
  if (fromDate) {
    conditions.push(gte(project_files.createdAt, fromDate));
  }

  const toDate = normalizeFilterDateEnd(filters.toDate);
  if (toDate) {
    conditions.push(lte(project_files.createdAt, toDate));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const rows = capabilities.hasFileId || capabilities.hasContent || capabilities.hasIsGlobal
    ? await db
        .select({
          id: project_files.id,
          projectId: project_files.projectId,
          projectTitle: projects.title,
          name: project_files.name,
          type: project_files.type,
          parentId: project_files.parentId,
          fileId: capabilities.hasFileId ? fileIdSelectSql(capabilities) : sql`null`,
          fileSize: project_files.fileSize,
          mimeType: project_files.mimeType,
          url: project_files.url,
          content: capabilities.hasContent ? project_files.content : sql`null`,
          isGlobal: capabilities.hasIsGlobal ? isGlobalSelectSql(capabilities) : sql`false`,
          uploadedBy: project_files.uploadedBy,
          createdAt: project_files.createdAt,
          updatedAt: project_files.updatedAt,
        })
        .from(project_files)
        .leftJoin(projects, eq(project_files.projectId, projects.id))
        .where(whereClause)
    : await db
        .select({
          id: project_files.id,
          projectId: project_files.projectId,
          projectTitle: projects.title,
          name: project_files.name,
          type: project_files.type,
          parentId: project_files.parentId,
          fileSize: project_files.fileSize,
          mimeType: project_files.mimeType,
          url: project_files.url,
          uploadedBy: project_files.uploadedBy,
          createdAt: project_files.createdAt,
          updatedAt: project_files.updatedAt,
        })
        .from(project_files)
        .leftJoin(projects, eq(project_files.projectId, projects.id))
        .where(whereClause)
        .then((legacyRows) =>
          legacyRows.map((row) => ({
            ...mapLegacyProjectFile(row as any),
            projectTitle: row.projectTitle || null,
          }))
        );

  const visibleRows = await decorateAndFilterVisibleItems(rows as unknown as ProjectFile[], userId);
  return sortStructuredItems(visibleRows);
}

export async function getDocumentationManagerItemsAction(): Promise<DocumentationManagerItem[]> {
  const session = await getCurrentSession();
  await assertGlobalDocumentationPermission(session?.user?.id, "edit");
  const capabilities = await getProjectFilesCapabilities();

  const rows = capabilities.hasFileId || capabilities.hasContent || capabilities.hasIsGlobal
    ? await db
        .select({
          id: project_files.id,
          projectId: project_files.projectId,
          name: project_files.name,
          type: project_files.type,
          parentId: project_files.parentId,
          fileId: capabilities.hasFileId ? fileIdSelectSql(capabilities) : sql`null`,
          fileSize: project_files.fileSize,
          mimeType: project_files.mimeType,
          url: project_files.url,
          content: capabilities.hasContent ? project_files.content : sql`null`,
          isGlobal: capabilities.hasIsGlobal ? isGlobalSelectSql(capabilities) : sql`false`,
          uploadedBy: project_files.uploadedBy,
          createdAt: project_files.createdAt,
          updatedAt: project_files.updatedAt,
          projectTitle: projects.title,
        })
        .from(project_files)
        .leftJoin(projects, eq(project_files.projectId, projects.id))
    : await db
        .select({
          id: project_files.id,
          projectId: project_files.projectId,
          name: project_files.name,
          type: project_files.type,
          parentId: project_files.parentId,
          fileSize: project_files.fileSize,
          mimeType: project_files.mimeType,
          url: project_files.url,
          uploadedBy: project_files.uploadedBy,
          createdAt: project_files.createdAt,
          updatedAt: project_files.updatedAt,
          projectTitle: projects.title,
        })
        .from(project_files)
        .leftJoin(projects, eq(project_files.projectId, projects.id))
        .then((legacyRows) =>
          legacyRows.map((row) => ({
            ...mapLegacyProjectFile(row as any),
            projectTitle: row.projectTitle || null,
          }))
        );

  const baseRows = rows as unknown as ProjectFile[];
  const permissions = await getResourcePermissionEntries(baseRows.map((item) => item.id));

  return sortStructuredItems(baseRows).map((row) => {
    const match = rows.find((candidate) => candidate.id === row.id);
    const summary = permissions.length
      ? summarizeResourceAccess({
          roles: permissions
            .filter((entry) => entry.resourceId === row.id)
            .map((entry) => ({ role: entry.role, canView: entry.canView, canEdit: entry.canEdit })),
          inheritedFromId: null,
        })
      : { hasCustomAccess: false, accessState: "inherited" as const, visibleTo: [] as string[], editableBy: [] as string[] };
    return {
      ...row,
      projectTitle: match?.projectTitle || null,
      hasCustomAccess: summary.hasCustomAccess,
      accessState: summary.accessState,
      visibleTo: summary.visibleTo,
      editableBy: summary.editableBy,
    };
  });
}

export async function getResourcePermissionsAction(resourceId: string): Promise<ResourceAccessConfig> {
  const session = await getCurrentSession();
  const item = await getDocumentationItemOrThrow(resourceId);
  await assertResourceAccess(session?.user?.id, item, "edit");

  const capabilities = await getProjectFilesCapabilities();
  if (!capabilities.hasResourcePermissions) {
    return { roles: [], inheritedFromId: null };
  }

  const scopedItems = item.isGlobal
    ? await getGlobalDocumentationItemsAction()
    : item.projectId
      ? await getProjectFilesAction(item.projectId)
      : [item];
  const items = [...scopedItems, item];
  const permissions = await getResourcePermissionEntries(items.map((entry) => entry.id));
  return resolveResourcePermissionConfig(item, items, permissions);
}

export async function updateResourcePermissionsAction(
  resourceId: string,
  entries: Array<{ role: ResourceRole; canView: boolean; canEdit: boolean }>
) {
  const session = await getCurrentSession();
  const item = await getDocumentationItemOrThrow(resourceId);
  await assertResourceAccess(session?.user?.id, item, "edit");

  const capabilities = await getProjectFilesCapabilities();
  if (!capabilities.hasResourcePermissions) {
    throw new Error("Permission upgrade migration has not been applied yet.");
  }

  await db.delete(resource_permissions).where(eq(resource_permissions.resourceId, resourceId));

  const validEntries = entries.filter((entry) => entry.canView || entry.canEdit);
  if (validEntries.length > 0) {
    await db.insert(resource_permissions).values(
      validEntries.map((entry) => ({
        id: uuidv4(),
        resourceId,
        resourceType: item.type,
        role: entry.role,
        canView: entry.canView,
        canEdit: entry.canEdit,
        createdAt: new Date(),
      }))
    );
  }

  await logDocumentationMutation({
    projectId: item.projectId,
    isGlobal: item.isGlobal,
    actorName: session?.user?.name || "Unknown",
    actorUserId: session?.user?.id || null,
    action: "updated_resource_permissions",
    entityId: resourceId,
    entityTitle: item.name,
  });
  revalidateDocumentationPaths(item.projectId);
}

export async function createProjectFolderAction(
  projectId: string,
  name: string,
  parentId: string | null,
  uploadedBy: string = "Unknown"
): Promise<ProjectFile> {
  const session = await getCurrentSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return createStructuredItem(session.user.id, {
    projectId,
    name,
    type: "folder",
    parentId,
    uploadedBy,
  });
}

export async function createDocumentationFolderAction(
  projectId: string | null,
  name: string,
  parentId: string | null,
  options?: { isGlobal?: boolean; uploadedBy?: string }
): Promise<ProjectFile> {
  const session = await getCurrentSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return createStructuredItem(session.user.id, {
    projectId,
    name,
    type: "folder",
    parentId,
    isGlobal: options?.isGlobal ?? false,
    uploadedBy: options?.uploadedBy || session.user.name || "Unknown",
  });
}

export async function uploadProjectFileAction(
  projectId: string,
  data: {
    name: string;
    parentId: string | null;
    fileSize: string;
    mimeType: string;
    uploadedBy: string;
    url?: string;
    fileId?: string | null;
  }
): Promise<ProjectFile> {
  const session = await getCurrentSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!data.url) {
    throw new Error("A valid file URL is required for project uploads.");
  }

  return createStructuredItem(session.user.id, {
    projectId,
    name: data.name,
    type: "file",
    parentId: data.parentId,
    fileId: data.fileId ?? null,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    url: data.url,
    uploadedBy: data.uploadedBy || "Unknown",
  });
}

export async function uploadDocumentationFileEntryAction(data: {
  projectId?: string | null;
  parentId: string | null;
  name: string;
  fileSize: string;
  mimeType: string;
  uploadedBy: string;
  url: string;
  fileId: string;
  isGlobal?: boolean;
}): Promise<ProjectFile> {
  const session = await getCurrentSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return createStructuredItem(session.user.id, {
    projectId: data.projectId ?? null,
    name: data.name,
    type: "file",
    parentId: data.parentId,
    fileId: data.fileId,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    url: data.url,
    isGlobal: data.isGlobal ?? false,
    uploadedBy: data.uploadedBy,
  });
}

export async function createDocAction(
  projectId: string | null,
  parentId: string | null,
  title: string,
  options?: { isGlobal?: boolean; uploadedBy?: string }
): Promise<ProjectFile> {
  const session = await getCurrentSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = title.trim();
  if (!name) throw new Error("Doc title is required.");

  return createStructuredItem(session.user.id, {
    projectId,
    name,
    type: "doc",
    parentId,
    content: {
      title: name,
      body: "",
      blocks: [],
      updatedAt: new Date().toISOString(),
    },
    isGlobal: options?.isGlobal ?? false,
    uploadedBy: options?.uploadedBy || session.user.name || "Unknown",
  });
}

export async function getDocContentAction(itemId: string) {
  const capabilities = await getProjectFilesCapabilities();
  const session = await getCurrentSession();
  const item = await getDocumentationItemOrThrow(itemId);
  await assertResourceAccess(session?.user?.id, item, "view");

  if (!capabilities.hasContent) {
    throw new Error("Documentation Hub migration has not been applied yet.");
  }
  if (item.type !== "doc") {
    throw new Error("Requested item is not a doc.");
  }

  return item.content || {};
}

export async function updateDocContentAction(itemId: string, content: Record<string, unknown>) {
  const capabilities = await getProjectFilesCapabilities();
  const session = await getCurrentSession();
  const item = await getDocumentationItemOrThrow(itemId);
  await assertResourceAccess(session?.user?.id, item, "edit");

  if (!capabilities.hasContent) {
    throw new Error("Documentation Hub migration has not been applied yet.");
  }
  if (item.type !== "doc") {
    throw new Error("Requested item is not a doc.");
  }

  await db.update(project_files)
    .set({
      content: {
        ...(content || {}),
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(project_files.id, itemId));

  await logDocumentationMutation({
    projectId: item.projectId,
    isGlobal: item.isGlobal,
    actorName: session?.user?.name || "Unknown",
    actorUserId: session?.user?.id || null,
    action: "updated_doc",
    entityId: itemId,
    entityTitle: item.name,
  });
  revalidateDocumentationPaths(item.projectId);
}

export async function createFormAction(
  projectId: string | null,
  parentId: string | null,
  title: string,
  options?: { isGlobal?: boolean; uploadedBy?: string }
): Promise<ProjectFile> {
  const session = await getCurrentSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = title.trim();
  if (!name) throw new Error("Form title is required.");

  return createStructuredItem(session.user.id, {
    projectId,
    name,
    type: "form",
    parentId,
    content: serializeFormContent({
      title: name,
      description: "",
      mode: "internal",
      status: "draft",
      fields: [] as FormQuestion[],
      settings: {
        allowMultiple: false,
        requireLogin: false,
        collectEmail: true,
        paymentEnabled: false,
        amount: 0,
        deadline: null,
        notifyOnSubmit: true,
        announcementEnabled: false,
        emailEnabled: false,
      },
    }, name),
    isGlobal: options?.isGlobal ?? false,
    uploadedBy: options?.uploadedBy || session.user.name || "Unknown",
  });
}

export async function getFormContentAction(itemId: string) {
  const capabilities = await getProjectFilesCapabilities();
  const session = await getCurrentSession();
  const item = await getDocumentationItemOrThrow(itemId);
  await assertResourceAccess(session?.user?.id, item, "view");

  if (!capabilities.hasContent) {
    throw new Error("Documentation Hub migration has not been applied yet.");
  }
  if (item.type !== "form") {
    throw new Error("Requested item is not a form.");
  }

  return normalizeFormContent(item.content, item.name);
}

export async function updateFormContentAction(itemId: string, content: Record<string, unknown>) {
  const capabilities = await getProjectFilesCapabilities();
  const session = await getCurrentSession();
  const item = await getDocumentationItemOrThrow(itemId);
  await assertResourceAccess(session?.user?.id, item, "edit");

  if (!capabilities.hasContent) {
    throw new Error("Documentation Hub migration has not been applied yet.");
  }
  if (item.type !== "form") {
    throw new Error("Requested item is not a form.");
  }

  await db.update(project_files)
    .set({
      content: serializeFormContent(content, item.name),
      updatedAt: new Date(),
    })
    .where(eq(project_files.id, itemId));

  await logDocumentationMutation({
    projectId: item.projectId,
    isGlobal: item.isGlobal,
    actorName: session?.user?.name || "Unknown",
    actorUserId: session?.user?.id || null,
    action: "updated_form",
    entityId: itemId,
    entityTitle: item.name,
  });
  revalidateDocumentationPaths(item.projectId);
}

async function getExistingFormResponses(formId: string) {
  return db.select().from(form_responses).where(eq(form_responses.formId, formId));
}

export async function getPublicFormAction(formId: string) {
  const capabilities = await getProjectFilesCapabilities();
  const form = await getDocumentationItemOrThrow(formId);

  if (form.type !== "form") {
    throw new Error("Requested item is not a form.");
  }
  if (!capabilities.hasFormResponses) {
    throw new Error("Documentation Hub migration has not been applied yet.");
  }

  const config = normalizeFormContent(form.content, form.name);
  if (config.status !== "published") {
    throw new Error("This form is not published yet.");
  }
  return {
    id: form.id,
    title: form.name,
    projectId: form.projectId,
    isGlobal: form.isGlobal,
    config,
  };
}

export async function submitFormResponseAction(
  formId: string,
  payload: {
    answers: Record<string, unknown>;
    externalDetails?: FormExternalDetails;
  }
) {
  const capabilities = await getProjectFilesCapabilities();
  const session = await getCurrentSession();
  const form = await getDocumentationItemOrThrow(formId);

  if (form.type !== "form") {
    throw new Error("Requested item is not a form.");
  }
  if (!capabilities.hasFormResponses) {
    throw new Error("Documentation Hub migration has not been applied yet.");
  }

  const config = normalizeFormContent(form.content, form.name);
  if (config.status !== "published") {
    throw new Error("This form is not accepting responses yet.");
  }
  if (isFormClosed(config.settings.deadline)) {
    throw new Error("This form is no longer accepting responses");
  }
  const externalDetails = payload.externalDetails || {};
  const answers = payload.answers || {};
  const isLoggedIn = Boolean(session?.user?.id);

  if (config.mode === "internal" && !isLoggedIn) {
    throw new Error("Please sign in to submit this form.");
  }
  if (config.settings.requireLogin && !isLoggedIn) {
    throw new Error("Please sign in to submit this form.");
  }
  if (config.mode === "external") {
    if (!externalDetails.name?.trim() || !externalDetails.email?.trim()) {
      throw new Error("Name and email are required for external submissions.");
    }
  }
  if (config.mode === "hybrid" && !isLoggedIn) {
    if (!externalDetails.name?.trim() || !externalDetails.email?.trim()) {
      throw new Error("Name and email are required for guest submissions.");
    }
  }

  for (const field of config.fields) {
    const value = answers[field.id];
    if (!field.required) continue;
    if (field.type === "checkbox") {
      if (value !== true) {
        throw new Error(`"${field.label}" is required.`);
      }
      continue;
    }
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`"${field.label}" is required.`);
    }
  }

  const existingResponses = await getExistingFormResponses(formId);
  if (!config.settings.allowMultiple) {
    const duplicate = existingResponses.find((response) => {
      if (session?.user?.id && response.userId === session.user.id) {
        return true;
      }
      const savedExternal = (response.externalDetails || {}) as Record<string, unknown>;
      const savedEmail = typeof savedExternal.email === "string" ? savedExternal.email.toLowerCase() : "";
      const currentEmail = externalDetails.email?.toLowerCase() || session?.user?.email?.toLowerCase() || "";
      return Boolean(currentEmail) && savedEmail === currentEmail;
    });
    if (duplicate) {
      throw new Error("Multiple submissions are disabled for this form.");
    }
  }

  const responseId = uuidv4();
  const responseRecord: FormResponseRecord = {
    id: responseId,
    formId,
    userId: session?.user?.id || null,
    isExternal: !isLoggedIn,
    externalDetails: isLoggedIn
      ? {
          name: session?.user?.name || undefined,
          email: config.settings.collectEmail ? session?.user?.email || undefined : undefined,
          phone: undefined,
        }
      : externalDetails,
    answers,
    paymentStatus: config.settings.paymentEnabled ? "pending" : "success",
    paymentId: null,
    createdAt: new Date(),
  };

  await db.insert(form_responses).values({
    id: responseRecord.id,
    formId: responseRecord.formId,
    userId: responseRecord.userId,
    isExternal: responseRecord.isExternal,
    externalDetails: responseRecord.externalDetails,
    answers: responseRecord.answers,
    responses: responseRecord.answers,
    paymentStatus: responseRecord.paymentStatus,
    paymentId: responseRecord.paymentId,
    createdAt: responseRecord.createdAt,
  });

  const submitterName = getSubmitterLabel(session, responseRecord.externalDetails);

  await logDocumentationMutation({
    projectId: form.projectId,
    isGlobal: form.isGlobal,
    actorName: submitterName,
    actorUserId: session?.user?.id || null,
    action: "submitted_form_response",
    entityId: responseId,
    entityTitle: form.name,
  });
  await notifyFormSubmission(form, config, responseRecord, submitterName);
  revalidateDocumentationPaths(form.projectId);
  revalidatePath(`/forms/${form.id}`);
  return {
    id: responseId,
    responseId,
    paymentStatus: responseRecord.paymentStatus,
    requiresPayment: config.settings.paymentEnabled,
    amount: config.settings.amount,
  };
}

export async function getFormResponsesAction(formId: string) {
  const capabilities = await getProjectFilesCapabilities();
  const session = await getCurrentSession();
  const form = await getDocumentationItemOrThrow(formId);
  await assertResourceAccess(session?.user?.id, form, "edit");
  if (!capabilities.hasFormResponses) {
    return [];
  }

  const rows = await db
    .select()
    .from(form_responses)
    .where(eq(form_responses.formId, formId));
  const config = normalizeFormContent(form.content, form.name);
  return rows.map((row) => {
    const externalDetails = (row.externalDetails || {}) as FormExternalDetails;
    const answers = ((row.answers as Record<string, unknown> | null) || (row.responses as Record<string, unknown> | null) || {});
    const submitterName = externalDetails.name || (row.userId ? "Internal user" : "External user");
    const submitterEmail = externalDetails.email || "";
    return {
      id: row.id,
      formId: row.formId,
      userId: row.userId,
      isExternal: row.isExternal,
      externalDetails,
      answers,
      answerViews: buildAnswerViews(config, answers),
      submitterName,
      submitterEmail,
      paymentStatus: (row.paymentStatus as "pending" | "success" | "failed") || "success",
      paymentId: row.paymentId,
      createdAt: row.createdAt,
    } satisfies FormResponseView;
  });
}

export async function getFormAnalyticsAction(formId: string): Promise<FormAnalytics> {
  const capabilities = await getProjectFilesCapabilities();
  const session = await getCurrentSession();
  const form = await getDocumentationItemOrThrow(formId);
  await assertDocumentationPermission(form.projectId, form.isGlobal, session?.user?.id, "edit");
  if (!capabilities.hasFormResponses) {
    return {
      totalResponses: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      internalResponses: 0,
      externalResponses: 0,
      questions: [],
    };
  }

  const rows = await db
    .select()
    .from(form_responses)
    .where(eq(form_responses.formId, formId));

  const responses: FormResponseRecord[] = rows.map((row) => ({
    id: row.id,
    formId: row.formId,
    userId: row.userId,
    isExternal: row.isExternal,
    externalDetails: (row.externalDetails || {}) as FormExternalDetails,
    answers: ((row.answers as Record<string, unknown> | null) || (row.responses as Record<string, unknown> | null) || {}),
    paymentStatus: (row.paymentStatus as "pending" | "success" | "failed") || "success",
    paymentId: row.paymentId,
    createdAt: row.createdAt,
  }));

  return buildFormAnalytics(normalizeFormContent(form.content, form.name), responses);
}

export async function getAdminFormListAction(): Promise<AdminFormListItem[]> {
  const session = await getCurrentSession();
  await assertGlobalDocumentationPermission(session?.user?.id, "view");

  const items = await getDocumentationManagerItemsAction();
  const forms = items.filter((item) => item.type === "form");

  const counts = new Map<string, number>();
  if ((await getProjectFilesCapabilities()).hasFormResponses) {
    const rows = await db
      .select({ formId: form_responses.formId })
      .from(form_responses);
    for (const row of rows) {
      counts.set(row.formId, (counts.get(row.formId) || 0) + 1);
    }
  }

  return forms.map((form) => ({
    id: form.id,
    title: form.name,
    status: normalizeFormStatus(form.content?.status),
    submissionCount: counts.get(form.id) || 0,
    createdAt: form.createdAt,
  }));
}

export async function getDocumentationItemAction(itemId: string): Promise<ProjectFile> {
  const session = await getCurrentSession();
  const item = await getDocumentationItemOrThrow(itemId);
  await assertResourceAccess(session?.user?.id, item, "view");
  return item;
}

export async function deleteDocumentationItemAction(itemId: string): Promise<void> {
  const capabilities = await getProjectFilesCapabilities();
  const session = await getCurrentSession();
  const item = await getDocumentationItemOrThrow(itemId);
  await assertResourceAccess(session?.user?.id, item, "edit");

  const scopedRows = capabilities.hasIsGlobal
    ? await db
        .select({
          id: project_files.id,
          projectId: project_files.projectId,
          name: project_files.name,
          type: project_files.type,
          parentId: project_files.parentId,
          fileId: capabilities.hasFileId ? fileIdSelectSql(capabilities) : sql`null`,
          fileSize: project_files.fileSize,
          mimeType: project_files.mimeType,
          url: project_files.url,
          content: capabilities.hasContent ? project_files.content : sql`null`,
          isGlobal: isGlobalSelectSql(capabilities),
          uploadedBy: project_files.uploadedBy,
          createdAt: project_files.createdAt,
          updatedAt: project_files.updatedAt,
        })
        .from(project_files)
        .where(
          item.isGlobal
            ? sql`${isGlobalSelectSql(capabilities)} = true and "project_files"."project_id" is null`
            : item.projectId
              ? eq(project_files.projectId, item.projectId)
              : isNull(project_files.projectId)
        )
    : await db
        .select({
          id: project_files.id,
          projectId: project_files.projectId,
          name: project_files.name,
          type: project_files.type,
          parentId: project_files.parentId,
          fileSize: project_files.fileSize,
          mimeType: project_files.mimeType,
          url: project_files.url,
          uploadedBy: project_files.uploadedBy,
          createdAt: project_files.createdAt,
          updatedAt: project_files.updatedAt,
        })
        .from(project_files)
        .where(item.projectId ? eq(project_files.projectId, item.projectId) : isNull(project_files.projectId))
        .then((legacyRows) => legacyRows.map(mapLegacyProjectFile));

  const scopedItems = scopedRows as unknown as ProjectFile[];
  const idsToDelete = collectDescendantIds(itemId, scopedItems);
  const itemsToDelete = scopedItems.filter((entry) => idsToDelete.includes(entry.id));
  const linkedFiles = await resolveLinkedFiles(itemsToDelete);

  await db.delete(project_files).where(inArray(project_files.id, idsToDelete));

  if (linkedFiles.length > 0) {
    await deleteR2Objects(linkedFiles);
    await db.delete(files).where(inArray(files.id, linkedFiles.map((row) => row.id)));
  }

  await logDocumentationMutation({
    projectId: item.projectId,
    isGlobal: item.isGlobal,
    actorName: session?.user?.name || "System",
    actorUserId: session?.user?.id || null,
    action: "deleted_file",
    entityId: itemId,
    entityTitle: item.name,
  });
  revalidateDocumentationPaths(item.projectId);
}

export async function deleteProjectFileAction(fileId: string): Promise<void> {
  await deleteDocumentationItemAction(fileId);
}

export async function renameDocumentationItemAction(
  itemId: string,
  name: string,
  actorName: string = "Unknown"
): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("File name cannot be empty.");
  }

  const session = await getCurrentSession();
  const item = await getDocumentationItemOrThrow(itemId);
  await assertResourceAccess(session?.user?.id, item, "edit");

  await db
    .update(project_files)
    .set({
      name: trimmedName,
      updatedAt: new Date(),
    })
    .where(eq(project_files.id, itemId));

  await logDocumentationMutation({
    projectId: item.projectId,
    isGlobal: item.isGlobal,
    actorName,
    actorUserId: session?.user?.id || null,
    action: "renamed_file",
    entityId: itemId,
    entityTitle: `${item.name} -> ${trimmedName}`,
  });
  revalidateDocumentationPaths(item.projectId);
}

export async function renameProjectFileAction(
  fileId: string,
  name: string,
  actorName: string = "Unknown"
): Promise<void> {
  await renameDocumentationItemAction(fileId, name, actorName);
}
