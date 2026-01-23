import { z } from 'zod';
import type { Database } from '../db/engine.js';
import type { getLogger } from './logger.js';
import { neon } from './neon-schema.js';
import { isRuntime } from './runtime.js';

export const envSchema = z.object({
  DATABASE_URL: neon.databaseUrl(),
  API_KEY: z.string().min(1),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000)
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
