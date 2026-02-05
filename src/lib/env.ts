import type { betterAuth } from 'better-auth';
import { z } from 'zod';
import type { Database } from '../db/reactor.js';
import type { PlaidLogger } from './logger.js';
import { database } from './validators.js';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3007),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: database.neonUrl(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url()
});

export type Bindings = z.infer<typeof envSchema>;

type Auth = ReturnType<typeof betterAuth>;
export type User = Auth['$Infer']['Session']['user'];
export type Session = Auth['$Infer']['Session']['session'];

export type Variables = {
  logger: PlaidLogger;
  db: Database;
  config: Bindings;
  user: User | null;
  session: Session | null;
};
