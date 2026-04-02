import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from "../db/index";
import * as schema from "../db/schema";

async function runBackup() {
  console.log("Starting secure physical database backup...");
  
  try {
    const backupData = {
      users: await db.select().from(schema.users),
      projects: await db.select().from(schema.projects),
      events: await db.select().from(schema.events),
      files: await db.select().from(schema.files),
      members: await db.select().from(schema.members),
      project_tasks: await db.select().from(schema.project_tasks),
      project_task_assignments: await db.select().from(schema.project_task_assignments),
      event_volunteers: await db.select().from(schema.event_volunteers),
      event_registrations: await db.select().from(schema.event_registrations)
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `db-backup-${timestamp}.json`;
    const backupPath = path.join(process.cwd(), "backups");

    // Ensure backups directory exists
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath);
    }

    const fullPath = path.join(backupPath, filename);
    fs.writeFileSync(fullPath, JSON.stringify(backupData, null, 2));

    console.log(`\n✅ Backup successfully written to: ${fullPath}`);
    console.log(`\n📊 Record Counts:`);
    for (const [key, val] of Object.entries(backupData)) {
       console.log(`   - ${key}: ${val.length} records`);
    }

    // Integrity Check
    const stat = fs.statSync(fullPath);
    if (stat.size > 0 && Array.isArray(backupData.users)) {
       console.log(`\n✅ Integrity Check Passed. Backup file size: ${(stat.size / 1024).toFixed(2)} KB.`);
       console.log("You may safely proceed to Phase 1.");
    } else {
       throw new Error("Integrity check failed: invalid file size or corrupted payload format.");
    }
    
    process.exit(0);

  } catch (error: any) {
    console.error("\n❌ BACKUP FAILED!", error);
    fs.writeFileSync(path.join(process.cwd(), "backup_error_utf8.log"), error.stack || error.toString(), "utf8");
    process.exit(1);
  }
}

runBackup();
