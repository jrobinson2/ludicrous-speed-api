import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import type { Database } from '../db/reactor.js';
import { schema } from '../db/schema/index.js';
import type { Bindings } from './env.js';

export const authConfig = {
  experimental: { joins: true },
  advanced: {
    cookiePrefix: 'ludicrous'
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.log(`\n🚀 LUDICROUS LOGIN [${email}]\n🔗 LINK: ${url}\n`);
      }
    })
  ]
} satisfies Parameters<typeof betterAuth>[0];

type AuthInstance = ReturnType<typeof betterAuth<typeof authConfig>>;

let authInstance: AuthInstance | null = null;
let lastDb: Database | null = null;
let lastUrl: string | null = null;
let lastSecret: string | null = null;

export const getAuth = (db: Database, env: Bindings): AuthInstance => {
  const currentUrl = env.BETTER_AUTH_URL || 'http://localhost:3007';
  const currentSecret = env.BETTER_AUTH_SECRET;
  const isProd = env.NODE_ENV === 'production';

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
      secret: currentSecret,
      advanced: {
        ...authConfig.advanced,
        useSecureCookies: isProd
      }
    }) as AuthInstance;
  }

  if (!authInstance) {
    throw new Error('Failed to initialize Better Auth instance');
  }

  return authInstance;
};
