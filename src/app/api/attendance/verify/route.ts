import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance_invites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import QRCode from "qrcode";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invite = await db
      .select()
      .from(attendance_invites)
      .where(eq(attendance_invites.token, token))
      .limit(1);

    if (invite.length === 0) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    return NextResponse.json({ invite: invite[0] }, { status: 200 });
  } catch (error) {
    console.error("Verify GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, name, usn } = body as { token: string; name: string; usn: string };

    if (!token || !name?.trim() || !usn?.trim()) {
      return NextResponse.json({ error: "Token, name, and USN are required" }, { status: 400 });
    }

    const invite = await db
      .select()
      .from(attendance_invites)
      .where(eq(attendance_invites.token, token))
      .limit(1);

    if (invite.length === 0) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // Update name and USN
    await db
      .update(attendance_invites)
      .set({ name: name.trim(), usn: usn.trim().toUpperCase() })
      .where(eq(attendance_invites.token, token));

    // Generate QR as data URL for email
    try {
      const qrDataUrl = await QRCode.toDataURL(token, {
        width: 400,
        margin: 2,
        color: { dark: "#0b101e", light: "#ffffff" },
      });

      await sendEmail({
        to: invite[0].email,
        subject: "MVJCE Astronomy Club — Your Attendance QR Code",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b101e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 2rem; text-align: center;">
              <h1 style="color: #c9a84c; margin: 0; font-size: 1.5rem;">🔭 MVJCE Astronomy Club</h1>
              <p style="color: #8899aa; margin-top: 0.5rem; font-size: 0.9rem;">Your QR Code</p>
            </div>
            <div style="padding: 2rem; text-align: center;">
              <p style="font-size: 1rem; margin-bottom: 0.5rem;">Hello <strong style="color: #c9a84c;">${name.trim()}</strong>,</p>
              <p style="font-size: 0.9rem; color: #8899aa; margin-bottom: 1.5rem;">USN: <strong>${usn.trim().toUpperCase()}</strong></p>
              <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">Your permanent attendance QR code is ready. Save this image and present it at events for attendance scanning.</p>
              <div style="background: #ffffff; border-radius: 12px; padding: 1rem; display: inline-block;">
                <img src="${qrDataUrl}" alt="Your QR Code" style="width: 250px; height: 250px;" />
              </div>
              <p style="font-size: 0.8rem; color: #556677; margin-top: 1.5rem;">Screenshot or save this QR code. You can also access it anytime via your verification link.</p>
            </div>
          </div>
        `,
      });
    } catch {
      // QR email failure shouldn't block the verification response
    }

    return NextResponse.json({
      success: true,
      invite: { ...invite[0], name: name.trim(), usn: usn.trim().toUpperCase() },
    }, { status: 200 });
  } catch (error) {
    console.error("Verify POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
