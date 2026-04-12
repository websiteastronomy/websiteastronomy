import DeprecationBanner from "@/components/DeprecationBanner";
import DashboardOutreachPage from "@/app/dashboard/outreach/page";

export default function AppOutreachPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/outreach" newPath="/admin?tab=outreach" />
      <DashboardOutreachPage />
    </>
  );
}
