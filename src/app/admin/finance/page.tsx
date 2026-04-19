"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const FinanceControlManager = dynamic(() => import("@/app/admin/components/FinanceControlManager"));

export default function AdminFinancePage() {
  return (
    <AdminRouteSection>
      <FinanceControlManager />
    </AdminRouteSection>
  );
}
