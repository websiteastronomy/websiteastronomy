import { deriveDashboardRole } from "@/lib/module-access";
import { getMyRBACProfile } from "@/app/actions/auth";
import DashboardOverviewClient from "@/components/dashboard/DashboardOverviewClient";
import OverviewManager from "@/app/admin/components/OverviewManager";

export default async function AppOverviewPage() {
  const profile = await getMyRBACProfile();
  const role = deriveDashboardRole({
    roleName: profile?.roleName,
    permissions: profile?.permissions || [],
    isAdmin: profile?.roleName === "Admin",
  });

  if (role === "admin") {
    // We pass a dummy onNavigate since we are now unified with proper URLs
    // Some admin components might try to setActiveTab from the old system.
    return <OverviewManager onNavigate={() => {}} />;
  }

  return <DashboardOverviewClient role={role} />;
}
