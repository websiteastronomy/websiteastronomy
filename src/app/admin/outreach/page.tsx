"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const OutreachManager = dynamic(() => import("@/app/admin/components/OutreachManager"));

export default function AdminOutreachPage() {
  return (
    <AdminRouteSection>
      <OutreachManager />
    </AdminRouteSection>
  );
}
