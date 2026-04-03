import * as path from "path";
import * as dotenv from "dotenv";
import ws from 'ws';

(globalThis as any).WebSocket = ws;
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  console.log("Dropping old table to allow clean migration...");
  await sql`DROP TABLE IF EXISTS observations CASCADE`;
  await sql`DROP TABLE IF EXISTS observation_versions CASCADE`;
  console.log("Success.");
  process.exit(0);
}

run().catch(console.error);
