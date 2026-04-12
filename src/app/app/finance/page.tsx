import DeprecationBanner from "@/components/DeprecationBanner";
import DashboardFinancePage from "@/app/dashboard/finance/page";

export default function AppFinancePage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/finance" newPath="/admin?tab=finance" />
      <DashboardFinancePage />
    </>
  );
}
