import cron from "node-cron";
import { db } from "../db/index";
import { observations } from "../db/schema";
import { eq, lte, and, or } from "drizzle-orm";

console.log("Observation Review Escalation CRON initialized.");
console.log("Running task every 1 hour...");

// Runs at minute 0 past every hour
cron.schedule("0 * * * *", async () => {
  console.log(`[CRON] Executing 48-hour timeout check: ${new Date().toISOString()}`);

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Find observations stuck in Under_Review or Submitted for > 48 hours
    const stagnantObservations = await db.select()
      .from(observations)
      .where(
        and(
          or(
            eq(observations.status, "Under_Review"),
            eq(observations.status, "Submitted")
          ),
          lte(observations.updatedAt, fortyEightHoursAgo)
        )
      );

    if (stagnantObservations.length === 0) {
      console.log("[CRON] No stagnant observations found.");
      return;
    }

    console.log(`[CRON] Found ${stagnantObservations.length} observations exceeding 48h limit. Escalating to Admin...`);

    for (const obs of stagnantObservations) {
      // Escalate to Core_Approved so it lands on the Admin's desk for final review
      // Alternatively, we could email the admin here.
      await db.update(observations)
        .set({
          status: "Core_Approved",
          rejectionReason: "SYSTEM ESCALATION: 48-hour review timeout exceeded. Forced to Admin queue.",
          updatedAt: new Date()
        })
        .where(eq(observations.id, obs.id));
      
      console.log(`[CRON] Escalated observation ID: ${obs.id}`);
    }

    console.log("[CRON] Escalation batch complete.");
  } catch (error) {
    console.error("[CRON] Failed to execute escalation routine:", error);
  }
});
