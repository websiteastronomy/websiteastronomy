"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const SettingsManager = dynamic(() => import("@/app/admin/components/SettingsManager"));

export default function AdminSiteSettingsPage() {
  return (
    <AdminRouteSection>
      <SettingsManager />
    </AdminRouteSection>
  );
}
