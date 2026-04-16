import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance_invites, attendance_records } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

function getAdminPassword() {
  return process.env.ATTENDANCE_ADMIN_PASSWORD || "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, sessionId, adminPassword } = body as {
      token: string;
      sessionId: string;
      adminPassword: string;
    };

    if (!adminPassword || adminPassword !== getAdminPassword()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!token || !sessionId) {
      return NextResponse.json({ error: "Token and sessionId are required" }, { status: 400 });
    }

    // Find invite by token
    const invite = await db
      .select()
      .from(attendance_invites)
      .where(eq(attendance_invites.token, token))
      .limit(1);

    if (invite.length === 0) {
      return NextResponse.json({
        status: "not_found",
        message: "No user found for this QR code",
      }, { status: 404 });
    }

    const user = invite[0];

    // Check for existing attendance record
    const existing = await db
      .select()
      .from(attendance_records)
      .where(
        and(
          eq(attendance_records.inviteId, user.id),
          eq(attendance_records.sessionId, sessionId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        status: "duplicate",
        message: "Attendance already marked",
        name: user.name || "Unknown",
        usn: user.usn || "N/A",
        scannedAt: existing[0].scannedAt,
      }, { status: 200 });
    }

    // Create attendance record
    const now = new Date();
    await db.insert(attendance_records).values({
      id: uuidv4(),
      inviteId: user.id,
      sessionId,
      scannedAt: now,
    });

    return NextResponse.json({
      status: "success",
      message: "Attendance marked successfully",
      name: user.name || "Unknown",
      usn: user.usn || "N/A",
      scannedAt: now,
    }, { status: 200 });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
