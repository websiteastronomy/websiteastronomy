import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from "../db/index";
import * as schema from "../db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

interface LegacyProjectMember {
  userId?: string;
  name?: string;
  role?: string; 
}

async function runMigration() {
  console.log("Starting Phase 2 Migration...");

  try {
    const allProjects = await db.select().from(schema.projects);
    let migratedCount = 0;

    for (const project of allProjects) {
      const team = project.team as LegacyProjectMember[] | null;
      if (!team || !Array.isArray(team)) continue;

      for (const member of team) {
        if (!member.userId) continue;

        const existing = await db
          .select()
          .from(schema.project_members)
          .where(
            and(
              eq(schema.project_members.projectId, project.id),
              eq(schema.project_members.userId, member.userId)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          let targetRole: "member" | "lead" = "member";
          if (member.role && member.role.toLowerCase().includes("lead")) {
            targetRole = "lead";
          }
          
          try {
            await db.insert(schema.project_members).values({
              id: uuidv4(),
              projectId: project.id,
              userId: member.userId,
              role: targetRole,
              joinedAt: new Date(),
            });
            migratedCount++;
          } catch (e: any) {
            console.error("Insert Error:", e.message);
          }
        }
      }
    }

    console.log(`✅ Safe inserted ${migratedCount} project_members.`);
    process.exit(0);
  } catch (err: any) {
    console.error("❌ MIGRATION FAILED!", err.message);
    process.exit(1);
  }
}

runMigration();
