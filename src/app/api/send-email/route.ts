import * as nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSystemAccess } from "@/lib/system-rbac";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";

type AllowedFlow =
  | "join_application_admin"
  | "join_application_confirmation"
  | "member_contact";

type EmailPayload = {
  flow?: AllowedFlow;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  replyTo?: string;
  applicantEmail?: string;
};

const WINDOW_MS = 15 * 60 * 1000;
const rateLimitStore = new Map<string, number[]>();

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeEmailRecipient(rawTo: string | undefined) {
  if (!rawTo) return null;
  if (rawTo === "admin") {
    return process.env.ADMIN_EMAIL || null;
  }
  return rawTo.trim();
}

function applyRateLimit(key: string, limit: number) {
  const now = Date.now();
  const existing = rateLimitStore.get(key) || [];
  const recent = existing.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recent.length >= limit) {
    return false;
  }

  recent.push(now);
  rateLimitStore.set(key, recent);
  return true;
}

function sanitizePlainText(value: string | undefined, maxLength: number) {
  if (!value) return "";
  return value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}

function sanitizeHtmlBody(value: string | undefined) {
  if (!value) return "";
  return sanitizeRichHtml(value).slice(0, 20000);
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

async function getSessionContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  const access = await getSystemAccess(session.user.id);
  return { user: session.user, access };
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as EmailPayload;
    const flow = payload.flow;

    if (!flow) {
      return NextResponse.json({ error: "Email flow is required" }, { status: 400 });
    }

    const subject = sanitizePlainText(payload.subject, 200);
    const text = sanitizePlainText(payload.text, 10000);
    const html = sanitizeHtmlBody(payload.html);
    const to = normalizeEmailRecipient(payload.to);
    const replyTo = payload.replyTo?.trim() || "";
    const applicantEmail = payload.applicantEmail?.trim() || "";
    const adminEmail = process.env.ADMIN_EMAIL || "";
    const clientIp = getClientIp(req);
    const sessionContext = await getSessionContext();

    if (!subject || (!text && !html) || !to || !isValidEmail(to)) {
      return NextResponse.json({ error: "Invalid email payload" }, { status: 400 });
    }

    if (flow === "join_application_admin") {
      if (to !== adminEmail || !replyTo || !isValidEmail(replyTo)) {
        return NextResponse.json({ error: "Invalid join application payload" }, { status: 400 });
      }

      if (!applyRateLimit(`join-admin:${clientIp}:${replyTo.toLowerCase()}`, 3)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    } else if (flow === "join_application_confirmation") {
      if (!applicantEmail || !isValidEmail(applicantEmail) || applicantEmail !== to) {
        return NextResponse.json({ error: "Invalid confirmation recipient" }, { status: 400 });
      }

      if (!applyRateLimit(`join-confirm:${clientIp}:${to.toLowerCase()}`, 3)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    } else if (flow === "member_contact") {
      if (!sessionContext?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!(sessionContext.access.isAdmin || sessionContext.access.canManageProjects || sessionContext.access.canApproveActions || sessionContext.access.canManageEvents || sessionContext.access.canManageMembers || sessionContext.user.email)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (to !== adminEmail) {
        return NextResponse.json({ error: "Recipient not allowed" }, { status: 403 });
      }

      if (!applyRateLimit(`member-contact:${sessionContext.user.id}`, 10)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    } else {
      return NextResponse.json({ error: "Unsupported email flow" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
      replyTo:
        flow === "member_contact"
          ? sessionContext?.user?.email || undefined
          : replyTo || undefined,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
