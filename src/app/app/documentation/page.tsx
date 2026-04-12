import DeprecationBanner from "@/components/DeprecationBanner";
import DashboardDocumentationPage from "@/app/dashboard/documentation/page";

export default function AppDocumentationPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/documentation" newPath="/admin?tab=documentation" />
      <DashboardDocumentationPage />
    </>
  );
}
