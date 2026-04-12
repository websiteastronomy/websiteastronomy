import DeprecationBanner from "@/components/DeprecationBanner";
import DashboardAchievementsPage from "@/app/dashboard/achievements/page";

export default function AppAchievementsPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/achievements" newPath="/admin?tab=achievements" />
      <DashboardAchievementsPage />
    </>
  );
}
