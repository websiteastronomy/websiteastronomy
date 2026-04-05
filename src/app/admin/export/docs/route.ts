import {
  downloadResponse,
  getDocsExportCsvRows,
  getDocsExportPayload,
  requireAdminExportAccess,
  toCsv,
} from "@/lib/admin-export";

export async function GET(request: Request) {
  await requireAdminExportAccess();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "json";

  if (format === "csv") {
    const csv = toCsv(await getDocsExportCsvRows());
    return downloadResponse(csv, "documentation-export.csv", "text/csv; charset=utf-8");
  }

  return downloadResponse(
    JSON.stringify(await getDocsExportPayload(), null, 2),
    "documentation-export.json",
    "application/json; charset=utf-8"
  );
}
