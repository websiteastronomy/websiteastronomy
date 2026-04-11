"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDateStable } from "@/lib/format-date";

export default function ProjectFiles(props: any) {
  const {
    projectId,
    handleDrag,
    dragActive,
    handleDropFiles,
    currentFolderId,
    setCurrentFolderId,
    fileSearch,
    setFileSearch,
    fileInputRef,
    handleFileInputChange,
    isViewer,
    canUploadFiles,
    isReadOnly,
    handleCreateFolder,
    filesLoading,
    displayFiles,
    getBreadcrumbs,
    tasks,
    attachingFileId,
    setAttachingFileId,
    handleAttachToTask,
    renamingFileId,
    renameValue,
    setRenameValue,
    handleRenameFile,
    renameSaving,
    setRenamingFileId,
    setFileToDeleteId,
    fileToDeleteId,
    handleDeleteFile,
    canDeleteAnyFile,
    startRenamingFile,
    canDeleteOwnFile,
    showFullPageLink = false,
  } = props;

  return (
    <div
      onDragEnter={handleDrag}
      style={{ background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem", position: "relative" }}
    >
      {dragActive && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDropFiles}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(34,197,94,0.1)", backdropFilter: "blur(2px)", border: "2px dashed #22c55e", borderRadius: "12px", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e", fontSize: "1.2rem", fontWeight: 600 }}
        >
          Drop files here to upload
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flex: 1 }}>
          <span>📁</span>
          <h2 style={{ fontSize: "1.1rem", fontFamily: "'Cinzel', serif", color: "var(--gold-light)", margin: 0, whiteSpace: "nowrap" }}>Files</h2>
          {showFullPageLink ? (
            <Link href={`/projects/${projectId}`} style={{ color: "var(--gold)", fontSize: "0.75rem" }}>
              Open full page →
            </Link>
          ) : null}
          <span style={{ color: "var(--border-subtle)", fontSize: "0.8rem" }}>/</span>

          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem" }}>
            <button onClick={() => setCurrentFolderId(null)} style={{ background: "transparent", border: "none", color: currentFolderId ? "var(--text-secondary)" : "var(--gold)", cursor: "pointer", fontFamily: "inherit" }}>Root</button>
            {getBreadcrumbs().map((crumb: any, idx: any) => (
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
          <input placeholder="Search..." value={fileSearch} onChange={e => setFileSearch(e.target.value)} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.35rem 0.6rem", color: "white", fontSize: "0.75rem", outline: "none" }} />
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileInputChange} disabled={isViewer} />
          {canUploadFiles && !isReadOnly && (
            <>
              <button onClick={() => fileInputRef.current?.click()} style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.3rem", whiteSpace: "nowrap" }}>⬆ Upload</button>
              <button onClick={handleCreateFolder} style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Create folder</button>
            </>
          )}
        </div>
      </div>

      {filesLoading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading files...</div>
      ) : displayFiles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px dashed var(--border-subtle)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📤</div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>No files found in this folder.</p>
          <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", opacity: 0.6 }}>Drag and drop files here, use Upload files, or create a folder and rename it later.</p>
          {canUploadFiles && !isReadOnly && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "6px", padding: "0.45rem 0.9rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>Upload files</button>
              <button onClick={handleCreateFolder} style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "6px", padding: "0.45rem 0.9rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>Create folder</button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", padding: "0.5rem 0.75rem", borderBottom: "1px solid var(--border-subtle)", margin: "0 0 0.5rem", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 600 }}>
            <div style={{ flex: 2 }}>Name</div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>Size</div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>Uploaded By</div>
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", paddingRight: "1rem" }}>Actions</div>
          </div>

          {displayFiles.map((file: any) => (
            <motion.div key={file.id} whileHover={{ background: "rgba(255,255,255,0.04)" }} onClick={() => file.type === "folder" && setCurrentFolderId(file.id)} style={{ display: "flex", alignItems: "center", padding: "0.75rem", borderRadius: "8px", cursor: file.type === "folder" ? "pointer" : "default", borderBottom: "1px solid var(--border-subtle)", transition: "background 0.2s" }}>
              <div style={{ flex: 2, display: "flex", alignItems: "center", gap: "0.8rem", overflow: "hidden" }}>
                <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{file.type === "folder" ? "📁" : "📄"}</span>
                <div style={{ overflow: "hidden" }}>
                  {renamingFileId === file.id ? (
                    <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRenameFile(file.id); if (e.key === "Escape") { setRenamingFileId(null); setRenameValue(""); } }} placeholder="Name" style={{ width: "100%", minWidth: "220px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--gold)", borderRadius: "6px", padding: "0.4rem 0.6rem", color: "white", fontSize: "0.8rem", outline: "none" }} />
                      <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>Press Enter to save or Esc to cancel</p>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: "0.85rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: file.type === "folder" ? "var(--gold-light)" : "var(--text-primary)" }}>{file.name}</p>
                      <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: 0 }}>{formatDateStable(file.updatedAt)}</p>
                    </>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", justifyContent: "center", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{file.fileSize || "—"}</div>
              <div style={{ flex: 1, display: "flex", justifyContent: "center", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{file.uploadedBy}</div>

              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                {file.type === "file" && renamingFileId !== file.id && (
                  <div style={{ position: "relative" }}>
                    <button onClick={(e) => { e.stopPropagation(); setAttachingFileId(attachingFileId === file.id ? null : file.id); }} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>📎 Attach</button>
                    {attachingFileId === file.id && (
                      <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "4px", background: "rgba(15,22,40,0.95)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0.5rem", width: "220px", zIndex: 50, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", backdropFilter: "blur(10px)" }}>
                        <p style={{ fontSize: "0.7rem", color: "var(--gold)", margin: "0 0 0.5rem 0", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: "0.3rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Attach to Task</p>
                        <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          {tasks.length === 0 ? (
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, padding: "0.5rem", textAlign: "center" }}>No open tasks.</p>
                          ) : (
                            tasks.filter((t: any) => t.status !== "done").map((task: any) => (
                              <button key={task.id} onClick={(e) => { e.stopPropagation(); handleAttachToTask(file.id, task.id); }} style={{ textAlign: "left", background: "transparent", border: "none", color: "var(--text-secondary)", padding: "0.4rem 0.5rem", fontSize: "0.75rem", borderRadius: "4px", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
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
                    <button onClick={(e) => { e.stopPropagation(); handleRenameFile(file.id); }} disabled={renameSaving} style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Save</button>
                    <button onClick={(e) => { e.stopPropagation(); setRenamingFileId(null); setRenameValue(""); }} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Cancel</button>
                  </>
                ) : fileToDeleteId === file.id ? (
                  <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Sure?</span>
                    <button onClick={(e) => handleDeleteFile(e, file.id)} style={{ background: "#ef4444", border: "none", color: "white", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Yes</button>
                    <button onClick={(e) => { e.stopPropagation(); setFileToDeleteId(null); }} style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>No</button>
                  </div>
                ) : (
                  !isViewer && !isReadOnly && (
                    <>
                      {canDeleteAnyFile && <button onClick={(e) => { e.stopPropagation(); startRenamingFile(file); }} style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer" }}>Rename</button>}
                      {canDeleteOwnFile(file.uploadedBy) && <button onClick={(e) => { e.stopPropagation(); setFileToDeleteId(file.id); }} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.65rem", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>🗑</button>}
                    </>
                  )
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
