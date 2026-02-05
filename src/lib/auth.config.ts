import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Database } from '../db/reactor.js';
import { schema } from '../db/schema/index.js';
import { authConfig } from './auth.instance.js';

/**
 * This is a ghost(no db) instance ONLY used for the command below:
 *   bun x @better-auth/cli generate --config ./src/lib/auth.config.ts --output ./src/db/schema/better-auth.table.ts
 */
export const auth = betterAuth({
  ...authConfig,
  database: drizzleAdapter({} as Database, {
    provider: 'pg',
    schema
  })
});
