"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const SystemSettingsManager = dynamic(() => import("@/app/admin/components/SystemSettingsManager"));

export default function AdminStoragePage() {
  return (
    <AdminRouteSection>
      <SystemSettingsManager />
    </AdminRouteSection>
  );
}
