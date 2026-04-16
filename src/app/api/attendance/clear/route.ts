import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance_records } from "@/db/schema";

function getAdminPassword() {
  return process.env.ATTENDANCE_ADMIN_PASSWORD || "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminPassword } = body as { adminPassword: string };

    if (!adminPassword || adminPassword !== getAdminPassword()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete ONLY attendance records — never invites or sessions
    await db.delete(attendance_records);

    return NextResponse.json({
      success: true,
      message: "All attendance records cleared. Users and tokens are preserved.",
    }, { status: 200 });
  } catch (error) {
    console.error("Clear error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
