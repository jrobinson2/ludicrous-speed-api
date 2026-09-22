import { env } from 'hono/adapter';
import { createMiddleware } from 'hono/factory';
import { getDb } from '../db/reactor.js';
import { type Bindings, getConfig, type Variables } from '../lib/env.js';
import { getLogger } from '../lib/logger.js';

export const configMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const config = getConfig(env<Bindings>(c));

  const logger = getLogger(config.NODE_ENV).with({
    reqId: c.get('requestId'),
    method: c.req.method,
    path: c.req.path
  });

  c.set('config', config);
  c.set('db', getDb(config.DATABASE_URL));
  c.set('logger', logger);

  await next();
});
