import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import ws from 'ws';
import { getDatabaseUrl } from '@/lib/env';

// Required for Node.js environments (Next.js server-side)
neonConfig.webSocketConstructor = ws;

// Use a connection pool for WebSocket-based connections  
// This is required for Better Auth which uses interactive transactions
const pool = new Pool({ connectionString: getDatabaseUrl() });

export const db = drizzle(pool, { schema });
