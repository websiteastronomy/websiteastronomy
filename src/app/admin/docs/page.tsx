"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const DocumentationManager = dynamic(() => import("@/app/admin/components/DocumentationManager"));

export default function AdminDocsPage() {
  return (
    <AdminRouteSection>
      <DocumentationManager />
    </AdminRouteSection>
  );
}
