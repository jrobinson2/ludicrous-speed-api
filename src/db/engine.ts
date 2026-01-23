import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as http } from 'drizzle-orm/neon-http';
import { drizzle as server } from 'drizzle-orm/neon-serverless';
import { DatabaseAlreadyInitializedError } from '../lib/errors.js';
import { isRuntime } from '../lib/runtime.js';
import * as schema from './schema.js';

/**
 * Persists in the Isolate/Process memory.
 * - Serverless: Lives as long as the "Warm Start".
 * - Serverful: Lives until the process restarts.
 */

type HttpDb = ReturnType<typeof http<typeof schema>>;
type ServerDb = ReturnType<typeof server<typeof schema>>;

let db: HttpDb | ServerDb | null = null;
let initializedUrl: string | null = null;

export const getDb = (url: string) => {
  if (db) {
    if (initializedUrl !== url) {
      throw new DatabaseAlreadyInitializedError(
        'Whoa, the DB is already set up!',
        {
          meta: {
            initializedUrl,
            attemptedUrl: url
          }
        }
      );
    }

    return db;
  }

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

export type Database = ReturnType<typeof getDb>;
