import {
  downloadResponse,
  getFormResponseExportRows,
  recordAdminExportAction,
  requireAdminExportAccess,
  toCsv,
} from "@/lib/admin-export";

export async function GET(request: Request) {
  await requireAdminExportAccess();
  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("formId");
  await recordAdminExportAction("forms", { formId: formId || null });

  const rows = await getFormResponseExportRows(formId);
  const csv = toCsv(rows.map((row) => ({
    ...row,
    answers: row.answers ?? row.responses ?? {},
  })));

  return downloadResponse(
    csv,
    formId?.trim() ? `form-responses-${formId.trim()}.csv` : "form-responses.csv",
    "text/csv; charset=utf-8"
  );
}
