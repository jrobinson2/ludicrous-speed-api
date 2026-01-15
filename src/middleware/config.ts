import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { type Bindings, envSchema, type Variables } from '../lib/env.js';
import { getLogger } from '../lib/logger.js';

export const configMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const result = envSchema.safeParse(c.env);

  if (!result.success) {
    console.error('❌ Invalid Environment Variables:', result.error.format());
    throw new HTTPException(500, { message: 'Server Configuration Error' });
  }

  // Inject logger into request context
  c.set('logger', getLogger(result.data.NODE_ENV));

  await next();
});
