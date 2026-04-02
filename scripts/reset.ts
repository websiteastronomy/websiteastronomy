import { Pool, neonConfig } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import ws from "ws";

dotenv.config({ path: ".env.local" });
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

async function reset() {
  console.log("Dropping all tables...");
  await pool.query('DROP SCHEMA public CASCADE;');
  await pool.query('CREATE SCHEMA public;');
  console.log("Schema reset successfully.");
  await pool.end();
}

reset().catch((e) => {
  console.error("Failed to reset schema:", e);
  process.exit(1);
});
