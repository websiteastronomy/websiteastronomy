// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import TaskModal from "@/components/TaskModal";
import DocumentationHubClient from "@/components/DocumentationHubClient";
import ProjectDiscussion from "@/components/project/ProjectDiscussion";
import ProjectDocumentation from "@/components/project/ProjectDocumentation";
import ProjectFiles from "@/components/project/ProjectFiles";
import ProjectOverview from "@/components/project/ProjectOverview";
import ProjectTasks from "@/components/project/ProjectTasks";
import ProjectTimeline from "@/components/project/ProjectTimeline";
import { getDocument } from "@/lib/db";
import {
  getProjectTasksAction,
  addProjectTaskAction,
  updateProjectTaskAction,
  moveProjectTaskAction,
  deleteProjectTaskAction,
  addTaskCommentAction,
  attachFileToTaskAction,
  requestProjectHelpAction,
  type ProjectTask,
  type TaskStatus,
  type TaskComment,
} from "@/app/actions/tasks";
import {
  getProjectFilesAction,
  createProjectFolderAction,
  uploadProjectFileAction,
  renameProjectFileAction,
  deleteProjectFileAction,
  type ProjectFile,
} from "@/app/actions/files";
import { uploadFile } from "@/app/actions/storage";
import {
  getProjectTimelineAction,
  addTimelineEntryAction,
  deleteTimelineEntryAction,
  type ProjectTimelineEntry,
} from "@/app/actions/timeline";
import {
  getProjectDiscussionAction,
  addDiscussionMessageAction,
  togglePinDiscussionMessageAction,
  deleteDiscussionMessageAction,
  type ProjectDiscussionMessage,
} from "@/app/actions/discussion";
import {
  getProjectActivityAction,
  type ProjectActivity,
} from "@/app/actions/activity";
import { authClient } from "@/lib/auth-client";
import { getMyRBACProfile } from "@/app/actions/auth";
import { getProjectPermissionsAction } from "@/app/actions/projectAccess";
import { type ProjectPermissions } from "@/lib/project_permissions";
import { formatDateStable } from "@/lib/format-date";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTimeAgo(dateInput: string | Date) {
  const d = new Date(dateInput);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function renderDiscussionText(text: string) {
  const words = text.split(/(\s+)/);
  return words.map((w, i) => {
    if (w.startsWith("@") && w.length > 1) {
      return <span key={i} style={{ color: "var(--gold)", fontWeight: 600 }}>{w}</span>;
    }
    if (w.startsWith("#") && w.length > 1) {
      return <span key={i} style={{ color: "#3b82f6", fontWeight: 600 }}>{w}</span>;
    }
    if (w.startsWith("/") && w.length > 1) {
      return <span key={i} style={{ color: "#a855f7", fontWeight: 600, fontStyle: "italic" }}>{w}</span>;
    }
    if (w.startsWith("$") && w.length > 1) {
      return <span key={i} style={{ color: "#22c55e", fontWeight: 600, textDecoration: "underline" }}>{w}</span>;
    }
    return w;
  });
}
const STATUS_COLOR: Record<string, string> = {
  Ongoing: "#22c55e", Completed: "#3b82f6", Planned: "#a855f7",
};
const STATUS_BG: Record<string, string> = {
  Ongoing: "rgba(34,197,94,0.15)", Completed: "rgba(59,130,246,0.15)", Planned: "rgba(168,85,247,0.15)",
};
const PRIORITY_COLOR: Record<string, string> = {
  high: "#ef4444", medium: "#f59e0b", low: "#6b7280",
};

const KANBAN_COLS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "#6b7280" },
  { key: "inProgress", label: "In Progress", color: "#f59e0b" },
  { key: "review", label: "Review", color: "#3b82f6" },
  { key: "done", label: "Done", color: "#22c55e" },
];

const ACTION_LABELS: Record<string, string> = {
  created_task: "created task",
  updated_task: "updated task",
  completed_task: "completed task",
  moved_task: "moved task",
  deleted_task: "deleted task",
  added_comment: "added a comment",
  uploaded_file: "uploaded file",
  created_folder: "created folder",
  renamed_file: "renamed file",
  deleted_file: "deleted file",
  added_timeline: "added timeline entry",
  deleted_timeline: "deleted timeline entry",
  sent_message: "sent a message",
  deleted_message: "deleted a message",
  requested_help: "requested help",
};

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      <h2 style={{ fontSize: "1.1rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.04em", color: "var(--gold-light)" }}>{title}</h2>
    </div>
  );
}

function MetaChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0.5rem 0.9rem" }}>
      <span style={{ fontSize: "0.9rem" }}>{icon}</span>
      <div>
        <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", margin: 0, fontWeight: 500 }}>{value || "—"}</p>
      </div>
    </div>
  );
}

function KanbanCard({
  task, onClick, onDragStart,
}: { task: ProjectTask; onClick: () => void; onDragStart?: (e: React.DragEvent) => void }) {
  const hasAttachments = (task.attachments || []).length > 0;
  const commentCount = (task.comments || []).length;
  const assignees = task.assignees || [];

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
      draggable={!!onDragStart}
      onDragStart={onDragStart as any}
      onClick={onClick}
      style={{
        background: task.isBlocked ? "rgba(239,68,68,0.06)" : "rgba(8,12,22,0.8)",
        border: task.isBlocked ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border-subtle)",
        borderRadius: "8px", padding: "0.85rem", marginBottom: "0.6rem", cursor: "pointer",
        transition: "border-color 0.2s",
      }}
    >
      {/* Priority + Blocked indicator */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: PRIORITY_COLOR[task.priority], background: PRIORITY_COLOR[task.priority] + "22", padding: "0.15rem 0.45rem", borderRadius: "4px" }}>
          {task.priority}
        </span>
        {task.isBlocked && <span style={{ fontSize: "0.65rem", color: "#ef4444" }}>🚫 Blocked</span>}
      </div>

      {/* Title */}
      <p style={{ fontSize: "0.83rem", lineHeight: 1.4, marginBottom: "0.6rem", fontWeight: 500 }}>{task.title}</p>

      {/* Deadline */}
      {task.deadline && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.6rem" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>📅 {task.deadline}</span>
        </div>
      )}

      {/* Footer: Assignees + counts */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex" }}>
          {assignees.slice(0, 3).map((a, i) => (
            <div key={i} style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--gold-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", color: "#000", fontWeight: 700, border: "1.5px solid rgba(8,12,22,0.8)", marginLeft: i > 0 ? "-8px" : 0, overflow: "hidden" }}>
              {a.image ? <img src={a.image} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : a.name.charAt(0)}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          {hasAttachments && <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>📎{(task.attachments || []).length}</span>}
          {commentCount > 0 && <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>💬{commentCount}</span>}
        </div>
      </div>
    </motion.div>
  );
}

export type ProjectRouteSection =
  | "overview"
  | "tasks"
  | "files"
  | "documentation"
  | "timeline"
  | "discussion";

export function ProjectDetailClient({ routeSection }: { routeSection?: ProjectRouteSection } = {}) {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const { data: session, isPending } = authClient.useSession();
  const userName = session?.user?.name || "Unknown";

  // ── RBAC: Fetch the user's real role name from the DB ────────────────────────
  // Replaces the legacy (session?.user as any)?.role string read.
  const [globalRoleName, setGlobalRoleName] = useState<string>("none");
  useEffect(() => {
    if (!session?.user?.id) {
      setGlobalRoleName("none");
      return;
    }
    getMyRBACProfile().then((profile) => {
      setGlobalRoleName(profile?.roleName || "none");
    });
  }, [session?.user?.id]);

  const [proj, setProj] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Permission flags ──────────────────────────────────────────────────────────
  const [projectPerms, setProjectPerms] = useState<ProjectPermissions>({
    canView: true,
    canUpload: false,
    canEdit: false,
    canComment: false,
    isProjectLead: false,
  });

  useEffect(() => {
    if (!id || !session?.user?.id) return;
    getProjectPermissionsAction(id).then(setProjectPerms);
  }, [id, session?.user?.id]);

  const canCreateTask     = projectPerms.canEdit;
  const canDeleteTask     = projectPerms.canEdit;
  const canEditTaskFull   = projectPerms.canEdit;
  const canAddTimeline    = projectPerms.canEdit;
  // Let Global admins (who are designated implicit local leads) or Explicit leads delete heavy things
  const canDeleteTimeline = projectPerms.isProjectLead;
  const canUploadFiles    = projectPerms.canUpload;
  const canDeleteAnyFile  = projectPerms.canEdit;
  const canPinMessage     = projectPerms.canEdit;
  const canDeleteAnyMsg   = projectPerms.isProjectLead;
  const isReadOnly        = !projectPerms.canEdit && !projectPerms.canUpload && !projectPerms.canComment;
  const canDeleteOwnFile  = (uploadedBy: string) => uploadedBy === userName || canDeleteAnyFile;
  const isViewer = isReadOnly;

  const isAuthenticated = !!session?.user;
  type UserRole = "Admin" | "Lead" | "Core Committee" | "Member" | "External";
  const userRole: UserRole = !isAuthenticated
    ? "External"
    : globalRoleName === "Admin"
      ? "Admin"
      : globalRoleName === "Core Committee"
        ? "Core Committee"
        : projectPerms.isProjectLead
          ? "Lead"
          : "Member";

  // Files State
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [fileSearch, setFileSearch] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [attachingFileId, setAttachingFileId] = useState<string | null>(null);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [fileToDeleteId, setFileToDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tasks State
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "files" | "documentation" | "timeline" | "discussion">("tasks");
  // Member defaults to "My Tasks" filter; others see all tasks
  const [myTasksFilter, setMyTasksFilter] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  // Discussion State
  const [discMessages, setDiscMessages] = useState<ProjectDiscussionMessage[]>([]);
  const [discLoading, setDiscLoading] = useState(true);
  const [discInput, setDiscInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);

  // Timeline State
  const [timelineEvents, setTimelineEvents] = useState<ProjectTimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState<string>("All");
  const [addingTimelineEvent, setAddingTimelineEvent] = useState(false);
  const [newTimelineForm, setNewTimelineForm] = useState({ title: "", description: "", typeTag: "Update", date: "" });
  const [timelineEventToDelete, setTimelineEventToDelete] = useState<string | null>(null);
  const [fileAttachFeedback, setFileAttachFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Activity State
  const [activityFeed, setActivityFeed] = useState<ProjectActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Quick-add per column
  const [addingInCol, setAddingInCol] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    if (!id) return;
    getDocument("projects", id)
      .then((data) => { setProj(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  // Redirect unauthenticated visitors to the public showcase
  useEffect(() => {
    if (!isPending && session === null) {
      router.replace(`/projects/${id}/public`);
    }
  }, [session, isPending, id, router]);

  // Default "My Tasks" filter for Members (not Leads/Admins)
  useEffect(() => {
    if (projectPerms.canView && !projectPerms.canEdit) setMyTasksFilter(true);
  }, [projectPerms.canEdit, projectPerms.canView]);

  const loadTasks = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getProjectTasksAction(id);
      setTasks(data);
    } catch (e) { console.error(e); }
    finally { setTasksLoading(false); }
  }, [id]);

  const loadFiles = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getProjectFilesAction(id);
      setFiles(data);
    } catch (e) { console.error(e); }
    finally { setFilesLoading(false); }
  }, [id]);

  const loadTimeline = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getProjectTimelineAction(id);
      setTimelineEvents(data);
    } catch (e) { console.error(e); }
    finally { setTimelineLoading(false); }
  }, [id]);

  const loadDiscussion = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getProjectDiscussionAction(id);
      setDiscMessages(data);
    } catch (e) { console.error(e); }
    finally { setDiscLoading(false); }
  }, [id]);

  const loadActivity = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getProjectActivityAction(id);
      setActivityFeed(data);
    } catch (e) { console.error(e); }
    finally { setActivityLoading(false); }
  }, [id]);

  useEffect(() => { loadTasks(); loadFiles(); loadTimeline(); loadDiscussion(); loadActivity(); }, [loadTasks, loadFiles, loadTimeline, loadDiscussion, loadActivity]);

  if (loading || isPending) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--gold)" }}>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!isPending && session === null) {
    return null; // Will be redirected to /public by the useEffect above
  }

  if (!proj) {
    return (
      <div style={{ textAlign: "center", padding: "8rem 2rem", minHeight: "80vh" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Project Not Found</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>The project you are looking for does not exist.</p>
        <Link href="/projects" className="btn-secondary">← Back to Projects</Link>
      </div>
    );
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const pendingTasks = totalTasks - completedTasks;
  const autoProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : proj.progress ?? 0;
  const projectLead = (proj.team || []).find((m: any) => m.role?.toLowerCase().includes("lead")) || proj.team?.[0];
  const nextMilestone = (proj.updates || []).length > 0 ? proj.updates[0]?.title : "No milestones set";
  const deadline = proj.endDate || "TBD";
  const lastActivity = proj.lastUpdated || "—";
  const teamMembers: { name: string; role: string }[] = proj.team || [];

  // ── Task handlers ────────────────────────────────────────────────────────────
  const handleAddTask = async (col: TaskStatus) => {
    if (!newTaskTitle.trim()) return;
    const t = await addProjectTaskAction(id, { title: newTaskTitle, status: col, priority: "medium", actorName: userName });
    setTasks(prev => [...prev, t]);
    setNewTaskTitle("");
    setAddingInCol(null);
    loadActivity();
  };

  const handleSaveTask = async (taskId: string, data: Partial<ProjectTask>) => {
    await updateProjectTaskAction(taskId, { ...data, actorName: userName } as any);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t));
    setSelectedTask(prev => prev ? { ...prev, ...data } : prev);
    loadActivity();
  };

  const handleMarkComplete = async (taskId: string) => {
    await moveProjectTaskAction(taskId, "done", userName);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "done" } : t));
    setSelectedTask(null);
    loadActivity();
    loadTimeline(); // Task completion auto-triggers timeline entry
  };

  const handleMarkBlocked = async (taskId: string, blocked: boolean) => {
    await updateProjectTaskAction(taskId, { isBlocked: blocked, actorName: userName });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isBlocked: blocked } : t));
    setSelectedTask(prev => prev ? { ...prev, isBlocked: blocked } : prev);
    loadActivity();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canDeleteTask) return;
    await deleteProjectTaskAction(taskId, userName);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTask(null);
    loadActivity();
  };

  const handleRequestHelp = async (taskId: string) => {
    await requestProjectHelpAction(taskId, userName);
    loadActivity();
  };

  // ── File handlers ────────────────────────────────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const draggedFiles = Array.from(e.dataTransfer.files);
      setFilesLoading(true);
      try {
        for (const file of draggedFiles) {
          const sizeStr = file.size > 1024 * 1024 ? (file.size / 1024 / 1024).toFixed(2) + " MB" : (file.size / 1024).toFixed(2) + " KB";
          const formData = new FormData();
          formData.append("file", file);
          const uploadResult = await uploadFile(formData, "projects", id, false);
          await uploadProjectFileAction(id, {
            name: uploadResult.fileName,
            parentId: currentFolderId,
            fileSize: sizeStr,
            mimeType: file.type || "application/octet-stream",
            uploadedBy: userName,
            url: uploadResult.fileUrl,
            fileId: uploadResult.fileId,
          });
        }
        await loadFiles();
      } catch (e) {
        console.error(e);
        setFilesLoading(false);
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files);
    setFilesLoading(true);
    try {
      for (const file of selectedFiles) {
        const sizeStr = file.size > 1024 * 1024 ? (file.size / 1024 / 1024).toFixed(2) + " MB" : (file.size / 1024).toFixed(2) + " KB";
        const formData = new FormData();
        formData.append("file", file);
        const uploadResult = await uploadFile(formData, "projects", id, false);
        await uploadProjectFileAction(id, {
          name: uploadResult.fileName,
          parentId: currentFolderId,
          fileSize: sizeStr,
          mimeType: file.type || "application/octet-stream",
          uploadedBy: userName,
          url: uploadResult.fileUrl,
          fileId: uploadResult.fileId,
        });
      }
      await loadFiles();
    } catch (err) {
      console.error(err);
      setFilesLoading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    loadActivity();
  };

  const startRenamingFile = (file: ProjectFile) => {
    setRenamingFileId(file.id);
    setRenameValue(file.name);
    setFileToDeleteId(null);
    setAttachingFileId(null);
  };

  const handleCreateFolder = async () => {
    setFilesLoading(true);
    try {
      const folder = await createProjectFolderAction(id, getUntitledFolderName(), currentFolderId, userName);
      setRenamingFileId(folder.id);
      setRenameValue(folder.name);
      await loadFiles();
      loadActivity();
    } catch (e) {
      console.error(e);
      setFilesLoading(false);
    }
  };

  const handleRenameFile = async (fileId: string) => {
    const nextName = renameValue.trim();
    if (!nextName) return;

    setRenameSaving(true);
    setFilesLoading(true);
    try {
      await renameProjectFileAction(fileId, nextName, userName);
      setRenamingFileId(null);
      setRenameValue("");
      await loadFiles();
      loadActivity();
    } catch (err) {
      console.error(err);
      setFilesLoading(false);
    } finally {
      setRenameSaving(false);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    setFilesLoading(true);
    try {
      await deleteProjectFileAction(fileId);
      await loadFiles();
    } catch (err) {
      console.error(err);
    } finally {
      setFileToDeleteId(null);
      setFilesLoading(false);
    }
  };

  const handleAddTimelineEvent = async () => {
    if (!newTimelineForm.title.trim()) return;
    setTimelineLoading(true);
    try {
      await addTimelineEntryAction(id as string, {
        title: newTimelineForm.title,
        description: newTimelineForm.description,
        typeTag: newTimelineForm.typeTag,
        date: newTimelineForm.date,
      });
      setAddingTimelineEvent(false);
      setNewTimelineForm({ title: "", description: "", typeTag: "Update", date: "" });
      await loadTimeline();
      loadActivity();
    } catch (e) {
      console.error(e);
      setTimelineLoading(false);
    }
  };

  const handleDeleteTimelineEvent = async (entryId: string) => {
    setTimelineLoading(true);
    try {
      await deleteTimelineEntryAction(entryId);
      await loadTimeline();
      loadActivity();
    } catch (e) {
      console.error(e);
    } finally {
      setTimelineEventToDelete(null);
      setTimelineLoading(false);
    }
  };

  const handleSendDiscussion = async () => {
    if (!discInput.trim() || !id) return;
    const text = discInput;
    const authorName = userName;
    const authorAvatar = userName.charAt(0).toUpperCase();
    const replyToId = replyingTo?.id;

    setDiscInput("");
    setReplyingTo(null);
    try {
      await addDiscussionMessageAction(id, {
        authorName,
        authorAvatar,
        text,
        replyToId,
      });
      await loadDiscussion();
      loadActivity();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePin = async (msgId: string, currentPin: boolean) => {
    try {
      await togglePinDiscussionMessageAction(msgId, !currentPin);
      await loadDiscussion();
      loadActivity();
    } catch (e) { console.error(e); }
  };
  
  const handleDeleteDiscussion = async (msgId: string) => {
    try {
      await deleteDiscussionMessageAction(msgId);
      await loadDiscussion();
      loadActivity();
    } catch (e) { console.error(e); }
  };

  const handleAttachToTask = async (fileId: string, taskId: string) => {
    const file = files.find(f => f.id === fileId);
    const task = tasks.find(t => t.id === taskId);
    if (!file || !task) return;
    
    setAttachingFileId(null);
    try {
      await attachFileToTaskAction(taskId, fileId);
      await loadTasks();
      setFileAttachFeedback({ type: "success", message: `Attached ${file.name} to task: ${task.title}` });
    } catch (e) {
      console.error(e);
      setFileAttachFeedback({ type: "error", message: "Failed to attach file to task." });
    }
  };

  const currentFolderFiles = files.filter(f => f.parentId === currentFolderId);
  const displayFiles = currentFolderFiles.filter(f => f.name.toLowerCase().includes(fileSearch.toLowerCase()));

  // Breadcrumbs helper
  const getBreadcrumbs = () => {
    const crumbs = [];
    let curr = files.find(f => f.id === currentFolderId);
    while (curr) {
      crumbs.unshift(curr);
      curr = files.find(f => f.id === curr!.parentId);
    }
    return crumbs;
  };

  const getUntitledFolderName = () => {
    const siblingNames = new Set(
      files
        .filter(file => file.parentId === currentFolderId)
        .map(file => file.name.toLowerCase())
    );

    const baseName = "Untitled folder";
    if (!siblingNames.has(baseName.toLowerCase())) {
      return baseName;
    }

    let index = 2;
    while (siblingNames.has(`${baseName} ${index}`.toLowerCase())) {
      index += 1;
    }

    return `${baseName} ${index}`;
  };

  const handleAddComment = async (taskId: string, comment: Omit<TaskComment, "id">) => {
    await addTaskCommentAction(taskId, comment);
    const updated = await getProjectTasksAction(id);
    setTasks(updated);
    const updatedTask = updated.find(t => t.id === taskId) || null;
    setSelectedTask(updatedTask);
  };

  // ── Drag & Drop handlers ────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, colKey: TaskStatus) => {
    e.preventDefault();
    if (isViewer || !dragTaskId) return;
    const task = tasks.find(t => t.id === dragTaskId);
    if (!task || task.status === colKey) { setDragTaskId(null); return; }
    await moveProjectTaskAction(dragTaskId, colKey, userName);
    setTasks(prev => prev.map(t => t.id === dragTaskId ? { ...t, status: colKey } : t));
    setDragTaskId(null);
    loadActivity();
  };

  const tasksInCol = (col: TaskStatus) => {
    const base = myTasksFilter
      ? tasks.filter(t => t.assignees.some((a: any) => a.name === userName))
      : tasks;
    return base.filter(t => t.status === col);
  };

  return (
      <div style={{ paddingBottom: "6rem" }}>
        {fileAttachFeedback ? (
          <div style={{ maxWidth: "1200px", margin: "1rem auto 0", padding: "0 1rem" }}>
            <div style={{ padding: "0.9rem 1rem", borderRadius: "10px", border: fileAttachFeedback.type === "success" ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)", background: fileAttachFeedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: fileAttachFeedback.type === "success" ? "#86efac" : "#fca5a5", fontSize: "0.85rem" }}>
              {fileAttachFeedback.message}
            </div>
          </div>
        ) : null}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── COVER IMAGE HEADER ── */}
      <div style={{ width: "100%", height: "44vh", minHeight: "300px", position: "relative", overflow: "hidden" }}>
        <img src={proj.coverImage} alt={proj.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "80%", background: "linear-gradient(to top, rgba(8,12,22,1) 0%, rgba(8,12,22,0.7) 50%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
          <motion.button
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => router.back()}
            style={{ position: "absolute", top: "2rem", left: "2rem", background: "rgba(15,22,40,0.6)", backdropFilter: "blur(8px)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.85rem" }}
          >← Back</motion.button>

          <AnimatedSection>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center", marginBottom: "0.75rem" }}>
              <span className="status-pulse" style={{ color: STATUS_COLOR[proj.status] || "var(--gold)", background: STATUS_BG[proj.status] || "rgba(201,168,76,0.15)", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ● {proj.status}
              </span>
              {proj.isFeatured && <span style={{ color: "#000", background: "var(--gold)", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>Featured</span>}
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem,4.5vw,3rem)", fontFamily: "'Cinzel', serif", marginBottom: "0.75rem", letterSpacing: "0.04em" }}>
              <span className="gradient-text">{proj.title}</span>
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {(proj.tags || []).map((t: string) => (
                <span key={t} style={{ color: "var(--text-secondary)", fontSize: "0.75rem", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(4px)", padding: "0.25rem 0.7rem", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.09)" }}>{t}</span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* ── META STRIP ── */}
      <div style={{ background: "rgba(11,16,30,0.97)", borderBottom: "1px solid var(--border-subtle)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.9rem" }}>
            <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Progress</span>
            <div style={{ flex: 1, height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${autoProgress}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ height: "100%", background: "linear-gradient(90deg, var(--gold-dark), var(--gold))", borderRadius: "3px" }}
              />
            </div>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--gold-light)", whiteSpace: "nowrap" }}>{autoProgress}%</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            <MetaChip icon="📅" label="Deadline" value={deadline} />
            <MetaChip icon="👤" label="Project Lead" value={projectLead?.name || "Unassigned"} />
            <MetaChip icon="🕐" label="Last Activity" value={lastActivity} />
            <MetaChip icon="🚀" label="Next Milestone" value={nextMilestone} />
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem", display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem", alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Mission Objective */}
          {(!routeSection || routeSection === "overview") && (
            <ProjectOverview proj={proj} projectId={id} showFullPageLink={routeSection === "overview"} />
          )}

          {/* Tab Nav */}
          {!routeSection && <AnimatedSection delay={0.05}>
            <div style={{ display: "flex", gap: "0.25rem", background: "rgba(8,12,22,0.6)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "0.3rem" }}>
              {(["tasks", "files", "documentation", "timeline", "discussion"] as const).map((tab: any) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: "0.6rem 0.5rem", borderRadius: "7px", border: "none", cursor: "pointer",
                  fontSize: "0.78rem", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500,
                  textTransform: "capitalize", letterSpacing: "0.03em", transition: "all 0.2s ease",
                  background: activeTab === tab ? "rgba(201,168,76,0.15)" : "transparent",
                  color: activeTab === tab ? "var(--gold-light)" : "var(--text-muted)",
                  borderBottom: activeTab === tab ? "2px solid var(--gold)" : "2px solid transparent",
                }}>
                  {{ tasks: "📋 Task Board", files: "📁 Files", timeline: "📍 Timeline", discussion: "💬 Discussion" }[tab]}
                  {tab === "documentation" ? "Documentation" : null}
                </button>
              ))}
            </div>
          </AnimatedSection>}

          {/* Tab Content */}
          <AnimatePresence mode="wait">

            {/* KANBAN TASK BOARD */}
            {!routeSection && activeTab === "tasks" && (
              <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ProjectTasks
                  projectId={id}
                  isViewer={isViewer}
                  myTasksFilter={myTasksFilter}
                  setMyTasksFilter={setMyTasksFilter}
                  isReadOnly={isReadOnly}
                  tasksLoading={tasksLoading}
                  KANBAN_COLS={KANBAN_COLS}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  tasksInCol={tasksInCol}
                  KanbanCard={KanbanCard}
                  setSelectedTask={setSelectedTask}
                  handleDragStart={handleDragStart}
                  addingInCol={addingInCol}
                  setAddingInCol={setAddingInCol}
                  newTaskTitle={newTaskTitle}
                  setNewTaskTitle={setNewTaskTitle}
                  handleAddTask={handleAddTask}
                  canCreateTask={canCreateTask}
                />
              </motion.div>
            )}
            {false && activeTab === "tasks" && (
              <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>📋</span>
                      <h2 style={{ fontSize: "1.1rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.04em", color: "var(--gold-light)" }}>Task Board</h2>
                    </div>
                    {/* My Tasks toggle — shown to all authenticated users */}
                    {!isViewer && (
                      <div style={{ display: "flex", gap: "0.3rem", background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "0.2rem" }}>
                        <button onClick={() => setMyTasksFilter(false)} style={{ padding: "0.35rem 0.75rem", borderRadius: "6px", border: "none", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", background: !myTasksFilter ? "rgba(201,168,76,0.2)" : "transparent", color: !myTasksFilter ? "var(--gold-light)" : "var(--text-muted)" }}>All Tasks</button>
                        <button onClick={() => setMyTasksFilter(true)} style={{ padding: "0.35rem 0.75rem", borderRadius: "6px", border: "none", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", background: myTasksFilter ? "rgba(201,168,76,0.2)" : "transparent", color: myTasksFilter ? "var(--gold-light)" : "var(--text-muted)" }}>My Tasks</button>
                      </div>
                    )}
                    {/* Core Committee / External read-only badge */}
                    {isReadOnly && (
                      <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.6rem", borderRadius: "4px", background: "rgba(59,130,246,0.12)", color: "#3b82f6", fontWeight: 600, border: "1px solid rgba(59,130,246,0.2)" }}>👁 Read-only</span>
                    )}
                  </div>
                  {tasksLoading ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading tasks...</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                      {KANBAN_COLS.map(col => (
                        <div
                          key={col.key}
                          onDragOver={(!isViewer && !isReadOnly) ? handleDragOver : undefined}
                          onDrop={(!isViewer && !isReadOnly) ? e => handleDrop(e, col.key) : undefined}
                          style={{ minHeight: "120px" }}
                        >
                          {/* Column header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: col.color }}>{col.label}</span>
                            <span style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-muted)", borderRadius: "10px", padding: "0.1rem 0.5rem", fontSize: "0.65rem" }}>
                              {tasksInCol(col.key).length}
                            </span>
                          </div>

                          {/* Drop area */}
                          <div style={{
                            minHeight: "80px", background: "rgba(0,0,0,0.15)", borderRadius: "8px", padding: "0.5rem",
                            border: `1px dashed ${col.color}33`, transition: "border-color 0.2s",
                          }}>
                            {tasksInCol(col.key).map(task => (
                              <KanbanCard
                                key={task.id} task={task}
                                onClick={() => setSelectedTask(task)}
                                onDragStart={(!isViewer && !isReadOnly) ? e => handleDragStart(e, task.id) : undefined}
                              />
                            ))}

                            {/* Quick-add form */}
                            {addingInCol === col.key ? (
                              <div style={{ marginTop: "0.3rem" }}>
                                <input
                                  autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter") handleAddTask(col.key); if (e.key === "Escape") { setAddingInCol(null); setNewTaskTitle(""); } }}
                                  placeholder="Task title…"
                                  style={{ width: "100%", padding: "0.5rem 0.7rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--gold)", borderRadius: "6px", color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.8rem", outline: "none", marginBottom: "0.4rem" }}
                                />
                                <div style={{ display: "flex", gap: "0.3rem" }}>
                                  <button onClick={() => handleAddTask(col.key)} style={{ flex: 1, background: col.color, border: "none", color: "#000", borderRadius: "5px", padding: "0.35rem 0", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
                                  <button onClick={() => { setAddingInCol(null); setNewTaskTitle(""); }} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "5px", padding: "0.35rem 0.5rem", fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                                </div>
                              </div>
                            ) : (
                              canCreateTask && (
                                <button onClick={() => { setAddingInCol(col.key); setNewTaskTitle(""); }}
                                  style={{ width: "100%", marginTop: "0.3rem", background: "transparent", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "6px", color: "var(--text-muted)", padding: "0.4rem", fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = col.color; (e.target as HTMLElement).style.color = col.color; }}
                                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.target as HTMLElement).style.color = "var(--text-muted)"; }}
                                >+ Add Task</button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* FILE MANAGER */}
            {!routeSection && activeTab === "files" && (
              <motion.div key="files" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ProjectFiles
                  projectId={id}
                  handleDrag={handleDrag}
                  dragActive={dragActive}
                  handleDropFiles={handleDropFiles}
                  currentFolderId={currentFolderId}
                  setCurrentFolderId={setCurrentFolderId}
                  fileSearch={fileSearch}
                  setFileSearch={setFileSearch}
                  fileInputRef={fileInputRef}
                  handleFileInputChange={handleFileInputChange}
                  isViewer={isViewer}
                  canUploadFiles={canUploadFiles}
                  isReadOnly={isReadOnly}
                  handleCreateFolder={handleCreateFolder}
                  filesLoading={filesLoading}
                  displayFiles={displayFiles}
                  getBreadcrumbs={getBreadcrumbs}
                  tasks={tasks}
                  attachingFileId={attachingFileId}
                  setAttachingFileId={setAttachingFileId}
                  handleAttachToTask={handleAttachToTask}
                  renamingFileId={renamingFileId}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  handleRenameFile={handleRenameFile}
                  renameSaving={renameSaving}
                  setRenamingFileId={setRenamingFileId}
                  setFileToDeleteId={setFileToDeleteId}
                  fileToDeleteId={fileToDeleteId}
                  handleDeleteFile={handleDeleteFile}
                  canDeleteAnyFile={canDeleteAnyFile}
                  startRenamingFile={startRenamingFile}
                  canDeleteOwnFile={canDeleteOwnFile}
                />
              </motion.div>
            )}
            {false && activeTab === "files" && (
              <motion.div key="files" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div 
                  onDragEnter={handleDrag}
                  style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem", position: "relative" }}
                >
                  {/* Drop zone overlay */}
                  {dragActive && (
                    <div 
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDropFiles}
                      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(34,197,94,0.1)", backdropFilter: "blur(2px)", border: "2px dashed #22c55e", borderRadius: "12px", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e", fontSize: "1.2rem", fontWeight: 600 }}
                    >
                      Drop files here to upload
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flex: 1 }}>
                      <span>📁</span>
                      <h2 style={{ fontSize: "1.1rem", fontFamily: "'Cinzel', serif", color: "var(--gold-light)", margin: 0, whiteSpace: "nowrap" }}>Files</h2>
                      <span style={{ color: "var(--border-subtle)", fontSize: "0.8rem" }}>/</span>
                      
                      {/* Breadcrumbs */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem" }}>
                        <button onClick={() => setCurrentFolderId(null)} style={{ background: "transparent", border: "none", color: currentFolderId ? "var(--text-secondary)" : "var(--gold)", cursor: "pointer", fontFamily: "inherit" }}>Root</button>
                        {getBreadcrumbs().map((crumb, idx) => (
                          <div key={crumb.id} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span style={{ color: "var(--border-subtle)", fontSize: "0.8rem" }}>/</span>
                            <button onClick={() => setCurrentFolderId(crumb.id)} style={{ background: "transparent", border: "none", color: idx === getBreadcrumbs().length - 1 ? "var(--gold)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit" }}>
                              {crumb.name}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input 
                        placeholder="Search..." value={fileSearch} onChange={e => setFileSearch(e.target.value)}
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.35rem 0.6rem", color: "white", fontSize: "0.75rem", outline: "none" }}
                      />
                      <input 
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleFileInputChange}
                        disabled={isViewer}
                      />
                      {canUploadFiles && !isReadOnly && (
                        <>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.3rem", whiteSpace: "nowrap" }}
                          >
                            ⬆ Upload
                          </button>
                          <button onClick={handleCreateFolder} style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                            Create folder
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* File List */}
                  {filesLoading ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading files...</div>
                  ) : displayFiles.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px dashed var(--border-subtle)" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📤</div>
                      <p style={{ margin: 0, fontSize: "0.85rem" }}>No files found in this folder.</p>
                      <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Drag and drop files here, use Upload files, or create a folder and rename it later.</p>
                      {canUploadFiles && !isReadOnly && (
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "6px", padding: "0.45rem 0.9rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}
                          >
                            Upload files
                          </button>
                          <button
                            onClick={handleCreateFolder}
                            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "6px", padding: "0.45rem 0.9rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}
                          >
                            Create folder
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {/* Column Headers */}
                      <div style={{ display: "flex", padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--border-subtle)", margin: "0 0 0.5rem", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600 }}>
                        <div style={{ flex: 2 }}>Name</div>
                        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>Size</div>
                        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>Uploaded By</div>
                        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", paddingRight: "1rem" }}>Actions</div>
                      </div>
                      
                      {displayFiles.map(file => (
                        <motion.div key={file.id} whileHover={{ background: "rgba(255,255,255,0.04)" }}
                          onClick={() => file.type === "folder" && setCurrentFolderId(file.id)}
                          style={{ display: "flex", alignItems: "center", padding: "0.75rem", borderRadius: "8px", cursor: file.type === "folder" ? "pointer" : "default", borderBottom: "1px solid var(--border-subtle)", transition: "background 0.2s" }}>
                          
                          {/* Name col */}
                          <div style={{ flex: 2, display: "flex", alignItems: "center", gap: "0.8rem", overflow: "hidden" }}>
                            <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{file.type === "folder" ? "📁" : "📄"}</span>
                            <div style={{ overflow: "hidden" }}>
                              {renamingFileId === file.id ? (
                                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                  <input
                                    autoFocus
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleRenameFile(file.id);
                                      if (e.key === "Escape") {
                                        setRenamingFileId(null);
                                        setRenameValue("");
                                      }
                                    }}
                                    placeholder="Name"
                                    style={{ width: "100%", minWidth: "220px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--gold)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none" }}
                                  />
                                  <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>
                                    Press Enter to save or Esc to cancel
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <p style={{ fontSize: "0.85rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: file.type === "folder" ? "var(--gold-light)" : "var(--text-primary)" }}>{file.name}</p>
                                  <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>
                                    {formatDateStable(file.updatedAt)}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Size col */}
                          <div style={{ flex: 1, display: "flex", justifyContent: "center", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            {file.fileSize || "—"}
                          </div>

                          {/* Uploaded By col */}
                          <div style={{ flex: 1, display: "flex", justifyContent: "center", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            {file.uploadedBy}
                          </div>

                          {/* Actions col */}
                          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                            {file.type === "file" && renamingFileId !== file.id && (
                              <div style={{ position: "relative" }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setAttachingFileId(attachingFileId === file.id ? null : file.id); }}
                                  style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                  📎 Attach
                                </button>
                                
                                {/* Dropdown menu for tasks */}
                                {attachingFileId === file.id && (
                                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "4px", background: "rgba(15,22,40,0.95)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0.5rem", width: "220px", zIndex: 50, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", backdropFilter: "blur(10px)" }}>
                                    <p style={{ fontSize: "0.7rem", color: "var(--gold)", margin: "0 0 0.5rem 0", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: "0.3rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Attach to Task</p>
                                    <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                      {tasks.length === 0 ? (
                                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, padding: "0.5rem", textAlign: "center" }}>No open tasks.</p>
                                      ) : (
                                        tasks.filter(t => t.status !== "done").map(task => (
                                          <button 
                                            key={task.id}
                                            onClick={(e) => { e.stopPropagation(); handleAttachToTask(file.id, task.id); }}
                                            style={{ textAlign: "left", background: "transparent", border: "none", color: "var(--text-secondary)", padding: "0.4rem 0.5rem", fontSize: "0.75rem", borderRadius: "4px", cursor: "pointer", transition: "all 0.15s" }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                          >
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {!isViewer && !isReadOnly && renamingFileId === file.id ? (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRenameFile(file.id); }}
                                  disabled={renameSaving}
                                  style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setRenamingFileId(null); setRenameValue(""); }}
                                  style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : fileToDeleteId === file.id ? (
                              <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Sure?</span>
                                <button
                                  onClick={(e) => handleDeleteFile(e, file.id)}
                                  style={{ background: "#ef4444", border: "none", color: "white", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setFileToDeleteId(null); }}
                                  style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              /* Rename: Lead/Admin only | Delete: own file (Member) OR any file (Lead/Admin) */
                              !isViewer && !isReadOnly && (
                                <>
                                  {canDeleteAnyFile && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); startRenamingFile(file); }}
                                      style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}
                                    >
                                      Rename
                                    </button>
                                  )}
                                  {canDeleteOwnFile(file.uploadedBy) && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setFileToDeleteId(file.id); }}
                                      style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer", transition: "all 0.2s" }}
                                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                                    >
                                      🗑
                                    </button>
                                  )}
                                </>
                              )
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {!routeSection && activeTab === "documentation" && (
              <motion.div key="documentation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ProjectDocumentation
                  projectId={id}
                  userName={userName}
                  projectPerms={projectPerms}
                  canDeleteAnyFile={canDeleteAnyFile}
                  tasks={tasks}
                  loadTasks={loadTasks}
                />
              </motion.div>
            )}
            {false && activeTab === "documentation" && (
              <motion.div key="documentation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <DocumentationHubClient
                  scope={{ projectId: id, isGlobal: false }}
                  userName={userName}
                  canManage={projectPerms.canEdit}
                  canUpload={projectPerms.canUpload}
                  canDeleteAny={projectPerms.canEdit}
                  canDeleteOwn={(uploadedBy) => uploadedBy === userName || canDeleteAnyFile}
                  tasks={tasks}
                  onTasksRefresh={loadTasks}
                  title="Project Documentation"
                  subtitle="Files, folders, docs, and forms linked to this project."
                />
              </motion.div>
            )}

            {/* TIMELINE */}
            {!routeSection && activeTab === "timeline" && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ProjectTimeline
                  projectId={id}
                  SectionHeading={SectionHeading}
                  canAddTimeline={canAddTimeline}
                  addingTimelineEvent={addingTimelineEvent}
                  setAddingTimelineEvent={setAddingTimelineEvent}
                  newTimelineForm={newTimelineForm}
                  setNewTimelineForm={setNewTimelineForm}
                  handleAddTimelineEvent={handleAddTimelineEvent}
                  timelineFilter={timelineFilter}
                  setTimelineFilter={setTimelineFilter}
                  timelineLoading={timelineLoading}
                  timelineEvents={timelineEvents}
                  canDeleteTimeline={canDeleteTimeline}
                  timelineEventToDelete={timelineEventToDelete}
                  setTimelineEventToDelete={setTimelineEventToDelete}
                  handleDeleteTimelineEvent={handleDeleteTimelineEvent}
                />
              </motion.div>
            )}
            {false && activeTab === "timeline" && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <SectionHeading icon="📍" title="Timeline & Milestones" />
                    {canAddTimeline && (
                      <button 
                        onClick={() => setAddingTimelineEvent(!addingTimelineEvent)} 
                        style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {addingTimelineEvent ? "Cancel" : "+ Add Event"}
                      </button>
                    )}
                  </div>

                  {addingTimelineEvent && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input type="date" value={newTimelineForm.date} onChange={e => setNewTimelineForm({ ...newTimelineForm, date: e.target.value })} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none" }} />
                        <select value={newTimelineForm.typeTag} onChange={e => setNewTimelineForm({ ...newTimelineForm, typeTag: e.target.value })} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none" }}>
                          <option value="Update">Update</option>
                          <option value="Milestone">Milestone</option>
                          <option value="Issue">Issue</option>
                          <option value="Success">Success</option>
                        </select>
                        <input placeholder="Event Title..." value={newTimelineForm.title} onChange={e => setNewTimelineForm({ ...newTimelineForm, title: e.target.value })} style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none" }} />
                      </div>
                      <textarea placeholder="Event Description..." value={newTimelineForm.description} onChange={e => setNewTimelineForm({ ...newTimelineForm, description: e.target.value })} rows={2} style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none", resize: "vertical" }} />
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button onClick={handleAddTimelineEvent} className="btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}>Save Event</button>
                      </div>
                    </motion.div>
                  )}

                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
                    {["All", "Milestone", "Update", "Issue", "Success"].map(f => (
                      <button key={f} onClick={() => setTimelineFilter(f)} style={{ padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", border: timelineFilter === f ? "1px solid transparent" : "1px solid var(--border-subtle)", background: timelineFilter === f ? (f === "Milestone" ? "var(--gold)" : f === "Issue" ? "#ef4444" : f === "Success" ? "#22c55e" : f === "Update" ? "#3b82f6" : "rgba(255,255,255,0.2)") : "transparent", color: timelineFilter === f ? (f === "All" ? "white" : "#000") : "var(--text-secondary)" }}>
                        {f}
                      </button>
                    ))}
                  </div>

                  {timelineLoading ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading timeline...</div>
                  ) : timelineEvents.filter(e => timelineFilter === "All" || e.typeTag === timelineFilter).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "3rem 0", opacity: 0.5 }}>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📅</div>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No timeline entries found.</p>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", top: 0, bottom: 0, left: "14px", width: "2px", background: "var(--border-subtle)" }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        {timelineEvents.filter(e => timelineFilter === "All" || e.typeTag === timelineFilter).map((update, idx) => {
                          const isMilestone = update.typeTag === "Milestone";
                          const tagColor = isMilestone ? "var(--gold)" : update.typeTag === "Issue" ? "#ef4444" : update.typeTag === "Success" ? "#22c55e" : "#3b82f6";
                          
                          return (
                            <motion.div key={update.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} style={{ position: "relative", paddingLeft: "3rem" }}>
                              <div style={{ position: "absolute", left: isMilestone ? "4px" : "8px", top: isMilestone ? "4px" : "6px", width: isMilestone ? "22px" : "14px", height: isMilestone ? "22px" : "14px", borderRadius: "50%", background: tagColor, border: "4px solid rgba(8,12,22,1)", zIndex: 1, boxShadow: isMilestone ? `0 0 10px ${tagColor}` : "none" }} />
                              
                              <div style={{ background: "rgba(8,12,22,0.5)", border: `1px solid ${isMilestone ? 'var(--gold)' : 'var(--border-subtle)'}`, borderRadius: "10px", padding: "1.2rem", position: "relative" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ color: tagColor, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{update.date}</span>
                                    <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: `${tagColor}22`, color: tagColor, fontWeight: 600 }}>{update.typeTag}</span>
                                  </div>

                                  {timelineEventToDelete === update.id ? (
                                    <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Sure?</span>
                                      <button onClick={() => handleDeleteTimelineEvent(update.id)} style={{ background: "#ef4444", border: "none", color: "white", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Yes</button>
                                      <button onClick={() => setTimelineEventToDelete(null)} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>No</button>
                                    </div>
                                  ) : canDeleteTimeline ? (
                                    <button onClick={() => setTimelineEventToDelete(update.id)} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "4px", padding: "0.1rem 0.3rem", fontSize: "0.65rem", cursor: "pointer" }}>🗑</button>
                                  ) : null}
                                </div>
                                <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: isMilestone ? "var(--gold-light)" : "white" }}>{update.title}</h4>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>{update.description}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* DISCUSSION */}
            {!routeSection && activeTab === "discussion" && (
              <motion.div key="discussion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ProjectDiscussion
                  projectId={id}
                  SectionHeading={SectionHeading}
                  discMessages={discMessages}
                  canPinMessage={canPinMessage}
                  handleTogglePin={handleTogglePin}
                  renderDiscussionText={renderDiscussionText}
                  discLoading={discLoading}
                  canDeleteAnyMsg={canDeleteAnyMsg}
                  setReplyingTo={setReplyingTo}
                  formatTimeAgo={formatTimeAgo}
                  handleDeleteDiscussion={handleDeleteDiscussion}
                  replyingTo={replyingTo}
                  discInput={discInput}
                  setDiscInput={setDiscInput}
                  handleSendDiscussion={handleSendDiscussion}
                />
              </motion.div>
            )}
            {false && activeTab === "discussion" && (
              <motion.div key="discussion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
                  <SectionHeading icon="💬" title="Discussion Panel" />
                  
                  {/* Pinned Messages Area */}
                  {discMessages.filter(m => m.isPinned).length > 0 && (
                    <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px" }}>
                      <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>📌</span> Pinned Messages
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                        {discMessages.filter(m => m.isPinned).map(msg => (
                          <div key={`pin-${msg.id}`} style={{ display: "flex", gap: "0.75rem", background: "rgba(0,0,0,0.2)", padding: "0.8rem", borderRadius: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: "0.6rem", flexShrink: 0 }}>{msg.authorAvatar}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gold-light)" }}>{msg.authorName}</span>
                                {canPinMessage && <button onClick={() => handleTogglePin(msg.id, msg.isPinned)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.7rem", padding: 0 }}>Unpin</button>}
                              </div>
                              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{renderDiscussionText(msg.text)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main Feed */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", marginBottom: "1.5rem", maxHeight: "400px", overflowY: "auto", paddingRight: "0.5rem", scrollbarWidth: "thin" }}>
                    {discLoading ? (
                      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading discussion...</div>
                    ) : discMessages.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "3rem 0", opacity: 0.5 }}>
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💭</div>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      discMessages.filter(m => !m.replyToId).map(msg => (
                        <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {/* Parent Message */}
                          <div style={{ display: "flex", gap: "0.75rem" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--gold-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0 }}>{msg.authorAvatar}</div>
                            <div style={{ flex: 1, background: "rgba(8,12,22,0.5)", border: "1px solid var(--border-subtle)", borderRadius: "0 10px 10px 10px", padding: "0.8rem", position: "relative" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--gold-light)" }}>{msg.authorName}</span>
                                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{formatTimeAgo(msg.createdAt)}</span>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                  <button onClick={() => setReplyingTo({ id: msg.id, name: msg.authorName })} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.7rem", cursor: "pointer", padding: "0" }}>↩ Reply</button>
                                  {canPinMessage && <button onClick={() => handleTogglePin(msg.id, msg.isPinned)} style={{ background: "none", border: "none", color: msg.isPinned ? "var(--gold)" : "var(--text-muted)", fontSize: "0.7rem", cursor: "pointer", padding: "0" }}>📌</button>}
                                  {canDeleteAnyMsg && <button onClick={() => handleDeleteDiscussion(msg.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.7rem", cursor: "pointer", padding: "0", opacity: 0.7 }}>🗑</button>}
                                </div>
                              </div>
                              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>{renderDiscussionText(msg.text)}</p>
                            </div>
                          </div>

                          {/* Replies */}
                          {discMessages.filter(r => r.replyToId === msg.id).length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingLeft: "2.5rem", position: "relative" }}>
                              <div style={{ position: "absolute", left: "15px", top: "-10px", bottom: "20px", width: "2px", background: "var(--border-subtle)" }} />
                              {discMessages.filter(r => r.replyToId === msg.id).map(reply => (
                                <div key={reply.id} style={{ display: "flex", gap: "0.5rem", position: "relative" }}>
                                  <div style={{ position: "absolute", left: "-1.5rem", top: "12px", width: "1rem", height: "2px", background: "var(--border-subtle)" }} />
                                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: "0.6rem", flexShrink: 0 }}>{reply.authorAvatar}</div>
                                  <div style={{ flex: 1, background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "0 8px 8px 8px", padding: "0.6rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.3rem" }}>
                                       <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gold-light)", opacity: 0.9 }}>{reply.authorName}</span>
                                        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{formatTimeAgo(reply.createdAt)}</span>
                                      </div>
                                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                        {canPinMessage && <button onClick={() => handleTogglePin(reply.id, reply.isPinned)} style={{ background: "none", border: "none", color: reply.isPinned ? "var(--gold)" : "var(--text-muted)", fontSize: "0.65rem", cursor: "pointer", padding: "0" }}>📌</button>}
                                        {canDeleteAnyMsg && <button onClick={() => handleDeleteDiscussion(reply.id)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.65rem", cursor: "pointer", padding: "0", opacity: 0.7 }}>🗑</button>}
                                      </div>
                                    </div>
                                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0, whiteSpace: "pre-wrap" }}>{renderDiscussionText(reply.text)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input Block */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {replyingTo && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(201,168,76,0.1)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.8rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Replying to <strong style={{ color: "var(--gold-light)" }}>{replyingTo.name}</strong></span>
                        <button onClick={() => setReplyingTo(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.7rem", padding: "0" }}>✕ Cancel</button>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <input value={discInput} onChange={e => setDiscInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && discInput.trim()) handleSendDiscussion(); }}
                        placeholder={replyingTo ? "Write a reply... (Enter to send)" : "Write a message... Use @user, #topic, /action, $file"}
                        style={{ flex: 1, padding: "0.75rem 1rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.85rem", outline: "none" }}
                      />
                      <button onClick={handleSendDiscussion} className="btn-primary" style={{ padding: "0.75rem 1.2rem", fontSize: "0.8rem" }}>Send</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {routeSection === "tasks" && (
            <ProjectTasks
              projectId={id}
              isViewer={isViewer}
              myTasksFilter={myTasksFilter}
              setMyTasksFilter={setMyTasksFilter}
              isReadOnly={isReadOnly}
              tasksLoading={tasksLoading}
              KANBAN_COLS={KANBAN_COLS}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              tasksInCol={tasksInCol}
              KanbanCard={KanbanCard}
              setSelectedTask={setSelectedTask}
              handleDragStart={handleDragStart}
              addingInCol={addingInCol}
              setAddingInCol={setAddingInCol}
              newTaskTitle={newTaskTitle}
              setNewTaskTitle={setNewTaskTitle}
              handleAddTask={handleAddTask}
              canCreateTask={canCreateTask}
              showFullPageLink
            />
          )}
          {routeSection === "files" && (
            <ProjectFiles
              projectId={id}
              handleDrag={handleDrag}
              dragActive={dragActive}
              handleDropFiles={handleDropFiles}
              currentFolderId={currentFolderId}
              setCurrentFolderId={setCurrentFolderId}
              fileSearch={fileSearch}
              setFileSearch={setFileSearch}
              fileInputRef={fileInputRef}
              handleFileInputChange={handleFileInputChange}
              isViewer={isViewer}
              canUploadFiles={canUploadFiles}
              isReadOnly={isReadOnly}
              handleCreateFolder={handleCreateFolder}
              filesLoading={filesLoading}
              displayFiles={displayFiles}
              getBreadcrumbs={getBreadcrumbs}
              tasks={tasks}
              attachingFileId={attachingFileId}
              setAttachingFileId={setAttachingFileId}
              handleAttachToTask={handleAttachToTask}
              renamingFileId={renamingFileId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              handleRenameFile={handleRenameFile}
              renameSaving={renameSaving}
              setRenamingFileId={setRenamingFileId}
              setFileToDeleteId={setFileToDeleteId}
              fileToDeleteId={fileToDeleteId}
              handleDeleteFile={handleDeleteFile}
              canDeleteAnyFile={canDeleteAnyFile}
              startRenamingFile={startRenamingFile}
              canDeleteOwnFile={canDeleteOwnFile}
              showFullPageLink
            />
          )}
          {routeSection === "documentation" && (
            <ProjectDocumentation
              projectId={id}
              userName={userName}
              projectPerms={projectPerms}
              canDeleteAnyFile={canDeleteAnyFile}
              tasks={tasks}
              loadTasks={loadTasks}
              showFullPageLink
            />
          )}
          {routeSection === "timeline" && (
            <ProjectTimeline
              projectId={id}
              SectionHeading={SectionHeading}
              canAddTimeline={canAddTimeline}
              addingTimelineEvent={addingTimelineEvent}
              setAddingTimelineEvent={setAddingTimelineEvent}
              newTimelineForm={newTimelineForm}
              setNewTimelineForm={setNewTimelineForm}
              handleAddTimelineEvent={handleAddTimelineEvent}
              timelineFilter={timelineFilter}
              setTimelineFilter={setTimelineFilter}
              timelineLoading={timelineLoading}
              timelineEvents={timelineEvents}
              canDeleteTimeline={canDeleteTimeline}
              timelineEventToDelete={timelineEventToDelete}
              setTimelineEventToDelete={setTimelineEventToDelete}
              handleDeleteTimelineEvent={handleDeleteTimelineEvent}
              showFullPageLink
            />
          )}
          {routeSection === "discussion" && (
            <ProjectDiscussion
              projectId={id}
              SectionHeading={SectionHeading}
              discMessages={discMessages}
              canPinMessage={canPinMessage}
              handleTogglePin={handleTogglePin}
              renderDiscussionText={renderDiscussionText}
              discLoading={discLoading}
              canDeleteAnyMsg={canDeleteAnyMsg}
              setReplyingTo={setReplyingTo}
              formatTimeAgo={formatTimeAgo}
              handleDeleteDiscussion={handleDeleteDiscussion}
              replyingTo={replyingTo}
              discInput={discInput}
              setDiscInput={setDiscInput}
              handleSendDiscussion={handleSendDiscussion}
              showFullPageLink
            />
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "sticky", top: "5rem" }}>

          {/* Role Badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.9rem", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-subtle)", borderRadius: "8px", fontSize: "0.72rem" }}>
            <span style={{ color: "var(--text-muted)" }}>Your Role</span>
            <span style={{
              fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "4px",
              background: userRole === "Admin" ? "rgba(239,68,68,0.15)" : userRole === "Lead" ? "rgba(201,168,76,0.15)" : userRole === "Core Committee" ? "rgba(168,85,247,0.15)" : "rgba(59,130,246,0.15)",
              color: userRole === "Admin" ? "#ef4444" : userRole === "Lead" ? "var(--gold)" : userRole === "Core Committee" ? "#a855f7" : "#3b82f6",
            }}>
              {userRole === "Admin" ? "⚙ Admin" : userRole === "Lead" ? "🎯 Lead" : userRole === "Core Committee" ? "🔭 Core Committee" : "👤 Member"}
            </span>
          </div>

          {/* Project Insights */}
          <AnimatedSection>
            <div style={{ background: "rgba(15,22,40,0.5)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", marginBottom: "1.2rem" }}>Project Insights</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { label: "Total Tasks", value: totalTasks, icon: "📊", color: "var(--text-primary)" },
                  { label: "Completed", value: completedTasks, icon: "✅", color: "#22c55e" },
                  { label: "Pending", value: pendingTasks, icon: "⏳", color: "#f59e0b" },
                ].map(stat => (
                  <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.8rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>{stat.icon} {stat.label}</span>
                    <span style={{ fontWeight: 700, color: stat.color, fontSize: "1rem" }}>{stat.value}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "0.25rem", paddingTop: "0.75rem" }}>
                  <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Completion</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${autoProgress}%` }} transition={{ duration: 1, delay: 0.3 }}
                        style={{ height: "100%", background: "linear-gradient(90deg, var(--gold-dark), var(--gold))", borderRadius: "2px" }} />
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold-light)" }}>{autoProgress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Team Contribution */}
          <AnimatedSection delay={0.1}>
            <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", marginBottom: "1.2rem" }}>Team Contribution</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {teamMembers.map((member, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--gold-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0 }}>
                      {member.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.82rem", margin: 0, fontWeight: 500 }}>{member.name}</p>
                      <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{member.role}</p>
                    </div>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: idx === 0 ? "#22c55e" : "#4a5a73" }} />
                  </div>
                ))}
                {teamMembers.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No team members listed.</p>}
              </div>
            </div>
          </AnimatedSection>

          {/* Upcoming Deadlines */}
          <AnimatedSection delay={0.15}>
            <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", marginBottom: "1.2rem" }}>Upcoming Deadlines</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.6rem 0.8rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px" }}>
                  <span>🗓</span>
                  <div>
                    <p style={{ fontSize: "0.8rem", margin: 0 }}>Project End</p>
                    <p style={{ fontSize: "0.7rem", color: "#ef4444", margin: 0 }}>{deadline}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.6rem 0.8rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px" }}>
                  <span>🚀</span>
                  <div>
                    <p style={{ fontSize: "0.8rem", margin: 0 }}>Next Milestone</p>
                    <p style={{ fontSize: "0.7rem", color: "#f59e0b", margin: 0 }}>{nextMilestone}</p>
                  </div>
                </div>
                {tasks.filter(t => t.deadline && t.status !== "done").slice(0, 2).map(t => (
                  <div key={t.id} style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.6rem 0.8rem", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "8px" }}>
                    <span>📋</span>
                    <div style={{ overflow: "hidden" }}>
                      <p style={{ fontSize: "0.78rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</p>
                      <p style={{ fontSize: "0.7rem", color: "#3b82f6", margin: 0 }}>{t.deadline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* GitHub Link */}
          {proj.githubUrl && (
            <AnimatedSection delay={0.2}>
              <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1rem 1.5rem", color: "var(--text-secondary)", transition: "all 0.2s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"; (e.currentTarget as HTMLElement).style.color = "var(--gold-light)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" /></svg>
                <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>View on GitHub</span>
              </a>
            </AnimatedSection>
          )}

          {/* Recent Activity Feed */}
          <AnimatedSection delay={0.25}>
            <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", marginBottom: "1.2rem" }}>Recent Activity</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "350px", overflowY: "auto", paddingRight: "0.5rem" }}>
                {activityLoading ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>Loading...</p>
                ) : activityFeed.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>No activity recorded yet.</p>
                ) : (
                  activityFeed.map((act) => {
                    const iconColor = 
                      act.entityType === "task" ? "#3b82f6" : 
                      act.entityType === "file" ? "#f59e0b" : 
                      act.entityType === "timeline" ? "#22c55e" : 
                      "#a855f7"; // comment/discussion

                    const isHelp = act.action === "requested_help";
                    const itemStyle = isHelp ? { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", padding: "0.75rem", borderRadius: "8px" } : {};

                    return (
                      <div key={act.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", ...itemStyle }}>
                        <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: isHelp ? "#ef4444" : "var(--gold-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: "0.6rem", flexShrink: 0 }}>
                          {isHelp ? "!" : act.actorName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: "0.8rem", margin: "0 0 0.2rem" }}>
                            <strong style={{ color: isHelp ? "#ef4444" : "var(--gold-light)" }}>{act.actorName}</strong>{" "}
                            <span style={{ color: isHelp ? "#fca5a5" : "var(--text-secondary)" }}>{getActionLabel(act.action)}</span>
                          </p>
                          {act.entityTitle && (
                            <p style={{ fontSize: "0.75rem", margin: 0, color: "var(--text-muted)", borderLeft: `2px solid ${isHelp ? "#ef4444" : iconColor}66`, paddingLeft: "0.5rem" }}>
                              {act.entityTitle}
                            </p>
                          )}
                          <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                            {formatTimeAgo(act.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* ── TASK DETAILS MODAL ── */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          teamMembers={proj.team || []}
          userName={userName}
          userRole={userRole}
          canEditFull={canEditTaskFull}
          canAssign={canEditTaskFull}
          canDelete={canDeleteTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          onMarkComplete={handleMarkComplete}
          onMarkBlocked={handleMarkBlocked}
          onDelete={handleDeleteTask}
          onAddComment={handleAddComment}
          onRequestHelp={handleRequestHelp}
        />
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
