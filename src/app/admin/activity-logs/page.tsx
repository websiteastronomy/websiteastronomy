"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const ActivityLogsManager = dynamic(() => import("@/app/admin/components/ActivityLogsManager"));

export default function AdminActivityLogsPage() {
  return (
    <AdminRouteSection>
      <ActivityLogsManager />
    </AdminRouteSection>
  );
}
