import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as http } from 'drizzle-orm/neon-http';
import { drizzle as server } from 'drizzle-orm/neon-serverless';
import { isRuntime } from '../lib/runtime.js';
import * as schema from './schema.js';

/**
 * Persists in the Isolate/Process memory.
 * - Serverless: Lives as long as the "Warm Start".
 * - Serverful: Lives until the process restarts.
 */

type HttpDb = ReturnType<typeof http<typeof schema>>;
type ServerDb = ReturnType<typeof server<typeof schema>>;
export type Database = HttpDb | ServerDb;

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
    db = http(client, { schema });
  } else {
    // Bun / Node → TCP pool
    const pool = new Pool({ connectionString: url });
    db = server(pool, { schema });
  }

  return db;
};
