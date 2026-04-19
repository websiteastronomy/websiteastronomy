"use client";
import DeprecationBanner from "@/components/DeprecationBanner";
import SystemControlManager from "@/app/admin/components/SystemControlManager";

export default function AppSystemControlPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/system-control" newPath="/admin/system-control" />
      <SystemControlManager />
    </>
  );
}
