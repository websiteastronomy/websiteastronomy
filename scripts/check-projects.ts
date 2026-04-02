import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";
import ws from "ws";

dotenv.config({ path: ".env.local" });
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

async function check() {
  const projects = await db.select().from(schema.projects);
  console.log("PROJECTS:", JSON.stringify(projects, null, 2));
  await pool.end();
}

check().catch(console.error);
