import FormDashboardClient from "./FormDashboardClient";

export default async function AdminFormDashboardPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <FormDashboardClient formId={formId} />;
}
