import { NextResponse } from 'next/server';
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

interface LegacyProjectMember {
  userId?: string;
  name?: string;
  role?: string; 
}

export async function GET() {
  try {
    const allProjects = await db.select().from(schema.projects);
    const allUsers = await db.select({ id: schema.users.id }).from(schema.users);
    const validUserIds = new Set(allUsers.map(u => u.id));
    
    let migratedCount = 0;
    let skippedCount = 0;

    for (const project of allProjects) {
      const team = project.team as LegacyProjectMember[] | null;
      if (!team || !Array.isArray(team)) continue;

      for (const member of team) {
        if (!member.userId || !validUserIds.has(member.userId)) {
          skippedCount++;
          continue;
        }

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
          
          await db.insert(schema.project_members).values({
            id: uuidv4(),
            projectId: project.id,
            userId: member.userId,
            role: targetRole,
            joinedAt: new Date(),
          });
          migratedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, migrated: migratedCount, skipped: skippedCount });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message, 
      code: error.code, 
      detail: error.detail,
      constraint: error.constraint
    }, { status: 500 });
  }
}
