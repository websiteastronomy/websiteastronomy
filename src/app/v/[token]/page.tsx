import { db } from "@/db";
import { attendance_invites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import VerificationClient from "@/verification-client";

export const metadata = {
  title: "Verify Attendance | MVJCE Astronomy Club",
  description: "Verify your attendance and get your personal QR code for MVJCE Astronomy Club events.",
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function VerificationPage({ params }: Props) {
  const { token } = await params;

  if (!token || token.length < 8) {
    notFound();
  }

  const invite = await db
    .select()
    .from(attendance_invites)
    .where(eq(attendance_invites.token, token))
    .limit(1)
    .catch(() => []);

  if (invite.length === 0) {
    notFound();
  }

  const record = invite[0];

  return (
    <VerificationClient
      token={token}
      email={record.email}
      initialName={record.name ?? null}
      initialUsn={record.usn ?? null}
    />
  );
}
