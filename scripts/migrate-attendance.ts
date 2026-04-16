import * as dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

dotenv.config({ path: ".env.local" });

neonConfig.webSocketConstructor = ws;

const sql = `
CREATE TABLE IF NOT EXISTS attendance_invites (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  name TEXT,
  usn TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL REFERENCES attendance_invites(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT attendance_records_invite_session_unique UNIQUE (invite_id, session_id)
);
`;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("✅ Attendance tables created successfully.");
    console.log("   - attendance_invites");
    console.log("   - attendance_sessions");
    console.log("   - attendance_records");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
