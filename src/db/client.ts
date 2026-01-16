import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Persists in the Isolate/Process memory.
 * - Serverless: Lives as long as the "Warm Start".
 * - Serverful: Lives until the process restarts (e.g., bun --watch).
 */
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const getDb = (url: string) => {
  // If the instance exists, return it. Simple. Fast.
  if (db) return db;

  // Only happens once per lifecycle
  const client = neon(url);
  db = drizzle(client, { schema });

  return db;
};

export type Database = ReturnType<typeof getDb>;
