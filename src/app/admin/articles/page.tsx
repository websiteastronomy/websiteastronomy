"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const ArticlesManager = dynamic(() => import("@/app/admin/components/ArticlesManager"));

export default function AdminArticlesPage() {
  return (
    <AdminRouteSection>
      <ArticlesManager />
    </AdminRouteSection>
  );
}
