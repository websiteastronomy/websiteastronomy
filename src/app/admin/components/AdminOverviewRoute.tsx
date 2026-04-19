"use client";

import { useRouter } from "next/navigation";
import OverviewManager from "./OverviewManager";
import { getAdminHref, type AdminRouteId } from "@/app/admin/admin-config";

export default function AdminOverviewRoute() {
  const router = useRouter();

  return <OverviewManager onNavigate={(routeId: string) => router.push(getAdminHref(routeId as AdminRouteId))} />;
}
