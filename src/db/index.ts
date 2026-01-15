import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const getDb = (url: string) => {
  if (db) return db;

  const client = neon(url);
  db = drizzle(client, { schema });
  return db;
};

export type Database = ReturnType<typeof getDb>;
