"use client";

import Link from "next/link";

export default function ProjectTasks({
  projectId,
  isViewer,
  myTasksFilter,
  setMyTasksFilter,
  isReadOnly,
  tasksLoading,
  KANBAN_COLS,
  handleDragOver,
  handleDrop,
  tasksInCol,
  KanbanCard,
  setSelectedTask,
  handleDragStart,
  addingInCol,
  setAddingInCol,
  newTaskTitle,
  setNewTaskTitle,
  handleAddTask,
  canCreateTask,
  showFullPageLink = false,
}: any) {
  return (
    <div style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.1rem" }}>📋</span>
          <h2 style={{ fontSize: "1.1rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.04em", color: "var(--gold-light)" }}>Task Board</h2>
          {showFullPageLink ? (
            <Link href={`/projects/${projectId}`} style={{ color: "var(--gold)", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
              Open full page →
            </Link>
          ) : null}
        </div>
        {!isViewer && (
          <div style={{ display: "flex", gap: "0.3rem", background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "0.2rem" }}>
            <button onClick={() => setMyTasksFilter(false)} style={{ padding: "0.35rem 0.75rem", borderRadius: "6px", border: "none", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", background: !myTasksFilter ? "rgba(201,168,76,0.2)" : "transparent", color: !myTasksFilter ? "var(--gold-light)" : "var(--text-muted)" }}>All Tasks</button>
            <button onClick={() => setMyTasksFilter(true)} style={{ padding: "0.35rem 0.75rem", borderRadius: "6px", border: "none", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", background: myTasksFilter ? "rgba(201,168,76,0.2)" : "transparent", color: myTasksFilter ? "var(--gold-light)" : "var(--text-muted)" }}>My Tasks</button>
          </div>
        )}
        {isReadOnly && (
          <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.6rem", borderRadius: "4px", background: "rgba(59,130,246,0.12)", color: "#3b82f6", fontWeight: 600, border: "1px solid rgba(59,130,246,0.2)" }}>👁 Read-only</span>
        )}
      </div>
      {tasksLoading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading tasks...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {KANBAN_COLS.map((col: any) => (
            <div
              key={col.key}
              onDragOver={(!isViewer && !isReadOnly) ? handleDragOver : undefined}
              onDrop={(!isViewer && !isReadOnly) ? (e: any) => handleDrop(e, col.key) : undefined}
              style={{ minHeight: "120px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: col.color }}>{col.label}</span>
                <span style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-muted)", borderRadius: "10px", padding: "0.1rem 0.5rem", fontSize: "0.65rem" }}>
                  {tasksInCol(col.key).length}
                </span>
              </div>

              <div style={{ minHeight: "80px", background: "rgba(0,0,0,0.15)", borderRadius: "8px", padding: "0.5rem", border: `1px dashed ${col.color}33`, transition: "border-color 0.2s" }}>
                {tasksInCol(col.key).map((task: any) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                    onDragStart={(!isViewer && !isReadOnly) ? (e: any) => handleDragStart(e, task.id) : undefined}
                  />
                ))}

                {addingInCol === col.key ? (
                  <div style={{ marginTop: "0.3rem" }}>
                    <input
                      autoFocus
                      value={newTaskTitle}
                      onChange={(e: any) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e: any) => {
                        if (e.key === "Enter") handleAddTask(col.key);
                        if (e.key === "Escape") {
                          setAddingInCol(null);
                          setNewTaskTitle("");
                        }
                      }}
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
                    <button
                      onClick={() => { setAddingInCol(col.key); setNewTaskTitle(""); }}
                      style={{ width: "100%", marginTop: "0.3rem", background: "transparent", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "6px", color: "var(--text-muted)", padding: "0.4rem", fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                      onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = col.color; e.currentTarget.style.color = col.color; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                    >
                      + Add Task
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
