"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const AnnouncementsManager = dynamic(() => import("@/app/admin/components/AnnouncementsManager"));

export default function AdminAnnouncementsPage() {
  return (
    <AdminRouteSection>
      <AnnouncementsManager />
    </AdminRouteSection>
  );
}
