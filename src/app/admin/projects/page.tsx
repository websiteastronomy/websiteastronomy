"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const ProjectsManager = dynamic(() => import("@/app/admin/components/ProjectsManager"));

export default function AdminProjectsPage() {
  return (
    <AdminRouteSection>
      <ProjectsManager />
    </AdminRouteSection>
  );
}
