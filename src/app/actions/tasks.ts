"use server";

import { db } from "@/db";
import { project_tasks, project_task_assignments, project_task_comments, project_task_attachments, projects, users } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { logActivityAction } from "./activity";
import { addTimelineEntryAction } from "./timeline";

export type TaskStatus = "todo" | "inProgress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskComment {
  id: string;
  author: string;
  authorId?: string;
  text: string;
  time: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
}

export interface TaskAssignee {
  name: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: TaskAssignee[];
  deadline: string | null;
  attachments: TaskAttachment[];
  comments: TaskComment[];
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Progress Sync ──────────────────────────────────────────────────────────────
// Recalculates and persists project completion % from task counts.
async function syncProjectProgress(projectId: string): Promise<void> {
  try {
    const allTasks = await db.select({ id: project_tasks.id, status: project_tasks.status })
      .from(project_tasks)
      .where(eq(project_tasks.projectId, projectId));

    const total = allTasks.length;
    const done = allTasks.filter(t => t.status === "done").length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    await db.update(projects)
      .set({ progress, updatedAt: new Date() } as any)
      .where(eq(projects.id, projectId));
  } catch (err) {
    console.error("[syncProjectProgress] Failed:", err);
  }
}

// ── CRUD Actions ───────────────────────────────────────────────────────────────

export async function getProjectTasksAction(projectId: string): Promise<ProjectTask[]> {
  try {
    const rawTasks = await db.select().from(project_tasks).where(eq(project_tasks.projectId, projectId));
    const taskIds = rawTasks.map(t => t.id);

    if (taskIds.length === 0) return [];

    const assignments = await db
      .select({ taskId: project_task_assignments.taskId, userName: users.name })
      .from(project_task_assignments)
      .leftJoin(users, eq(users.id, project_task_assignments.userId))
      .where(inArray(project_task_assignments.taskId, taskIds));

    const comments = await db
      .select()
      .from(project_task_comments)
      .where(inArray(project_task_comments.taskId, taskIds));

    const attachments = await db
      .select()
      .from(project_task_attachments)
      .where(inArray(project_task_attachments.taskId, taskIds));

    return rawTasks.map(task => ({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      isBlocked: task.isBlocked,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignees: assignments.filter(a => a.taskId === task.id).map(a => ({ name: a.userName || "Unknown" })),
      comments: comments.filter(c => c.taskId === task.id).map(c => ({ id: c.id, author: c.authorName, text: c.text, time: c.createdAt.toISOString() })),
      attachments: attachments.filter(att => att.taskId === task.id).map(att => ({ name: att.fileId, url: "" })),
    }));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function addProjectTaskAction(
  projectId: string,
  data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignees?: TaskAssignee[];
    deadline?: string;
    actorName?: string;
  }
): Promise<ProjectTask> {
  const taskId = uuidv4();
  const now = new Date();
  const payload = {
    id: taskId,
    projectId,
    title: data.title,
    description: data.description ?? null,
    status: data.status,
    priority: data.priority,
    deadline: data.deadline ?? null,
    isBlocked: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(project_tasks).values(payload);

  // Map assignee names → user IDs
  if (data.assignees && data.assignees.length > 0) {
    const allUsers = await db.select().from(users);
    for (const assignee of data.assignees) {
      const match = allUsers.find(u => u.name === assignee.name);
      if (match) {
        await db.insert(project_task_assignments).values({
          id: uuidv4(),
          taskId,
          userId: match.id,
          assignedAt: new Date()
        });
      }
    }
  }

  // Sync progress + log activity
  await syncProjectProgress(projectId);
  await logActivityAction(projectId, data.actorName || "Unknown", "created_task", "task", taskId, data.title);

  revalidatePath(`/projects`);
  revalidatePath(`/projects/${projectId}`);
  return {
    id: payload.id,
    projectId: payload.projectId,
    title: payload.title,
    description: payload.description,
    status: payload.status,
    priority: payload.priority,
    deadline: payload.deadline,
    isBlocked: payload.isBlocked,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    assignees: data.assignees || [],
    attachments: [],
    comments: [],
  };
}

export async function updateProjectTaskAction(
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignees: TaskAssignee[];
    deadline: string;
    isBlocked: boolean;
    actorName: string;
  }>
): Promise<void> {
  const { title, description, status, priority, deadline, isBlocked, assignees, actorName } = data;

  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updateFields.title = title;
  if (description !== undefined) updateFields.description = description;
  if (status !== undefined) updateFields.status = status;
  if (priority !== undefined) updateFields.priority = priority;
  if (deadline !== undefined) updateFields.deadline = deadline;
  if (isBlocked !== undefined) updateFields.isBlocked = isBlocked;

  await db
    .update(project_tasks)
    .set(updateFields as any)
    .where(eq(project_tasks.id, taskId));

  // Handle re-assignments
  if (assignees) {
    await db.delete(project_task_assignments).where(eq(project_task_assignments.taskId, taskId));
    const allUsers = await db.select().from(users);
    for (const assignee of assignees) {
      const match = allUsers.find(u => u.name === assignee.name);
      if (match) {
        await db.insert(project_task_assignments).values({
          id: uuidv4(),
          taskId,
          userId: match.id,
          assignedAt: new Date()
        });
      }
    }
  }

  // Get projectId for progress sync and activity
  const [task] = await db.select({ projectId: project_tasks.projectId, title: project_tasks.title })
    .from(project_tasks).where(eq(project_tasks.id, taskId));

  if (task) {
    await syncProjectProgress(task.projectId);
    await logActivityAction(task.projectId, actorName || "Unknown", "updated_task", "task", taskId, title || task.title);
  }

  revalidatePath(`/projects`);
}

export async function moveProjectTaskAction(
  taskId: string,
  newStatus: TaskStatus,
  actorName?: string,
): Promise<void> {
  // Get current task info before move
  const [task] = await db.select({ projectId: project_tasks.projectId, title: project_tasks.title, status: project_tasks.status })
    .from(project_tasks).where(eq(project_tasks.id, taskId));

  await db
    .update(project_tasks)
    .set({ status: newStatus, updatedAt: new Date() } as any)
    .where(eq(project_tasks.id, taskId));

  if (task) {
    // Auto-generate timeline entry when task is completed
    if (newStatus === "done" && task.status !== "done") {
      await addTimelineEntryAction(task.projectId, {
        title: `Task Completed: ${task.title}`,
        description: `The task "${task.title}" has been marked as done.`,
        date: new Date().toISOString().split("T")[0],
        typeTag: "Success",
      });
      await logActivityAction(task.projectId, actorName || "Unknown", "completed_task", "task", taskId, task.title);
    } else {
      await logActivityAction(task.projectId, actorName || "Unknown", "moved_task", "task", taskId, task.title);
    }

    await syncProjectProgress(task.projectId);
  }

  revalidatePath(`/projects`);
}

export async function deleteProjectTaskAction(taskId: string, actorName?: string): Promise<void> {
  // Get info before deletion
  const [task] = await db.select({ projectId: project_tasks.projectId, title: project_tasks.title })
    .from(project_tasks).where(eq(project_tasks.id, taskId));

  await db.delete(project_tasks).where(eq(project_tasks.id, taskId));

  if (task) {
    await syncProjectProgress(task.projectId);
    await logActivityAction(task.projectId, actorName || "Unknown", "deleted_task", "task", taskId, task.title);
  }

  revalidatePath(`/projects`);
}

export async function addTaskCommentAction(
  taskId: string,
  comment: Omit<TaskComment, "id">
): Promise<void> {
  let validUserId = comment.authorId;
  const allUsers = await db.select().from(users);

  if (!validUserId && allUsers.length > 0) {
    const matchedUser = allUsers.find(u => u.name === comment.author);
    validUserId = matchedUser ? matchedUser.id : allUsers[0].id;
  }

  if (validUserId) {
    await db.insert(project_task_comments).values({
      id: uuidv4(),
      taskId,
      authorId: validUserId,
      authorName: comment.author,
      text: comment.text,
      createdAt: new Date(),
    });
  }

  // Log activity
  const [task] = await db.select({ projectId: project_tasks.projectId, title: project_tasks.title })
    .from(project_tasks).where(eq(project_tasks.id, taskId));
  if (task) {
    await logActivityAction(task.projectId, comment.author, "added_comment", "comment", taskId, task.title);
  }

  revalidatePath(`/projects`);
}

export async function attachFileToTaskAction(taskId: string, fileId: string): Promise<void> {
  await db.insert(project_task_attachments).values({
    id: uuidv4(),
    taskId,
    fileId,
    attachedAt: new Date(),
  });
  revalidatePath(`/projects`);
}

export async function requestProjectHelpAction(taskId: string, actorName: string): Promise<void> {
  const [task] = await db.select({ projectId: project_tasks.projectId, title: project_tasks.title })
    .from(project_tasks).where(eq(project_tasks.id, taskId));

  if (task) {
    await logActivityAction(
      task.projectId, 
      actorName, 
      "requested_help", 
      "task", 
      taskId, 
      task.title
    );
  }
  revalidatePath(`/projects`);
}
