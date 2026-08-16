import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth/minimal';
import { magicLink } from 'better-auth/plugins';
import type { Database } from '../db/reactor.js';
import { schema } from '../db/schema/index.js';
import type { Bindings } from './env.js';

export const authConfig = {
  experimental: {
    joins: true as const
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.log(`\n🚀 LUDICROUS LOGIN [${email}]\n🔗 LINK: ${url}\n`);
      }
    })
  ]
};

export type AuthInstance = ReturnType<
  typeof betterAuth<
    {
      database: ReturnType<typeof drizzleAdapter>;
      baseURL: string;
      secret: string;
      advanced: {
        cookiePrefix: string;
        useSecureCookies: boolean;
      };
    } & typeof authConfig
  >
>;

let authInstance: AuthInstance | null = null;
let lastDb: Database | null = null;
let lastUrl: string | null = null;
let lastSecret: string | null = null;

/**
 * Factory function to retrieve or initialize the Better Auth instance.
 * Optimized for 'better-auth/minimal' to reduce production bundle size.
 */
export const getAuth = (db: Database, env: Bindings): AuthInstance => {
  const currentUrl = env.BETTER_AUTH_URL || 'http://localhost:3007';
  const currentSecret = env.BETTER_AUTH_SECRET;
  const isProd = env.NODE_ENV === 'production';

  // Check if configuration has changed since last initialization to determine if we need to create a new instance
  const isStale =
    !authInstance ||
    db !== lastDb ||
    currentUrl !== lastUrl ||
    currentSecret !== lastSecret;

  if (isStale) {
    lastDb = db;
    lastUrl = currentUrl;
    lastSecret = currentSecret;

    const newInstance = betterAuth({
      ...authConfig,
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema
      }),
      baseURL: currentUrl,
      secret: currentSecret,
      advanced: {
        cookiePrefix: 'ludicrous',
        useSecureCookies: isProd
      }
    });

    authInstance = newInstance as unknown as AuthInstance;
  }

  if (!authInstance) {
    throw new Error('Failed to initialize Better Auth instance');
  }

  return authInstance;
};
