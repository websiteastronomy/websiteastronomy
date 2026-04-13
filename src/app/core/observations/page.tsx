import { auth } from "@/lib/auth";
import { db } from "@/db";
import { observations } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import AnimatedSection from "@/components/AnimatedSection";
import CoreReviewList from "./CoreReviewList";

export default async function CoreObservationsQueue() {
  const session = await auth.api.getSession({ headers: await import("next/headers").then(m => m.headers()) });
  if (!session?.user) redirect("/portal?redirect=/core/observations");

  // Validate Core Team access
  const isCore = await hasPermission(session.user.id, "manage_projects"); // Proxy permission
  if (!isCore) redirect("/");

  // Fetch observations stuck in queue
  const rawQueue = await db.select()
    .from(observations)
    .where(
      or(
        eq(observations.status, "Submitted"),
        eq(observations.status, "Under_Review")
      )
    )
    .orderBy(desc(observations.updatedAt));
  const queue = rawQueue.filter((observation) => {
    const assignedReviewers = Array.isArray(observation.assignedReviewers)
      ? (observation.assignedReviewers as string[])
      : [];

    return (
      assignedReviewers.length === 0 ||
      assignedReviewers.includes(session.user.id)
    );
  });

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: "1000px", margin: "0 auto", minHeight: "80vh" }}>
      <AnimatedSection>
        <h1 className="page-title" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          Core <span className="gradient-text">Oversight</span>
        </h1>
        <p className="page-subtitle" style={{ fontSize: "1.1rem", marginBottom: "3rem" }}>
          Review pending astronomical observations. Require 2 consensus votes to push to Admin Finalization.
        </p>

        {queue.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", background: "rgba(15, 22, 40, 0.4)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
            <div style={{ fontSize: "3rem", opacity: 0.5, marginBottom: "1rem" }}>✨</div>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>Inbox Zero</h3>
            <p style={{ color: "var(--text-muted)" }}>No observations are currently pending review.</p>
          </div>
        ) : (
          <CoreReviewList queue={queue} currentUserId={session.user.id} />
        )}
      </AnimatedSection>
    </div>
  );
}
