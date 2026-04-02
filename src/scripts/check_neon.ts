import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { neon } from "@neondatabase/serverless";

async function check() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log("Checking for missing users in project.team...");
    const badUsers = await sql`
      SELECT t.user_id 
      FROM projects p, 
           jsonb_to_recordset(p.team) AS t(user_id text)
      WHERE t.user_id NOT IN (SELECT id FROM "user")
    `;
    console.log("Found missing users:", badUsers);

  } catch (err) {
    console.error(err);
  }
}

check();
