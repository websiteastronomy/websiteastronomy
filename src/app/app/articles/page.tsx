import DeprecationBanner from "@/components/DeprecationBanner";
import DashboardEducationPage from "@/app/dashboard/education/page";

export default function AppArticlesPage() {
  return (
    <>
      <DeprecationBanner currentPath="/app/articles" newPath="/admin?tab=articles" />
      <DashboardEducationPage />
    </>
  );
}
