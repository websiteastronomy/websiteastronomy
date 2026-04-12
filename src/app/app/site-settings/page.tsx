"use client";
import DeprecationBanner from "@/components/DeprecationBanner";
import SettingsManager from "@/app/admin/components/SettingsManager";

export default function AppSiteSettingsPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/site-settings" newPath="/admin?tab=site-settings" />
      <SettingsManager />
    </>
  );
}
