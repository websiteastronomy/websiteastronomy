import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db } from "../db/index";
import * as schema from "../db/schema";
import { isNull } from "drizzle-orm";

async function runValidation() {
  console.log("Starting Phase 4: Validation...");

  try {
    const allUsers = await db.select().from(schema.users);
    const unmappedUsers = await db.select().from(schema.users).where(isNull(schema.users.roleId));

    console.log(`Total Users: ${allUsers.length}`);
    console.log(`Users with NULL roleId: ${unmappedUsers.length}`);

    if (unmappedUsers.length > 0) {
      console.log("❌ VALIDATION FAILED: Some users are missing role mappings.");
      process.exit(1);
    } else {
      console.log("✅ VALIDATION PASSED: All users successfully mapped to Foreign Key roles.");
      process.exit(0);
    }

  } catch (error) {
    console.error("\n❌ VALIDATION FAILED!", error);
    process.exit(1);
  }
}

runValidation();
