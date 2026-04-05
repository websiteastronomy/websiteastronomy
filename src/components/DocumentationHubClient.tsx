"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { attachFileToTaskAction, type ProjectTask } from "@/app/actions/tasks";
import {
  createDocAction,
  createDocumentationFolderAction,
  createFormAction,
  deleteDocumentationItemAction,
  getDocContentAction,
  getDocumentationItemAction,
  getFormContentAction,
  getFormResponsesAction,
  getGlobalDocumentationItemsAction,
  getProjectFilesAction,
  getResourcePermissionsAction,
  renameDocumentationItemAction,
  searchResourcesAction,
  updateResourcePermissionsAction,
  updateDocContentAction,
  updateFormContentAction,
  uploadDocumentationFileEntryAction,
  uploadProjectFileAction,
  type FormContent,
  type ProjectFile,
  type ResourceRole,
} from "@/app/actions/files";
import { uploadDocumentationBinaryAction, uploadFile } from "@/app/actions/storage";
import { formatDateStable } from "@/lib/format-date";
import { FormQuestionsEditor, FormResponsesPanel, FormSettingsPanel } from "@/components/FormBuilderPanels";

type Scope = { projectId?: string | null; isGlobal?: boolean };
type QuestionType = "short_answer" | "paragraph" | "multiple_choice" | "checkbox";
type FormQuestion = { id: string; label: string; type: QuestionType; required?: boolean; options?: string[] };
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

type Props = {
  scope: Scope;
  userName: string;
  canManage: boolean;
  canUpload: boolean;
  canDeleteAny: boolean;
  canDeleteOwn?: (uploadedBy: string) => boolean;
  tasks?: ProjectTask[];
  onTasksRefresh?: () => Promise<void> | void;
  title?: string;
  subtitle?: string;
};

const docContent = (title: string) => ({ title, body: "", blocks: [] });
const formContent = (title: string): FormContent => ({
  title,
  description: "",
  mode: "internal",
  status: "draft",
  fields: [] as FormQuestion[],
  questions: [] as FormQuestion[],
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
});

export default function DocumentationHubClient({
  scope,
  userName,
  canManage,
  canUpload,
  canDeleteAny,
  canDeleteOwn,
  tasks = [],
  onTasksRefresh,
  title = "Documentation",
  subtitle = "Files, docs, forms, and folders in one place.",
}: Props) {
  const isGlobal = scope.isGlobal ?? false;
  const projectId = scope.projectId ?? null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ProjectFile["type"]>("all");
  const [projectFilter, setProjectFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [searchResults, setSearchResults] = useState<ProjectFile[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchVersion, setSearchVersion] = useState(0);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [attachId, setAttachId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeDoc, setActiveDoc] = useState<ProjectFile | null>(null);
  const [docBody, setDocBody] = useState("");
  const [activeForm, setActiveForm] = useState<ProjectFile | null>(null);
  const [formDraft, setFormDraft] = useState<Record<string, unknown>>(formContent(""));
  const [formResponses, setFormResponses] = useState<Array<{ id: string; responses: Record<string, unknown> }>>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [accessItem, setAccessItem] = useState<ProjectFile | null>(null);
  const [accessDraft, setAccessDraft] = useState<Array<{ role: ResourceRole; canView: boolean; canEdit: boolean }>>([
    { role: "admin", canView: true, canEdit: true },
    { role: "core", canView: true, canEdit: false },
    { role: "crew", canView: false, canEdit: false },
  ]);
  const [accessInheritedFromId, setAccessInheritedFromId] = useState<string | null>(null);

  const canDeleteItem = useCallback((item: ProjectFile) => {
    if (canDeleteAny) return true;
    if (canDeleteOwn) return canDeleteOwn(item.uploadedBy);
    return false;
  }, [canDeleteAny, canDeleteOwn]);

  const roleLabel = (role: ResourceRole) => role.charAt(0).toUpperCase() + role.slice(1);

  const accessSummary = (item: ProjectFile) => {
    const visibleTo = (item.visibleTo || []).map((role) => roleLabel(role as ResourceRole));
    const editableBy = (item.editableBy || []).map((role) => roleLabel(role as ResourceRole));
    return {
      label: item.hasCustomAccess ? "Restricted" : "Inherited",
      visible: visibleTo.length ? `Visible to: ${visibleTo.join(", ")}` : "Visible to: default access",
      editable: editableBy.length ? `Editable by: ${editableBy.join(", ")}` : "Editable by: default access",
    };
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = isGlobal
        ? await getGlobalDocumentationItemsAction()
        : await getProjectFilesAction(projectId as string);
      setItems(data);
      setSearchVersion((current) => current + 1);
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: "Failed to load documentation items." });
    } finally {
      setLoading(false);
    }
  }, [isGlobal, projectId]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const hasActiveSearchFilters = Boolean(
    search.trim() ||
    typeFilter !== "all" ||
    (isGlobal && projectFilter.trim()) ||
    fromDateFilter ||
    toDateFilter
  );

  useEffect(() => {
    if (!hasActiveSearchFilters) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const rows = await searchResourcesAction(search, {
          type: typeFilter,
          projectId: isGlobal ? (projectFilter.trim() || null) : projectId,
          fromDate: fromDateFilter || null,
          toDate: toDateFilter || null,
        });
        setSearchResults(rows);
      } catch (error: any) {
        console.error(error);
        setFeedback({ type: "error", message: error?.message || "Search failed." });
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [fromDateFilter, hasActiveSearchFilters, isGlobal, projectFilter, projectId, search, searchVersion, toDateFilter, typeFilter]);

  const breadcrumbs = useMemo(() => {
    const out: ProjectFile[] = [];
    let cursor = items.find((entry) => entry.id === currentFolderId) || null;
    while (cursor) {
      out.unshift(cursor);
      cursor = items.find((entry) => entry.id === cursor?.parentId) || null;
    }
    return out;
  }, [currentFolderId, items]);

  const displayItems = useMemo(() => {
    const source = searchResults ?? items;
    return searchResults
      ? source
      : source.filter((entry) => entry.parentId === currentFolderId);
  }, [currentFolderId, items, searchResults]);

  const untitledFolderName = () => {
    const siblingNames = new Set(
      items.filter((entry) => entry.parentId === currentFolderId).map((entry) => entry.name.toLowerCase())
    );
    const base = "Untitled folder";
    if (!siblingNames.has(base.toLowerCase())) return base;
    let i = 2;
    while (siblingNames.has(`${base} ${i}`.toLowerCase())) i += 1;
    return `${base} ${i}`;
  };

  const uploadPayload = (file: File, result: { fileUrl: string; fileId: string; fileName: string }) => ({
    name: result.fileName,
    parentId: currentFolderId,
    fileSize: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${(file.size / 1024).toFixed(2)} KB`,
    mimeType: file.type || "application/octet-stream",
    uploadedBy: userName,
    url: result.fileUrl,
    fileId: result.fileId,
  });

  const uploadItems = async (selectedFiles: File[]) => {
    setLoading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        if (isGlobal) {
          const result = await uploadDocumentationBinaryAction(formData, { isGlobal: true });
          await uploadDocumentationFileEntryAction({
            projectId: null,
            isGlobal: true,
            ...uploadPayload(file, result),
          });
        } else {
          const result = await uploadFile(formData, "projects", projectId as string, false);
          await uploadProjectFileAction(projectId as string, uploadPayload(file, result));
        }
      }
      setFeedback({ type: "success", message: `${selectedFiles.length} item(s) uploaded.` });
      await loadItems();
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Upload failed." });
      setLoading(false);
    }
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canUpload) return;
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (!canUpload || !event.dataTransfer.files?.length) return;
    await uploadItems(Array.from(event.dataTransfer.files));
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    await uploadItems(Array.from(event.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createFolder = async () => {
    if (!canManage) return;
    setLoading(true);
    try {
      const folder = await createDocumentationFolderAction(projectId, untitledFolderName(), currentFolderId, {
        isGlobal,
        uploadedBy: userName,
      });
      setRenamingId(folder.id);
      setRenameValue(folder.name);
      await loadItems();
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to create folder." });
      setLoading(false);
    }
  };

  const createDoc = async () => {
    if (!canManage) return;
    setLoading(true);
    try {
      const item = await createDocAction(projectId, currentFolderId, "Untitled doc", {
        isGlobal,
        uploadedBy: userName,
      });
      await loadItems();
      await openItem(item.id);
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to create doc." });
      setLoading(false);
    }
  };

  const createForm = async () => {
    if (!canManage) return;
    setLoading(true);
    try {
      const item = await createFormAction(projectId, currentFolderId, "Untitled form", {
        isGlobal,
        uploadedBy: userName,
      });
      await loadItems();
      await openItem(item.id);
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to create form." });
      setLoading(false);
    }
  };

  const renameItem = async (itemId: string) => {
    const nextName = renameValue.trim();
    if (!nextName) return;
    setLoading(true);
    try {
      await renameDocumentationItemAction(itemId, nextName, userName);
      setRenamingId(null);
      setRenameValue("");
      await loadItems();
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Rename failed." });
      setLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    setLoading(true);
    try {
      await deleteDocumentationItemAction(itemId);
      setDeleteId(null);
      setActiveDoc(null);
      setActiveForm(null);
      await loadItems();
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Delete failed." });
      setLoading(false);
    }
  };

  const openItem = async (itemId: string) => {
    try {
      const item = await getDocumentationItemAction(itemId);
      if (item.type === "folder") {
        setCurrentFolderId(item.id);
        return;
      }
      if (item.type === "file") {
        if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
        return;
      }
      if (item.type === "doc") {
        setModalLoading(true);
        const content = await getDocContentAction(item.id);
        setActiveDoc(item);
        setDocBody(String((content as any)?.body || ""));
        setModalLoading(false);
        return;
      }
      if (item.type === "form") {
        const canEditForm = canManage || item.uploadedBy === userName;
        if (!canEditForm) {
          window.open(`/forms/${item.id}`, "_blank", "noopener,noreferrer");
          return;
        }
        setModalLoading(true);
        const [content, responses] = await Promise.all([
          getFormContentAction(item.id),
          getFormResponsesAction(item.id).catch(() => []),
        ]);
        setActiveForm(item);
        setFormDraft((content as Record<string, unknown>) || formContent(item.name));
        setFormResponses((responses as any[]) || []);
        setModalLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to open item." });
      setModalLoading(false);
    }
  };

  const openAccessManager = async (item: ProjectFile) => {
    setModalLoading(true);
    try {
      const config = await getResourcePermissionsAction(item.id);
      const baseRoles: ResourceRole[] = ["admin", "core", "crew"];
      setAccessDraft(
        baseRoles.map((role) => {
          const match = config.roles.find((entry) => entry.role === role);
          return {
            role,
            canView: match?.canView ?? false,
            canEdit: match?.canEdit ?? false,
          };
        })
      );
      setAccessInheritedFromId(config.inheritedFromId);
      setAccessItem(item);
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to load access rules." });
    } finally {
      setModalLoading(false);
    }
  };

  const saveAccessManager = async () => {
    if (!accessItem) return;
    setModalLoading(true);
    try {
      await updateResourcePermissionsAction(accessItem.id, accessDraft);
      setFeedback({ type: "success", message: "Access rules updated." });
      setAccessItem(null);
      setAccessInheritedFromId(null);
      await loadItems();
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to update access rules." });
    } finally {
      setModalLoading(false);
    }
  };

  const saveDoc = async () => {
    if (!activeDoc || !canManage) return;
    setModalLoading(true);
    try {
      await updateDocContentAction(activeDoc.id, {
        ...(activeDoc.content || docContent(activeDoc.name)),
        title: activeDoc.name,
        body: docBody,
        blocks: docBody.split("\n").filter(Boolean).map((text) => ({ type: "paragraph", text })),
      });
      setFeedback({ type: "success", message: "Doc saved." });
      await loadItems();
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to save doc." });
    } finally {
      setModalLoading(false);
    }
  };

  const saveForm = async () => {
    if (!activeForm || !(canManage || activeForm.uploadedBy === userName)) return;
    setModalLoading(true);
    try {
      await updateFormContentAction(activeForm.id, formDraft);
      setFeedback({ type: "success", message: "Form saved." });
      const responses = await getFormResponsesAction(activeForm.id).catch(() => []);
      setFormResponses((responses as any[]) || []);
      await loadItems();
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to save form." });
    } finally {
      setModalLoading(false);
    }
  };

  const attachToTask = async (itemId: string, taskId: string) => {
    setAttachId(null);
    try {
      await attachFileToTaskAction(taskId, itemId);
      await onTasksRefresh?.();
      setFeedback({ type: "success", message: "File attached to task." });
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to attach file." });
    }
  };

  return (
    <div onDragEnter={handleDrag} style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem", position: "relative" }}>
      {dragActive && canUpload ? (
        <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} style={{ position: "absolute", inset: 0, background: "rgba(34,197,94,0.1)", border: "2px dashed #22c55e", borderRadius: "12px", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e", fontSize: "1.15rem", fontWeight: 600 }}>
          Drop files here to upload
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span>📁</span>
            <h2 style={{ fontSize: "1.1rem", fontFamily: "'Cinzel', serif", color: "var(--gold-light)", margin: 0 }}>{title}</h2>
            <span style={{ color: "var(--border-subtle)", fontSize: "0.8rem" }}>/</span>
            <button onClick={() => setCurrentFolderId(null)} style={{ background: "transparent", border: "none", color: currentFolderId ? "var(--text-secondary)" : "var(--gold)", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Root</button>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ color: "var(--border-subtle)", fontSize: "0.8rem" }}>/</span>
                <button onClick={() => setCurrentFolderId(crumb.id)} style={{ background: "transparent", border: "none", color: index === breadcrumbs.length - 1 ? "var(--gold)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>{crumb.name}</button>
              </div>
            ))}
          </div>
          <p style={{ margin: "0.45rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>{subtitle}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "flex-end" }}>
          <input placeholder="Search docs, files, uploader, project..." value={search} onChange={(event) => setSearch(event.target.value)} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.35rem 0.6rem", color: "white", fontSize: "0.75rem", outline: "none", minWidth: "220px" }} />
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | ProjectFile["type"])} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.35rem 0.6rem", color: "white", fontSize: "0.75rem", outline: "none" }}>
            <option value="all">All Types</option>
            <option value="file">Files</option>
            <option value="folder">Folders</option>
            <option value="doc">Docs</option>
            <option value="form">Forms</option>
            <option value="sheet">Sheets</option>
          </select>
          {isGlobal ? (
            <input placeholder="Project ID" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.35rem 0.6rem", color: "white", fontSize: "0.75rem", outline: "none", minWidth: "120px" }} />
          ) : null}
          <input type="date" value={fromDateFilter} onChange={(event) => setFromDateFilter(event.target.value)} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.35rem 0.6rem", color: "white", fontSize: "0.75rem", outline: "none" }} />
          <input type="date" value={toDateFilter} onChange={(event) => setToDateFilter(event.target.value)} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.35rem 0.6rem", color: "white", fontSize: "0.75rem", outline: "none" }} />
          {hasActiveSearchFilters ? (
            <button onClick={() => { setSearch(""); setTypeFilter("all"); setProjectFilter(""); setFromDateFilter(""); setToDateFilter(""); setSearchResults(null); }} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
              Clear
            </button>
          ) : null}
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileInputChange} />
          {canUpload ? <button onClick={() => fileInputRef.current?.click()} style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>Upload File</button> : null}
          {canManage ? (
            <>
              <button onClick={createFolder} style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>New Folder</button>
              <button onClick={createDoc} style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>New Doc</button>
              <button onClick={createForm} style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>New Form</button>
            </>
          ) : null}
        </div>
      </div>
      {feedback ? <div style={{ marginBottom: "1rem", padding: "0.8rem 0.95rem", borderRadius: "8px", border: feedback.type === "success" ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)", background: feedback.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: feedback.type === "success" ? "#86efac" : "#fca5a5", fontSize: "0.8rem" }}>{feedback.message}</div> : null}

      {searchLoading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Searching resources...</div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading items...</div>
      ) : displayItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px dashed var(--border-subtle)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📚</div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>{hasActiveSearchFilters ? "No matching resources found." : "Nothing in this folder yet."}</p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", opacity: 0.7 }}>{hasActiveSearchFilters ? "Try adjusting the search query or filters." : "Use the actions above to add files, docs, forms, or folders."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {hasActiveSearchFilters ? (
            <div style={{ marginBottom: "0.75rem", color: "var(--text-muted)", fontSize: "0.76rem" }}>
              Showing {displayItems.length} matching resource{displayItems.length === 1 ? "" : "s"} across accessible documentation.
            </div>
          ) : null}
          <div style={{ display: "flex", padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "0.4rem", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600 }}>
            <div style={{ flex: 2 }}>Name</div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>Type</div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>Updated</div>
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", paddingRight: "1rem" }}>Actions</div>
          </div>
          {displayItems.map((item) => {
            const icon = item.type === "folder" ? "📁" : item.type === "doc" ? "📝" : item.type === "form" ? "📋" : item.type === "sheet" ? "📊" : "📄";
            return (
              <motion.div key={item.id} whileHover={{ background: "rgba(255,255,255,0.04)" }} onClick={() => void openItem(item.id)} style={{ display: "flex", alignItems: "center", padding: "0.75rem", borderRadius: "8px", cursor: "pointer", borderBottom: "1px solid var(--border-subtle)", transition: "background 0.2s" }}>
                <div style={{ flex: 2, display: "flex", alignItems: "center", gap: "0.8rem", overflow: "hidden" }}>
                  <span style={{ fontSize: "1.15rem" }}>{icon}</span>
                  <div style={{ overflow: "hidden" }}>
                    {renamingId === item.id ? (
                      <div onClick={(event) => event.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void renameItem(item.id); if (event.key === "Escape") { setRenamingId(null); setRenameValue(""); } }} style={{ width: "100%", minWidth: "220px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--gold)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none" }} />
                        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>Press Enter to save or Esc to cancel</p>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: "0.85rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: item.type === "folder" ? "var(--gold-light)" : "var(--text-primary)" }}>{item.name}</p>
                        <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap" }}>
                          <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>{item.uploadedBy || "Unknown"}</p>
                          <span style={{ fontSize: "0.62rem", padding: "0.14rem 0.4rem", borderRadius: "999px", background: item.hasCustomAccess ? "rgba(239,68,68,0.14)" : "rgba(59,130,246,0.12)", color: item.hasCustomAccess ? "#fca5a5" : "#93c5fd" }}>{accessSummary(item).label}</span>
                          {item.projectId || item.isGlobal ? (
                            <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                              {item.isGlobal ? "Global Hub" : item.projectTitle || item.projectId}
                            </span>
                          ) : null}
                        </div>
                        <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", margin: "0.15rem 0 0" }}>{accessSummary(item).visible}</p>
                        <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", margin: "0.1rem 0 0" }}>{accessSummary(item).editable}</p>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center", fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>{item.type}</div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{formatDateStable(item.updatedAt)}</div>
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: "0.4rem", flexWrap: "wrap" }}>
                  {item.type === "file" && tasks.length > 0 ? (
                    <div style={{ position: "relative" }}>
                      <button onClick={(event) => { event.stopPropagation(); setAttachId(attachId === item.id ? null : item.id); }} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Attach</button>
                      {attachId === item.id ? (
                        <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "4px", background: "rgba(15,22,40,0.95)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0.5rem", width: "220px", zIndex: 50, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
                          <p style={{ fontSize: "0.7rem", color: "var(--gold)", margin: "0 0 0.5rem 0", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: "0.3rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Attach to Task</p>
                          <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            {tasks.filter((task) => task.status !== "done").map((task) => (
                              <button key={task.id} onClick={(event) => { event.stopPropagation(); void attachToTask(item.id, task.id); }} style={{ textAlign: "left", background: "transparent", border: "none", color: "var(--text-secondary)", padding: "0.4rem 0.5rem", fontSize: "0.75rem", borderRadius: "4px", cursor: "pointer" }}>{task.title}</button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {renamingId === item.id ? (
                    <>
                      <button onClick={(event) => { event.stopPropagation(); void renameItem(item.id); }} style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Save</button>
                      <button onClick={(event) => { event.stopPropagation(); setRenamingId(null); setRenameValue(""); }} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {canManage ? <button onClick={(event) => { event.stopPropagation(); void openAccessManager(item); }} style={{ background: "transparent", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Access</button> : null}
                      {canManage ? <button onClick={(event) => { event.stopPropagation(); setRenamingId(item.id); setRenameValue(item.name); }} style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Rename</button> : null}
                      {canDeleteItem(item) ? (
                        deleteId === item.id ? (
                          <>
                            <button onClick={(event) => { event.stopPropagation(); void deleteItem(item.id); }} style={{ background: "#ef4444", border: "none", color: "white", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Confirm</button>
                            <button onClick={(event) => { event.stopPropagation(); setDeleteId(null); }} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Cancel</button>
                          </>
                        ) : <button onClick={(event) => { event.stopPropagation(); setDeleteId(item.id); }} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Delete</button>
                      ) : null}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      {(activeDoc || activeForm) ? (
        <div onClick={() => { setActiveDoc(null); setActiveForm(null); }} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div onClick={(event) => event.stopPropagation()} style={{ background: "linear-gradient(145deg, rgba(15,22,40,0.98), rgba(8,12,22,0.99))", border: "1px solid var(--border-subtle)", borderRadius: "16px", width: "100%", maxWidth: "840px", maxHeight: "85vh", overflowY: "auto", padding: "1.75rem", color: "var(--text-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--gold-light)" }}>{activeDoc?.name || activeForm?.name}</h3>
                <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>{activeDoc ? "Document editor" : canManage ? "Form builder" : "Form response"}</p>
              </div>
              <button onClick={() => { setActiveDoc(null); setActiveForm(null); }} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.3rem" }}>×</button>
            </div>
            {modalLoading ? (
              <div style={{ padding: "2rem 0", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
            ) : activeDoc ? (
              <>
                <textarea value={docBody} onChange={(event) => setDocBody(event.target.value)} disabled={!canManage} placeholder="Write your documentation here..." style={{ width: "100%", minHeight: "380px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "1rem", color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.9rem", resize: "vertical", outline: "none", opacity: canManage ? 1 : 0.85 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Stored as JSON content, without R2.</span>
                  {canManage ? <button onClick={() => void saveDoc()} className="btn-primary" style={{ fontSize: "0.8rem" }}>Save Doc</button> : null}
                </div>
              </>
            ) : activeForm ? (
              <>
                {(() => {
                  const canEditForm = canManage || activeForm.uploadedBy === userName;
                  const settings = ((formDraft.settings as FormSettings | undefined) || formContent(activeForm.name).settings) as FormSettings;
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                          <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "rgba(201,168,76,0.12)", color: "var(--gold)", fontSize: "0.75rem", textTransform: "capitalize" }}>{String(formDraft.mode || "internal")}</span>
                          <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: formDraft.status === "published" ? "rgba(34,197,94,0.12)" : "rgba(251,191,36,0.12)", color: formDraft.status === "published" ? "#86efac" : "#fbbf24", fontSize: "0.75rem", textTransform: "capitalize" }}>{String(formDraft.status || "draft")}</span>
                          {settings.paymentEnabled ? <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "rgba(34,197,94,0.12)", color: "#86efac", fontSize: "0.75rem" }}>Payment ready: Rs. {settings.amount}</span> : null}
                        </div>
                        <a href={`/forms/${activeForm.id}`} target="_blank" rel="noreferrer" style={{ color: "#93c5fd", textDecoration: "none", fontSize: "0.82rem" }}>Open fill page</a>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: canEditForm ? "minmax(0, 1.7fr) minmax(280px, 1fr)" : "1fr", gap: "1rem" }}>
                        <div style={{ display: "grid", gap: "0.9rem" }}>
                          <FormQuestionsEditor formName={activeForm.name} formDraft={formDraft} canEdit={canEditForm} onChange={setFormDraft} />
                          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
                            <h4 style={{ margin: "0 0 0.6rem", fontSize: "0.9rem", color: "var(--gold-light)" }}>Responses</h4>
                            <FormResponsesPanel responses={formResponses as any} />
                          </div>
                        </div>
                        {canEditForm ? (
                          <FormSettingsPanel formId={activeForm.id} formDraft={formDraft} canEdit={canEditForm} onChange={setFormDraft} />
                        ) : null}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{canEditForm ? "Forms live inside documentation and open publicly via the share link." : "Open the public form page to submit a response."}</span>
                        {canEditForm ? <button onClick={() => void saveForm()} className="btn-primary" style={{ fontSize: "0.8rem" }}>Save Form</button> : <a href={`/forms/${activeForm.id}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ fontSize: "0.8rem" }}>Open Form</a>}
                      </div>
                    </>
                  );
                })()}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      {accessItem ? (
        <div onClick={() => { setAccessItem(null); setAccessInheritedFromId(null); }} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div onClick={(event) => event.stopPropagation()} style={{ background: "linear-gradient(145deg, rgba(15,22,40,0.98), rgba(8,12,22,0.99))", border: "1px solid var(--border-subtle)", borderRadius: "16px", width: "100%", maxWidth: "780px", maxHeight: "85vh", overflowY: "auto", padding: "1.75rem", color: "var(--text-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--gold-light)" }}>{accessItem.name}</h3>
                <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>Manage Access</p>
              </div>
              <button onClick={() => { setAccessItem(null); setAccessInheritedFromId(null); }} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.3rem" }}>x</button>
            </div>
            {modalLoading ? (
              <div style={{ padding: "2rem 0", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ padding: "0.95rem 1rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", background: "rgba(15,22,40,0.35)" }}>
                  <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>If not set, access is inherited from parent folder.</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {accessInheritedFromId ? "Inherited from parent folder until you save custom rules here." : "No parent rule found. Role-based access remains the fallback."}
                  </div>
                </div>
                <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1rem", background: "rgba(0,0,0,0.18)" }}>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--gold-light)" }}>Roles</h4>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {accessDraft.map((entry) => (
                      <div key={entry.role} style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: "0.75rem", alignItems: "center", padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.03)" }}>
                        <div>
                          <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{roleLabel(entry.role)}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{entry.role === "admin" ? "Full-control role" : entry.role === "core" ? "Core committee role" : "Crew/member role"}</div>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                          <input type="checkbox" checked={entry.canView} onChange={(event) => setAccessDraft((current) => current.map((item) => item.role === entry.role ? { ...item, canView: event.target.checked, canEdit: !event.target.checked ? false : item.canEdit } : item))} />
                          View
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                          <input type="checkbox" checked={entry.canEdit} onChange={(event) => setAccessDraft((current) => current.map((item) => item.role === entry.role ? { ...item, canEdit: event.target.checked, canView: event.target.checked ? true : item.canView } : item))} />
                          Edit
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1rem", background: "rgba(0,0,0,0.18)" }}>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--gold-light)" }}>Summary</h4>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                    <div>Visible to: {accessDraft.filter((entry) => entry.canView).map((entry) => roleLabel(entry.role)).join(", ") || "Inherited / default"}</div>
                    <div>Editable by: {accessDraft.filter((entry) => entry.canEdit).map((entry) => roleLabel(entry.role)).join(", ") || "Inherited / default"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Use this modal for advanced access control without cluttering the main file view.</span>
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button onClick={() => { setAccessItem(null); setAccessInheritedFromId(null); }} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "8px", padding: "0.55rem 0.85rem", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    <button onClick={() => void saveAccessManager()} className="btn-primary" style={{ fontSize: "0.8rem" }}>Save Access</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
