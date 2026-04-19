import DeprecationBanner from "@/components/DeprecationBanner";
import DashboardFormsPage from "@/app/dashboard/forms/page";

export default function AppFormsPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/forms" newPath="/admin/docs" />
      <DashboardFormsPage />
    </>
  );
}
