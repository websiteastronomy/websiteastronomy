import DeprecationBanner from "@/components/DeprecationBanner";
import DashboardMembersPage from "@/app/dashboard/members/page";

export default function AppMembersPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/members" newPath="/admin?tab=members" />
      <DashboardMembersPage />
    </>
  );
}
