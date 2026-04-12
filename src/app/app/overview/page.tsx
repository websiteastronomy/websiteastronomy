import { deriveDashboardRole } from "@/lib/module-access";
import { getMyRBACProfile } from "@/app/actions/auth";
import DashboardOverviewClient from "@/components/dashboard/DashboardOverviewClient";
import AppAdminOverview from "./AppAdminOverview";

export default async function AppOverviewPage() {
  const profile = await getMyRBACProfile();
  const role = deriveDashboardRole({
    roleName: profile?.roleName,
    permissions: profile?.permissions || [],
    isAdmin: profile?.roleName === "Admin",
  });

  if (role === "admin") {
    return <AppAdminOverview />;
  }

  return <DashboardOverviewClient role={role} />;
}
