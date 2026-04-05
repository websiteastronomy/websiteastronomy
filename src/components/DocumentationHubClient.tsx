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
  renameDocumentationItemAction,
  submitFormResponseAction,
  updateDocContentAction,
  updateFormContentAction,
  uploadDocumentationFileEntryAction,
  uploadProjectFileAction,
  type FormContent,
  type ProjectFile,
} from "@/app/actions/files";
import { uploadDocumentationBinaryAction, uploadFile } from "@/app/actions/storage";
import { formatDateStable } from "@/lib/format-date";

type Scope = { projectId?: string | null; isGlobal?: boolean };
type QuestionType = "short_answer" | "paragraph" | "multiple_choice" | "checkbox";
type FormQuestion = { id: string; label: string; type: QuestionType; required?: boolean; options?: string[] };
type FormSettings = {
  allowMultiple: boolean;
  requireLogin: boolean;
  collectEmail: boolean;
  paymentEnabled: boolean;
  amount: number;
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
  fields: [] as FormQuestion[],
  questions: [] as FormQuestion[],
  settings: {
    allowMultiple: false,
    requireLogin: false,
    collectEmail: true,
    paymentEnabled: false,
    amount: 0,
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
  const [responseDraft, setResponseDraft] = useState<Record<string, unknown>>({});
  const [modalLoading, setModalLoading] = useState(false);

  const canDeleteItem = useCallback((item: ProjectFile) => {
    if (canDeleteAny) return true;
    if (canDeleteOwn) return canDeleteOwn(item.uploadedBy);
    return false;
  }, [canDeleteAny, canDeleteOwn]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = isGlobal
        ? await getGlobalDocumentationItemsAction()
        : await getProjectFilesAction(projectId as string);
      setItems(data);
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
    return items
      .filter((entry) => entry.parentId === currentFolderId)
      .filter((entry) => entry.name.toLowerCase().includes(search.toLowerCase()));
  }, [currentFolderId, items, search]);

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
        setResponseDraft({});
        setModalLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to open item." });
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

  const submitForm = async () => {
    if (!activeForm || (canManage || activeForm.uploadedBy === userName)) return;
    setModalLoading(true);
    try {
      await submitFormResponseAction(activeForm.id, { answers: responseDraft });
      setFeedback({ type: "success", message: "Form submitted." });
      setResponseDraft({});
    } catch (error: any) {
      console.error(error);
      setFeedback({ type: "error", message: error?.message || "Failed to submit form." });
    } finally {
      setModalLoading(false);
    }
  };

  const addQuestion = () => {
    const current = ((formDraft.questions as FormQuestion[]) || []).slice();
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
    current.push({ id, label: "Untitled question", type: "short_answer", required: false, options: [] });
    setFormDraft((value) => ({ ...value, questions: current, fields: current }));
  };

  const updateQuestion = (questionId: string, patch: Partial<FormQuestion>) => {
    const current = ((formDraft.questions as FormQuestion[]) || []).map((question) =>
      question.id === questionId ? { ...question, ...patch } : question
    );
    setFormDraft((value) => ({ ...value, questions: current, fields: current }));
  };

  const removeQuestion = (questionId: string) => {
    const current = ((formDraft.questions as FormQuestion[]) || []).filter((question) => question.id !== questionId);
    setFormDraft((value) => ({ ...value, questions: current, fields: current }));
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
          <input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.35rem 0.6rem", color: "white", fontSize: "0.75rem", outline: "none", minWidth: "140px" }} />
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

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading items...</div>
      ) : displayItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px dashed var(--border-subtle)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📚</div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>Nothing in this folder yet.</p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", opacity: 0.7 }}>Use the actions above to add files, docs, forms, or folders.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
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
                        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>{item.uploadedBy || "Unknown"}</p>
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
                  const questions = ((formDraft.questions as FormQuestion[]) || []) as FormQuestion[];
                  const settings = ((formDraft.settings as FormSettings | undefined) || formContent(activeForm.name).settings) as FormSettings;
                  const selectedResponse = formResponses[0] as any;
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                          <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "rgba(201,168,76,0.12)", color: "var(--gold)", fontSize: "0.75rem", textTransform: "capitalize" }}>{String(formDraft.mode || "internal")}</span>
                          {settings.paymentEnabled ? <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", background: "rgba(34,197,94,0.12)", color: "#86efac", fontSize: "0.75rem" }}>Payment ready: Rs. {settings.amount}</span> : null}
                        </div>
                        <a href={`/forms/${activeForm.id}`} target="_blank" rel="noreferrer" style={{ color: "#93c5fd", textDecoration: "none", fontSize: "0.82rem" }}>Open fill page</a>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: canEditForm ? "minmax(0, 1.7fr) minmax(280px, 1fr)" : "1fr", gap: "1rem" }}>
                        <div style={{ display: "grid", gap: "0.9rem" }}>
                          <input value={String(formDraft.title || activeForm.name)} onChange={(event) => setFormDraft((value) => ({ ...value, title: event.target.value }))} disabled={!canEditForm} placeholder="Form title" style={{ padding: "0.7rem 0.9rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                          <textarea value={String(formDraft.description || "")} onChange={(event) => setFormDraft((value) => ({ ...value, description: event.target.value }))} disabled={!canEditForm} placeholder="Form description" style={{ minHeight: "90px", padding: "0.7rem 0.9rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical" }} />
                          {questions.map((question, index) => (
                            <div key={question.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "0.9rem", background: "rgba(0,0,0,0.18)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "center" }}>
                                <strong style={{ fontSize: "0.82rem" }}>Question {index + 1}</strong>
                                {canEditForm ? <button onClick={() => removeQuestion(question.id)} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "6px", padding: "0.25rem 0.55rem", fontSize: "0.72rem", cursor: "pointer" }}>Delete</button> : null}
                              </div>
                              <div style={{ display: "grid", gap: "0.6rem" }}>
                                <input value={question.label} onChange={(event) => updateQuestion(question.id, { label: event.target.value })} disabled={!canEditForm} placeholder="Question label" style={{ padding: "0.7rem 0.9rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                                {canEditForm ? (
                                  <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: "0.6rem" }}>
                                    <select value={question.type} onChange={(event) => updateQuestion(question.id, { type: event.target.value as QuestionType })} style={{ padding: "0.65rem 0.8rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit" }}>
                                      <option value="short_answer">Short answer</option>
                                      <option value="paragraph">Paragraph</option>
                                      <option value="multiple_choice">Multiple choice</option>
                                      <option value="checkbox">Checkbox</option>
                                    </select>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}><input type="checkbox" checked={Boolean(question.required)} onChange={(event) => updateQuestion(question.id, { required: event.target.checked })} />Required</label>
                                  </div>
                                ) : null}
                                {question.type === "multiple_choice" ? (
                                  <textarea value={(question.options || []).join("\n")} onChange={(event) => updateQuestion(question.id, { options: event.target.value.split("\n").map((option) => option.trim()).filter(Boolean) })} disabled={!canEditForm} placeholder="One option per line" style={{ minHeight: "80px", padding: "0.7rem 0.9rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                                ) : null}
                              </div>
                            </div>
                          ))}
                          {canEditForm ? <button onClick={addQuestion} style={{ justifySelf: "start", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "6px", padding: "0.45rem 0.85rem", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit" }}>Add Question</button> : null}
                          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
                            <h4 style={{ margin: "0 0 0.6rem", fontSize: "0.9rem", color: "var(--gold-light)" }}>Responses</h4>
                            {formResponses.length === 0 ? <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>No submissions yet.</p> : (
                              <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                                  <thead>
                                    <tr style={{ color: "var(--text-muted)", textAlign: "left" }}>
                                      <th style={{ padding: "0.5rem 0.4rem" }}>Name</th>
                                      <th style={{ padding: "0.5rem 0.4rem" }}>Email</th>
                                      <th style={{ padding: "0.5rem 0.4rem" }}>Date</th>
                                      <th style={{ padding: "0.5rem 0.4rem" }}>Payment</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {formResponses.map((response: any) => (
                                      <tr key={response.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                                        <td style={{ padding: "0.55rem 0.4rem" }}>{response.externalDetails?.name || "Member"}</td>
                                        <td style={{ padding: "0.55rem 0.4rem" }}>{response.externalDetails?.email || "Internal"}</td>
                                        <td style={{ padding: "0.55rem 0.4rem" }}>{formatDateStable(response.createdAt)}</td>
                                        <td style={{ padding: "0.55rem 0.4rem", textTransform: "capitalize" }}>{response.paymentStatus}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                        {canEditForm ? (
                          <div style={{ display: "grid", gap: "0.85rem", alignContent: "start" }}>
                            <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1rem", background: "rgba(0,0,0,0.18)" }}>
                              <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--gold-light)" }}>Settings</h4>
                              <div style={{ display: "grid", gap: "0.75rem" }}>
                                <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                                  Mode
                                  <select value={String(formDraft.mode || "internal")} onChange={(event) => setFormDraft((value) => ({ ...value, mode: event.target.value }))} style={{ padding: "0.7rem 0.8rem", background: "rgba(0,0,0,0.28)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "white" }}>
                                    <option value="internal">Internal</option>
                                    <option value="external">External</option>
                                    <option value="hybrid">Hybrid</option>
                                  </select>
                                </label>
                                {[
                                  ["allowMultiple", "Allow multiple responses"],
                                  ["requireLogin", "Require login"],
                                  ["collectEmail", "Collect email"],
                                  ["paymentEnabled", "Enable payment"],
                                  ["notifyOnSubmit", "Enable notifications"],
                                  ["announcementEnabled", "Send as announcement"],
                                  ["emailEnabled", "Send email notification"],
                                ].map(([key, label]) => (
                                  <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                                    <input type="checkbox" checked={Boolean(settings[key as keyof FormSettings])} onChange={(event) => setFormDraft((value) => ({ ...value, settings: { ...settings, [key]: event.target.checked } }))} />
                                    {label}
                                  </label>
                                ))}
                                <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                                  Amount
                                  <input type="number" min="0" value={settings.amount} onChange={(event) => setFormDraft((value) => ({ ...value, settings: { ...settings, amount: Number(event.target.value || 0) } }))} style={{ padding: "0.7rem 0.8rem", background: "rgba(0,0,0,0.28)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "white" }} />
                                </label>
                              </div>
                            </div>
                            <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1rem", background: "rgba(0,0,0,0.18)" }}>
                              <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--gold-light)" }}>Response Detail</h4>
                              {selectedResponse ? <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.76rem", color: "var(--text-secondary)" }}>{JSON.stringify(selectedResponse.answers, null, 2)}</pre> : <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Submit responses will appear here.</p>}
                            </div>
                          </div>
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
    </div>
  );
}
