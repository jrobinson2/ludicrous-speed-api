import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import type { Database } from '../db/reactor.js';
import { schema } from '../db/schema/index.js';
import type { Bindings } from './env.js';

type AuthInstance = ReturnType<typeof betterAuth>;

/**
 * Internal state to track the singleton instance and
 * detect if the execution context or config has changed.
 */
let authInstance: AuthInstance | null = null;
let lastDb: Database | null = null;
let lastUrl: string | null = null;
let lastSecret: string | null = null;

/**
 * 1️⃣ STATIC CONFIG
 */
export const authConfig = {
  experimental: { joins: true },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.log(`🚀 LUDICROUS LOGIN [${email}]: ${url}`);
      }
    })
  ]
} satisfies Parameters<typeof betterAuth>[0];

/**
 * 2️⃣ CLI AUTH INSTANCE
 * Uses Drizzle adapter WITHOUT a real DB
 */
export const auth = betterAuth({
  ...authConfig,
  database: drizzleAdapter({} as Database, {
    provider: 'pg',
    schema
  })
});

/**
 * 3️⃣ RUNTIME AUTH
 */
export const getAuth = (db: Database, env: Bindings): AuthInstance => {
  const currentUrl = env.BETTER_AUTH_URL || 'http://localhost:3000';
  const currentSecret = env.BETTER_AUTH_SECRET || 'dev_secret_123';

  const isStale =
    !authInstance ||
    db !== lastDb ||
    currentUrl !== lastUrl ||
    currentSecret !== lastSecret;

  if (isStale) {
    lastDb = db;
    lastUrl = currentUrl;
    lastSecret = currentSecret;

    authInstance = betterAuth({
      ...authConfig,
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema
      }),
      baseURL: currentUrl,
      secret: currentSecret
    });
  }

  if (!authInstance) {
    throw new Error('Failed to initialize Better Auth instance');
  }

  return authInstance;
};
