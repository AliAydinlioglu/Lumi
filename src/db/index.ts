import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Connection string to our docker postgres container
// In production, this should be in an environment variable!
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/lumi',
});

export const db = drizzle(pool, { schema });
