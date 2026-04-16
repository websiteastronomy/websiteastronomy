import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance_sessions } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { desc } from "drizzle-orm";

function getAdminPassword() {
  return process.env.ATTENDANCE_ADMIN_PASSWORD || "";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminPassword = searchParams.get("adminPassword");

    if (!adminPassword || adminPassword !== getAdminPassword()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allSessions = await db
      .select()
      .from(attendance_sessions)
      .orderBy(desc(attendance_sessions.createdAt));

    return NextResponse.json({ sessions: allSessions }, { status: 200 });
  } catch (error) {
    console.error("Sessions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, date, adminPassword } = body as {
      name: string;
      date: string;
      adminPassword: string;
    };

    if (!adminPassword || adminPassword !== getAdminPassword()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!name?.trim() || !date?.trim()) {
      return NextResponse.json({ error: "Session name and date are required" }, { status: 400 });
    }

    const session = {
      id: uuidv4(),
      name: name.trim(),
      date: date.trim(),
    };

    await db.insert(attendance_sessions).values(session);

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Sessions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
