"use client";

import { usePathname } from "next/navigation";
import SystemRestrictionPage from "./SystemRestrictionPage";
import { getFeatureDisplayName, getRestrictedFeatureForPath, isMaintenanceActive } from "@/lib/system-control";
import { useAuth } from "@/context/AuthContext";

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
  const { user: clientUser, isAdmin: clientIsAdmin } = useAuth();

  const isMaintenance = systemControl ? isMaintenanceActive(systemControl) : false;
  const isLockdown = Boolean(systemControl?.lockdownEnabled);
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login" || pathname.startsWith("/login?");
  const effectiveUser = user || clientUser;
  const effectiveIsAdmin = isAdmin || clientIsAdmin;
  const isAuthRoute =
    isLoginRoute ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/app") ||
    pathname.startsWith("/dashboard") ||
    isAdminRoute;
  const restrictedFeature = systemControl ? getRestrictedFeatureForPath(pathname, systemControl) : null;

  if (systemControl) {
    if (isLockdown && !effectiveIsAdmin && !isLoginRoute && !pathname.startsWith("/portal")) {
      return (
        <SystemRestrictionPage variant="lockdown" title="🔒 System Temporarily Restricted" message={systemControl.lockdownReason} />
      );
    }

    if (isMaintenance && !effectiveUser && !isAuthRoute) {
      return (
        <SystemRestrictionPage
          variant="maintenance"
          title="🚧 Under Maintenance"
          message={systemControl.maintenanceReason}
          until={systemControl.maintenanceUntil}
        />
      );
    }

    if (restrictedFeature && !effectiveIsAdmin && !isAdminRoute && !isLoginRoute) {
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
