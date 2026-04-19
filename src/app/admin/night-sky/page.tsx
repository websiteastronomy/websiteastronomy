"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const NightSkyManager = dynamic(() => import("@/app/admin/components/NightSkyManager"));

export default function AdminNightSkyPage() {
  return (
    <AdminRouteSection>
      <NightSkyManager />
    </AdminRouteSection>
  );
}
