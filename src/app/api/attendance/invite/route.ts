import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance_invites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/email";

function getAdminPassword() {
  return process.env.ATTENDANCE_ADMIN_PASSWORD || "";
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emails, adminPassword } = body as { emails: string[]; adminPassword: string };

    if (!adminPassword || adminPassword !== getAdminPassword()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Emails array is required" }, { status: 400 });
    }

    const results: { email: string; status: string }[] = [];

    for (const email of emails) {
      const trimmed = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        results.push({ email: trimmed, status: "invalid_email" });
        continue;
      }

      // Check if invite already exists
      const existing = await db
        .select()
        .from(attendance_invites)
        .where(eq(attendance_invites.email, trimmed))
        .limit(1);

      let token: string;

      if (existing.length > 0) {
        token = existing[0].token;
        results.push({ email: trimmed, status: "existing" });
      } else {
        token = uuidv4();
        await db.insert(attendance_invites).values({
          id: uuidv4(),
          email: trimmed,
          token,
        });
        results.push({ email: trimmed, status: "created" });
      }

      // Send invite email
      const verifyUrl = `${getAppUrl()}/v/${token}`;
      try {
        await sendEmail({
          to: trimmed,
          subject: "MVJCE Astronomy Club — Verify Your Attendance",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b101e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 2rem; text-align: center;">
                <h1 style="color: #c9a84c; margin: 0; font-size: 1.5rem;">🔭 MVJCE Astronomy Club</h1>
                <p style="color: #8899aa; margin-top: 0.5rem; font-size: 0.9rem;">Attendance Verification</p>
              </div>
              <div style="padding: 2rem;">
                <p style="font-size: 1rem; line-height: 1.6;">You've been invited to register your attendance. Click the button below to verify your identity and receive your personal QR code.</p>
                <div style="text-align: center; margin: 2rem 0;">
                  <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #c9a84c, #b8942f); color: #0b101e; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1rem;">Verify & Get QR Code</a>
                </div>
                <p style="font-size: 0.85rem; color: #667788;">Or copy this link: <span style="color: #c9a84c;">${verifyUrl}</span></p>
              </div>
              <div style="padding: 1rem 2rem; background: rgba(201, 168, 76, 0.05); border-top: 1px solid rgba(201, 168, 76, 0.1); text-align: center;">
                <p style="font-size: 0.75rem; color: #556677; margin: 0;">This is a one-time verification link. Your QR code will be permanent.</p>
              </div>
            </div>
          `,
        });
      } catch {
        // Email send failure shouldn't stop the loop
        const lastResult = results[results.length - 1];
        lastResult.status = lastResult.status + "_email_failed";
      }
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
