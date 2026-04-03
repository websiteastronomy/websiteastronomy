"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  ProjectTask, TaskStatus, TaskPriority, TaskComment, TaskAssignee
} from "@/app/actions/tasks";

interface TaskModalProps {
  task: ProjectTask | null;
  teamMembers: { name: string; role: string }[];
  userName: string;
  userRole: string; // "Admin" | "Lead" | "Core Committee" | "Member" | "External"
  canEditFull?: boolean;   // can edit title/desc/priority/deadline
  canAssign?: boolean;     // can assign task to others
  canDelete?: boolean;     // can delete the task
  onClose: () => void;
  onSave: (taskId: string, data: Partial<ProjectTask>) => void;
  onMarkComplete: (taskId: string) => void;
  onMarkBlocked: (taskId: string, blocked: boolean) => void;
  onDelete: (taskId: string) => void;
  onAddComment: (taskId: string, comment: Omit<TaskComment, "id">) => void;
  onRequestHelp: (taskId: string) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "todo", label: "To Do", color: "#6b7280" },
  { value: "inProgress", label: "In Progress", color: "#f59e0b" },
  { value: "review", label: "Review", color: "#3b82f6" },
  { value: "done", label: "Done", color: "#22c55e" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "high", label: "High", color: "#ef4444" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low", label: "Low", color: "#6b7280" },
];

const fieldStyle: React.CSSProperties = {
  width: "100%", padding: "0.7rem 1rem",
  background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)",
  borderRadius: "8px", color: "var(--text-primary)", fontFamily: "inherit",
  fontSize: "0.85rem", outline: "none",
};

export default function TaskModal({
  task, teamMembers, userName, userRole, canEditFull, canAssign, canDelete, onClose, onSave, onMarkComplete, onMarkBlocked, onDelete, onAddComment, onRequestHelp
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [deadline, setDeadline] = useState("");
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setDeadline(task.deadline || "");
    setAssignees(task.assignees || []);
    setIsBlocked(task.isBlocked);
  }, [task]);

  if (!task) return null;

  const isViewer = userRole === "Viewer" || userRole === "External";
  // Use explicit prop overrides when provided, otherwise fall back to role-based defaults
  const canEdit   = canEditFull  ?? (userRole === "Admin" || userRole === "Lead");
  const canAssignTask = canAssign ?? (userRole === "Admin" || userRole === "Lead");
  const canDeleteTask = canDelete ?? (userRole === "Admin" || userRole === "Lead");

  const handleSave = () => {
    if (!canEdit) return;
    onSave(task.id, { title, description, status, priority, deadline, assignees });
  };

  const toggleAssignee = (name: string) => {
    setAssignees(prev =>
      prev.some(a => a.name === name)
        ? prev.filter(a => a.name !== name)
        : [...prev, { name }]
    );
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onAddComment(task.id, { author: userName, text: commentText, time: new Date().toISOString() });
    setCommentText("");
  };

  const comments = task.comments || [];
  const attachments = task.attachments || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: "linear-gradient(145deg, rgba(15,22,40,0.98), rgba(8,12,22,0.99))",
            border: "1px solid var(--border-subtle)", borderRadius: "16px",
            width: "100%", maxWidth: "680px", maxHeight: "85vh", overflowY: "auto",
            padding: "2rem", color: "var(--text-primary)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div style={{ flex: 1 }}>
              <input
              value={title} onChange={e => setTitle(e.target.value)}
                disabled={!canEdit}
                style={{ ...fieldStyle, fontSize: "1.2rem", fontWeight: 600, background: "transparent", border: "1px solid transparent", padding: "0.3rem 0.5rem", borderRadius: "6px" }}
                onFocus={e => !isViewer && (e.target.style.borderColor = "var(--gold)")}
                onBlur={e => (e.target.style.borderColor = "transparent")}
              />
              {isBlocked && (
                <span style={{ display: "inline-block", marginTop: "0.5rem", marginLeft: "0.5rem", background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>
                  🚫 Blocked
                </span>
              )}
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.3rem", lineHeight: 1 }}>✕</button>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Add a description..."
              disabled={!canEdit}
              style={{ ...fieldStyle, resize: "vertical" }}
            />
          </div>

          {/* Status & Priority Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={labelStyle}>Status</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => !isViewer && setStatus(opt.value)} disabled={isViewer} style={{
                    padding: "0.35rem 0.7rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600, cursor: isViewer ? "not-allowed" : "pointer", border: "1px solid", transition: "all 0.15s",
                    background: status === opt.value ? opt.color + "22" : "transparent",
                    borderColor: status === opt.value ? opt.color : "var(--border-subtle)",
                    color: status === opt.value ? opt.color : "var(--text-muted)",
                    opacity: isViewer && status !== opt.value ? 0.5 : 1,
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {PRIORITY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => canEdit && setPriority(opt.value)} disabled={!canEdit} style={{
                    padding: "0.35rem 0.7rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600, cursor: !canEdit ? "not-allowed" : "pointer", border: "1px solid", transition: "all 0.15s",
                    background: priority === opt.value ? opt.color + "22" : "transparent",
                    borderColor: priority === opt.value ? opt.color : "var(--border-subtle)",
                    color: priority === opt.value ? opt.color : "var(--text-muted)",
                    opacity: !canEdit && priority !== opt.value ? 0.5 : 1,
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Deadline</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} disabled={!canEdit} style={{ ...fieldStyle, maxWidth: "220px", colorScheme: "dark" }} />
          </div>

          {/* Assigned Members — only Lead/Admin can assign */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Assigned Members</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {teamMembers.map((m: any) => {
                const assignedObj = assignees.find(a => a.name === m.name);
                const selected = !!assignedObj;
                const a = assignedObj || m;
                return (
                  <button key={m.name} onClick={() => canAssignTask && toggleAssignee(m.name)} disabled={!canAssignTask} style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.35rem 0.7rem", borderRadius: "20px", fontSize: "0.75rem", cursor: !canAssignTask ? "default" : "pointer", border: "1px solid", transition: "all 0.15s",
                    background: selected ? "rgba(201,168,76,0.15)" : "transparent",
                    borderColor: selected ? "var(--gold)" : "var(--border-subtle)",
                    color: selected ? "var(--gold-light)" : "var(--text-muted)",
                    opacity: !canAssignTask && !selected ? 0.5 : 1,
                  }}>
                    <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: selected ? "var(--gold)" : "var(--border-subtle)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "#000", fontWeight: 700, overflow: "hidden" }}>
                      {a.image ? (
                        <img src={a.image} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        a.name.charAt(0)
                      )}
                    </span>
                    {m.name}
                    {selected && " ✓"}
                  </button>
                );
              })}
              {teamMembers.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No team members available.</p>}
            </div>
          </div>

          {/* Attachments */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Attachments</label>
            {attachments.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No files attached.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {attachments.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.4rem 0.7rem", fontSize: "0.75rem" }}>
                    📎 {a.name}
                  </div>
                ))}
              </div>
            )}
            {!isViewer && canEdit && (
              <button style={{ marginTop: "0.5rem", background: "rgba(201,168,76,0.1)", border: "1px dashed var(--gold)", color: "var(--gold)", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit" }}>
                + Attach File
              </button>
            )}
          </div>

          {/* Comments Thread */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Comments ({comments.length})</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "0.8rem", maxHeight: "200px", overflowY: "auto" }}>
              {comments.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No comments yet.</p>}
              {comments.map((c: TaskComment) => (
                <div key={c.id} style={{ display: "flex", gap: "0.6rem", padding: "0.6rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--gold-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "#000", fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                    {c.authorImage ? (
                      <img src={c.authorImage} alt={c.author} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      c.author.charAt(0)
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gold-light)" }}>{c.author}</span>
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{c.time}</span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddComment()}
                placeholder="Write a comment..."
                style={{ ...fieldStyle, flex: 1 }}
              />
              <button onClick={handleAddComment} style={{ background: "var(--gold)", color: "#000", border: "none", borderRadius: "8px", padding: "0 1rem", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
                Post
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.2rem", marginTop: "1rem" }}>
            {/* Save / status actions available to all authenticated users except External */}
            {!isViewer && (
              <>
                {canEdit && (
                  <button onClick={handleSave} className="btn-primary" style={{ padding: "0.6rem 1.2rem", fontSize: "0.8rem" }}>
                    💾 Save Changes
                  </button>
                )}
                <button onClick={() => onMarkComplete(task.id)} style={{
                  padding: "0.6rem 1.2rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, border: "1px solid #22c55e", background: "rgba(34,197,94,0.1)", color: "#22c55e",
                }}>
                  ✅ Mark Complete
                </button>
                {canEdit && (
                  <button onClick={() => onMarkBlocked(task.id, !isBlocked)} style={{
                    padding: "0.6rem 1.2rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                    border: isBlocked ? "1px solid #f59e0b" : "1px solid #ef4444",
                    background: isBlocked ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                    color: isBlocked ? "#f59e0b" : "#ef4444",
                  }}>
                    {isBlocked ? "🔓 Unblock" : "🚫 Mark Blocked"}
                  </button>
                )}
                <button onClick={() => { 
                  onRequestHelp(task.id);
                  onClose();
                }} style={{
                  padding: "0.6rem 1.2rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, border: "1px solid #dc2626", background: "#ef4444", color: "#fff",
                }}>
                  🚨 Request Help
                </button>
              </>
            )}
            
            {canDeleteTask && (
              <button onClick={() => { if (confirm("Delete this task?")) onDelete(task.id); }} style={{
                marginLeft: "auto", padding: "0.6rem 1.2rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444",
              }}>
                🗑 Delete
              </button>
            )}
            {isViewer && (
             <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", paddingTop: "0.5rem" }}>
               Read-only mode
             </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", textTransform: "uppercase",
  letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600,
};
