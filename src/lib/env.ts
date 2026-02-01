import { z } from 'zod';
import type { Database } from '../db/reactor.js';
import type { getLogger } from './logger.js';
import { isRuntime } from './runtime.js';
import { database } from './zod-schemas.js';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: database.neonUrl(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url()
});

export type Bindings = z.infer<typeof envSchema>;

export type Variables = {
  logger: ReturnType<typeof getLogger>;
  db: Database;
  isDev: boolean;
};

/**
 * Runtime helper to require environment variables in Node/Bun
 */
export function requireEnv(key: string): string {
  if (isRuntime.Node || isRuntime.Bun) {
    const value = process.env[key];
    if (!value) throw new Error(`Environment variable "${key}" is required`);
    return value;
  }

  throw new Error(
    `requireEnv("${key}") can only be used in Node/Bun environments.`
  );
}
