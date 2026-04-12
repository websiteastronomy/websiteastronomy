import DeprecationBanner from "@/components/DeprecationBanner";
import DashboardEventsPage from "@/app/dashboard/events/page";

export default function AppEventsPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/events" newPath="/admin?tab=events" />
      <DashboardEventsPage />
    </>
  );
}
