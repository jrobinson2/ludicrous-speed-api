import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { Bindings, Variables } from '../lib/env.js';

export const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const apiKey = c.req.header('X-API-KEY');

  if (!apiKey || apiKey !== c.env.API_KEY) {
    const logger = c.get('logger');
    logger.warn({
      msg: '🛡️ Unauthorized access attempt',
      path: c.req.path,
      ip: c.req.header('x-forwarded-for')
    });

    throw new HTTPException(401, { message: 'Unauthorized: Access Denied' });
  }

  await next();
});
