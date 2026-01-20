import { env } from 'hono/adapter';
import { createMiddleware } from 'hono/factory';
import { getDb } from '../db/client.js';
import { type Bindings, envSchema } from '../lib/env.js';
import { getLogger } from '../lib/logger.js';

let cachedConfig: {
  db: ReturnType<typeof getDb>;
  logger: ReturnType<typeof getLogger>;
  isDev: boolean;
} | null = null;

export const configMiddleware = createMiddleware(async (c, next) => {
  if (!cachedConfig) {
    const runtimeEnv = env<Bindings>(c);

    const result = envSchema.safeParse(runtimeEnv);

    if (!result.success) {
      console.error('❌ Env Validation Failed:', result.error.format());
      throw new Error('Invalid Environment');
    }

    cachedConfig = {
      db: getDb(result.data.DATABASE_URL),
      logger: getLogger(result.data.NODE_ENV),
      isDev: result.data.NODE_ENV === 'development'
    };
  }

  const reqId = (c.req.header('x-request-id') || crypto.randomUUID()) as string;

  // Create a request-scoped child logger
  const requestLogger = cachedConfig.logger.child({
    reqId,
    method: c.req.method,
    path: c.req.path
  });

  // Inject into Context
  c.set('db', cachedConfig.db);
  c.set('logger', requestLogger);
  c.set('isDev', cachedConfig.isDev);

  // Echo back for the client
  c.res.headers.set('x-request-id', reqId);

  await next();
});
