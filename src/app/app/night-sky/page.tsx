import DeprecationBanner from "@/components/DeprecationBanner";
import DashboardNightSkyPage from "@/app/dashboard/night-sky/page";

export default function AppNightSkyPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/night-sky" newPath="/admin?tab=night-sky" />
      <DashboardNightSkyPage />
    </>
  );
}
