import AdminRouteSection from "@/app/admin/components/AdminRouteSection";
import SystemSettingsManager from "@/app/admin/components/SystemSettingsManager";

export default function AdminStoragePage() {
  return (
    <AdminRouteSection>
      <SystemSettingsManager />
    </AdminRouteSection>
  );
}
