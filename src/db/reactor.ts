import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as http } from 'drizzle-orm/neon-http';
import { drizzle as server } from 'drizzle-orm/neon-serverless';
import { getRuntimeKey } from 'hono/adapter';
import { schema } from './schema/index.js';

export type Database = ReturnType<typeof http> | ReturnType<typeof server>;

let db: Database | null = null;
let pool: Pool | null = null; // only set when the pooled driver is in use

// Pool only where connections outlive a request; everything else uses HTTP.
const usesPool = () => {
  const runtime = getRuntimeKey();
  return runtime === 'bun' || runtime === 'node';
};

/**
 * Lazy singleton. Built on first use, reused for the life of the
 * process (or isolate). The URL is only read on the first call.
 */
export const getDb = (url: string): Database => {
  if (db) return db;

  if (usesPool()) {
    const p = new Pool({ connectionString: url });
    // @ts-expect-error - Drizzle v1 RC custom client initialization type bug
    db = server({ client: p, schema });
    pool = p; // assigned after drizzle succeeds, so a throw can't strand a pool
  } else {
    // @ts-expect-error - Drizzle v1 RC custom client initialization type bug
    db = http({ client: neon(url), schema });
  }

  return db;
};

/** Ends the pool if one was built. Also resets state for tests. */
export const closeDb = async () => {
  const p = pool;
  pool = null;
  db = null;
  if (!p) return false;
  await p.end();
  return true;
};
