"use client";

import Link from "next/link";
import DocumentationHubClient from "@/components/DocumentationHubClient";

export default function ProjectDocumentation({
  projectId,
  userName,
  projectPerms,
  canDeleteAnyFile,
  tasks,
  loadTasks,
  showFullPageLink = false,
}: any) {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {showFullPageLink ? (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link href={`/projects/${projectId}`} style={{ color: "var(--gold)", fontSize: "0.75rem" }}>
            Open full page →
          </Link>
        </div>
      ) : null}
      <DocumentationHubClient
        scope={{ projectId, isGlobal: false }}
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
    </div>
  );
}
