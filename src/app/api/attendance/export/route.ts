import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance_records, attendance_invites, attendance_sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

function getAdminPassword() {
  return process.env.ATTENDANCE_ADMIN_PASSWORD || "";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminPassword = searchParams.get("adminPassword");
    const sessionId = searchParams.get("sessionId");

    if (!adminPassword || adminPassword !== getAdminPassword()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build query — join attendance_records with invites and sessions
    let records;

    if (sessionId) {
      records = await db
        .select({
          name: attendance_invites.name,
          usn: attendance_invites.usn,
          email: attendance_invites.email,
          sessionName: attendance_sessions.name,
          sessionDate: attendance_sessions.date,
          scannedAt: attendance_records.scannedAt,
        })
        .from(attendance_records)
        .innerJoin(attendance_invites, eq(attendance_records.inviteId, attendance_invites.id))
        .innerJoin(attendance_sessions, eq(attendance_records.sessionId, attendance_sessions.id))
        .where(eq(attendance_records.sessionId, sessionId));
    } else {
      records = await db
        .select({
          name: attendance_invites.name,
          usn: attendance_invites.usn,
          email: attendance_invites.email,
          sessionName: attendance_sessions.name,
          sessionDate: attendance_sessions.date,
          scannedAt: attendance_records.scannedAt,
        })
        .from(attendance_records)
        .innerJoin(attendance_invites, eq(attendance_records.inviteId, attendance_invites.id))
        .innerJoin(attendance_sessions, eq(attendance_records.sessionId, attendance_sessions.id));
    }

    // Build CSV
    const headers = ["Name", "USN", "Email", "Session Name", "Date", "Scanned At"];
    const rows = records.map((r) => [
      r.name || "Unknown",
      r.usn || "N/A",
      r.email || "N/A",
      r.sessionName,
      r.sessionDate,
      r.scannedAt ? new Date(r.scannedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
