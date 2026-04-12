import DeprecationBanner from "@/components/DeprecationBanner";
import DashboardObservationsPage from "@/app/dashboard/observations/page";

export default function AppObservationsPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/observations" newPath="/admin?tab=observations" />
      <DashboardObservationsPage />
    </>
  );
}
