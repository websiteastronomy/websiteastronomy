import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from "../db/index";
import * as schema from "../db/schema";
import { eq, inArray, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function runSeederAndMigration() {
  console.log("Starting Phase 2: Seeding Default Roles & Permissions...");

  try {
    // 1. Roles Definition
    const predefinedRoles = [
      { name: "Admin", description: "Full system administration and override authority." },
      { name: "Finance Head", description: "Finance oversight, approvals, and reporting authority." },
      { name: "Core Committee", description: "Internal management with event and project control." },
      { name: "Lead", description: "Project/Team lead authority." },
      { name: "Member", description: "General community participant." }
    ];

    const rolesMap: Record<string, string> = {};

    for (const r of predefinedRoles) {
      const existing = await db.select().from(schema.roles).where(eq(schema.roles.name, r.name)).limit(1);
      if (existing.length === 0) {
        const _id = uuidv4();
        await db.insert(schema.roles).values({ id: _id, name: r.name, description: r.description });
        rolesMap[r.name] = _id;
        console.log(`+ Created role: ${r.name}`);
      } else {
        rolesMap[r.name] = existing[0].id;
        console.log(`= Existing role found: ${r.name}`);
      }
    }

    // 2. Permissions Definition
    const permissionsList = [
      "manage_projects", "manage_events", "manage_members", "assign_roles",
      "approve_actions", "upload_files", "delete_files", "view_analytics",
      "manage_finance", "export_finance"
    ];

    const permMap: Record<string, string> = {};

    for (const p of permissionsList) {
      const existing = await db.select().from(schema.permissions).where(eq(schema.permissions.key, p)).limit(1);
      if (existing.length === 0) {
        const _id = uuidv4();
        await db.insert(schema.permissions).values({ id: _id, key: p, description: `Permission to ${p.replace("_", " ")}` });
        permMap[p] = _id;
      } else {
        permMap[p] = existing[0].id;
      }
    }

    // 3. Mapping logical permissions to Roles
    const rolePermissionMapping: Record<string, string[]> = {
      "Admin": ["manage_projects", "manage_events", "manage_members", "assign_roles", "approve_actions", "upload_files", "delete_files", "view_analytics", "manage_finance", "export_finance"],
      "Finance Head": ["manage_finance", "export_finance", "view_analytics"],
      "Core Committee": ["manage_projects", "manage_events", "approve_actions", "upload_files", "view_analytics"],
      "Lead": ["manage_projects", "upload_files"],
      "Member": []
    };

    for (const [roleName, perms] of Object.entries(rolePermissionMapping)) {
      const roleId = rolesMap[roleName];
      for (const p of perms) {
        const permId = permMap[p];
        const existingJoin = await db.select().from(schema.role_permissions)
                             .where(inArray(schema.role_permissions.roleId, [roleId]))
                             // Can't do composite unique elegantly here in quick script without and(), sticking to simple catch all:
        
        let found = false;
        const allRolePerms = await db.select().from(schema.role_permissions).where(eq(schema.role_permissions.roleId, roleId));
        for (const arp of allRolePerms) {
          if (arp.permissionId === permId) found = true;
        }

        if (!found) {
          await db.insert(schema.role_permissions).values({ id: uuidv4(), roleId, permissionId: permId });
        }
      }
    }

    console.log("✅ Phase 2 constraints and seeds locked in.");

    // ============================================
    // Phase 3: Data Migration (Safe Rollout)
    // ============================================
    console.log("\nStarting Phase 3: User Record Migration...");

    const users = await db.select().from(schema.users);
    let migratedCount = 0;

    for (const u of users) {
      if (u.roleId) continue; // Already migrated
      
      let targetRoleName = "Member"; 
      
      // Map legacy "role" string to new normalized Role Model
      if (u.role === "admin" || u.email === "shashanknm9535@gmail.com") targetRoleName = "Admin";
      else if (u.role === "finance_head") targetRoleName = "Finance Head";
      else if (u.role === "core") targetRoleName = "Core Committee";
      else if (u.role === "lead") targetRoleName = "Lead";
      else targetRoleName = "Member"; 

      const targetRoleId = rolesMap[targetRoleName];
      
      await db.update(schema.users).set({ roleId: targetRoleId }).where(eq(schema.users.id, u.id));
      migratedCount++;
    }

    console.log(`\n✅ Phase 3 Completed! Safely mapped ${migratedCount} legacy user records to Foreign Key Role structure.`);
    
    // Quick validation
    const unmigratedUsers = await db.select().from(schema.users).where(isNull(schema.users.roleId));
    console.log(`\n📊 VALIDATION: ${unmigratedUsers.length} users remain unmapped (Should be 0).`);

    process.exit(0);

  } catch (error) {
    console.error("\n❌ MIGRATION FAILED!", error);
    process.exit(1);
  }
}

runSeederAndMigration();
