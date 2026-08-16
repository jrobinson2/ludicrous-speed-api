import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as http } from 'drizzle-orm/neon-http';
import { drizzle as server } from 'drizzle-orm/neon-serverless';
import { isRuntime } from '../lib/runtime.js';
import { schema } from './schema/index.js';

/**
 * Persists in the Isolate/Process memory.
 * - Serverless: Lives as long as the "Warm Start".
 * - Serverful: Lives until the process restarts.
 */

export type Database = ReturnType<typeof http> | ReturnType<typeof server>;

let db: Database | null = null;
let initializedUrl: string | null = null;

/**
 * Gets or initializes the database instance.
 * Handles the "Stale Isolate" edge case by re-initializing if the URL changes.
 */
export const getDb = (url: string): Database => {
  // If we have an existing instance and the URL matches, reuse it
  if (db && initializedUrl === url) {
    return db;
  }

  // If the URL changed (Infra rotation) or it's the first run: Initialize
  initializedUrl = url;
  const supportsTcp = isRuntime.Bun || isRuntime.Node;

  if (!supportsTcp) {
    // Edge / Workers / Vercel Edge → HTTP
    const client = neon(url);
    // @ts-expect-error - Drizzle v1 RC custom client initialization type bug
    db = http({ client, schema });
  } else {
    // Bun / Node → TCP pool
    const pool = new Pool({ connectionString: url });
    // @ts-expect-error - Drizzle v1 RC custom client initialization type bug
    db = server({ client: pool, schema });
  }

  return db;
};
