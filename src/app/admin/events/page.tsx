"use client";

import dynamic from "next/dynamic";

const AdminRouteSection = dynamic(() => import("@/app/admin/components/AdminRouteSection"));
const EventsManager = dynamic(() => import("@/app/admin/components/EventsManager"));

export default function AdminEventsPage() {
  return (
    <AdminRouteSection>
      <EventsManager />
    </AdminRouteSection>
  );
}
