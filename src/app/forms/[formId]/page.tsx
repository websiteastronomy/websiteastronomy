import FormFillClient from "@/components/FormFillClient";

export default async function FormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  return <FormFillClient formId={formId} />;
}
