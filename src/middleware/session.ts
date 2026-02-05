import { createMiddleware } from 'hono/factory';
import { getAuth } from '../lib/auth.instance.js';
import type { Bindings, Variables } from '../lib/env.js';
import { UnauthorizedError } from '../lib/errors.js';

export const sessionMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const auth = getAuth(c.get('db'), c.get('config'));

  // Better Auth parses the session from the request headers/cookies
  const session = await auth.api.getSession({
    headers: c.req.raw.headers
  });

  if (!session) {
    throw new UnauthorizedError(
      'You must be logged in to access this resource'
    );
  }

  c.set('user', session.user);
  c.set('session', session.session);

  await next();
});
