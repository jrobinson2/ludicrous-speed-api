import { env } from 'hono/adapter';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';
import { getDb } from '../db/engine.js';
import { type Bindings, envSchema } from '../lib/env.js';
import { getLogger } from '../lib/logger.js';

export const configMiddleware = createMiddleware(async (c, next) => {
  const runtimeEnv = env<Bindings>(c);

  // Validate the environmental variables.
  const result = envSchema.safeParse(runtimeEnv);

  if (!result.success) {
    const missingFields = [
      ...new Set(result.error.issues.map((issue) => issue.path[0]))
    ].join(', ');

    console.error('❌ Environment Validation Failed:');
    console.error(z.treeifyError(result.error));

    throw new Error(
      `Ludicrous Speed cannot launch: Missing or invalid environment variables [ ${missingFields} ]`
    );
  }

  const { DATABASE_URL, NODE_ENV } = result.data;

  const db = getDb(DATABASE_URL);
  const rootLogger = getLogger(NODE_ENV);

  const reqId = (c.req.header('x-request-id') || crypto.randomUUID()) as string;
  const requestLogger = rootLogger.child({
    reqId,
    method: c.req.method,
    path: c.req.path
  });

  // Inject into Hono Context for use in routes/services
  c.set('db', db);
  c.set('logger', requestLogger);
  c.set('isDev', NODE_ENV === 'development');

  c.res.headers.set('x-request-id', reqId);

  await next();
});
