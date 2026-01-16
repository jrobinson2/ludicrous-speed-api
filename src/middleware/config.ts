import { env } from 'hono/adapter';
import { createMiddleware } from 'hono/factory';
import { getDb } from '../db/client.js';
import { type Bindings, envSchema } from '../lib/env.js';
import { getLogger } from '../lib/logger.js';

let cachedConfig: {
  db: ReturnType<typeof getDb>;
  logger: ReturnType<typeof getLogger>;
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
      logger: getLogger(result.data.NODE_ENV)
    };
  }

  const reqId = (c.req.header('x-request-id') || crypto.randomUUID()) as string;

  // Create the Pino Child Logger (Inherits parent config + adds reqId)
  const requestLogger = cachedConfig.logger.child({ reqId });

  // Inject into Context
  c.set('db', cachedConfig.db);
  c.set('logger', requestLogger);

  // Echo back for the client
  c.res.headers.set('x-request-id', reqId);

  await next();
});
