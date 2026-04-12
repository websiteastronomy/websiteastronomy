"use client";
import DeprecationBanner from "@/components/DeprecationBanner";
import SystemSettingsManager from "@/app/admin/components/SystemSettingsManager";

export default function AppStoragePage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/storage" newPath="/admin?tab=storage" />
      <SystemSettingsManager />
    </>
  );
}
