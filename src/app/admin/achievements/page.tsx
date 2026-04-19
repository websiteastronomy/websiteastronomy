"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const AchievementsManager = dynamic(() => import("@/app/admin/components/AchievementsManager"));

export default function AdminAchievementsPage() {
  return (
    <AdminRouteSection>
      <AchievementsManager />
    </AdminRouteSection>
  );
}
