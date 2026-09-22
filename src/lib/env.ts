import type { betterAuth } from 'better-auth';
import { z } from 'zod';
import type { Database } from '../db/reactor.js';
import type { Logger } from './logger.js';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3007),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // DATABASE_URL: database.neonUrl(),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url()
});

export type Bindings = z.infer<typeof envSchema>;

/**
 * Validates raw env (process.env, Workers bindings, etc.) against the schema.
 * Pure and uncached — prefer `getConfig` unless you specifically need a
 * fresh, unmemoized validation.
 */
export const parseEnv = (raw: Record<string, unknown>): Bindings => {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const missingFields = [
      ...new Set(result.error.issues.map((issue) => issue.path[0]))
    ].join(', ');

    console.error('❌ Environment Validation Failed:');
    console.error(z.prettifyError(result.error));

    throw new Error(
      `Ludicrous Speed cannot launch: Missing or invalid environment variables [ ${missingFields} ]`
    );
  }

  return result.data;
};

let cachedConfig: Bindings | null = null;

/**
 * Lazy singleton. Validates on first contact (boot in server.ts, or the
 * first request on a cold edge isolate) and reuses the result for the life
 * of the process/isolate — env vars don't change mid-lifecycle, so
 * re-validating on every request is wasted work.
 */
export const getConfig = (raw: Record<string, unknown>): Bindings => {
  if (cachedConfig) return cachedConfig;
  cachedConfig = parseEnv(raw);
  return cachedConfig;
};

/** Resets the cached config. For tests only. */
export const resetConfigCache = () => {
  cachedConfig = null;
};

type Auth = ReturnType<typeof betterAuth>;
export type User = Auth['$Infer']['Session']['user'];
export type Session = Auth['$Infer']['Session']['session'];

export type Variables = {
  logger: Logger;
  db: Database;
  config: Bindings;
  user: User | null;
  session: Session | null;
  requestId: string;
};
