import DashboardOverviewClient from "@/components/dashboard/DashboardOverviewClient";
import { deriveDashboardRole } from "@/lib/module-access";
import { getMyRBACProfile } from "@/app/actions/auth";

export default async function DashboardOverviewPage() {
  const profile = await getMyRBACProfile();
  const role = deriveDashboardRole({
    roleName: profile?.roleName,
    permissions: profile?.permissions || [],
    isAdmin: profile?.roleName === "Admin",
  });

  return <DashboardOverviewClient role={role} />;
}
