"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const SystemControlManager = dynamic(() => import("@/app/admin/components/SystemControlManager"));

export default function AdminSystemControlPage() {
  return (
    <AdminRouteSection>
      <SystemControlManager />
    </AdminRouteSection>
  );
}
