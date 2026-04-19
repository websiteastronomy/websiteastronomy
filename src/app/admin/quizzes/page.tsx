"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const QuizzesManager = dynamic(() => import("@/app/admin/components/QuizzesManager"));

export default function AdminQuizzesPage() {
  return (
    <AdminRouteSection>
      <QuizzesManager />
    </AdminRouteSection>
  );
}
