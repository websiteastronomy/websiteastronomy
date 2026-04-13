"use client";

import { usePathname } from "next/navigation";
import SystemRestrictionPage from "./SystemRestrictionPage";
import { getFeatureDisplayName, getRestrictedFeatureForPath, isMaintenanceActive } from "@/lib/system-control";

export default function SystemRestrictionWrapper({
  children,
  systemControl,
  user,
  isAdmin,
}: {
  children: React.ReactNode;
  systemControl: any | null;
  user: any | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname() || "/";

  const isMaintenance = systemControl ? isMaintenanceActive(systemControl) : false;
  const isLockdown = Boolean(systemControl?.lockdownEnabled);
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute =
    pathname.startsWith("/portal") ||
    pathname.startsWith("/app") ||
    pathname.startsWith("/dashboard") ||
    isAdminRoute;
  const restrictedFeature = systemControl ? getRestrictedFeatureForPath(pathname, systemControl) : null;

  if (systemControl) {
    if (isLockdown && !isAdmin && !pathname.startsWith("/portal")) {
      return (
        <SystemRestrictionPage variant="lockdown" title="🔒 System Temporarily Restricted" message={systemControl.lockdownReason} />
      );
    }

    if (isMaintenance && !user && !isAuthRoute) {
      return (
        <SystemRestrictionPage
          variant="maintenance"
          title="🚧 Under Maintenance"
          message={systemControl.maintenanceReason}
          until={systemControl.maintenanceUntil}
        />
      );
    }

    if (restrictedFeature && !isAdmin && !isAdminRoute) {
      return (
        <SystemRestrictionPage
          variant="feature"
          title={`${getFeatureDisplayName(restrictedFeature)} Unavailable`}
          message={`${getFeatureDisplayName(restrictedFeature)} is currently disabled by the system administrator.`}
        />
      );
    }
  }

  return <>{children}</>;
}
