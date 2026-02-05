import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../lib/env.js';
import { UnauthorizedError } from '../lib/errors.js';
import { reply } from '../lib/response.js';
import { sessionMiddleware } from '../middleware/session.js';
import * as UserService from '../services/user.service.js';

const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// --- Routes ---

userRoutes.get('/', async (c) => {
  reply.ok(c, { message: 'users' }, 200);
});

userRoutes.get('/:id', async (c) => {
  reply.ok(c, { message: 'user' }, 200);
});

userRoutes.put('/:id', async (c) => {
  reply.ok(c, { message: 'update user' }, 200);
});

userRoutes.delete('/:id', async (c) => {
  reply.ok(c, { message: 'delete user' }, 200);
});

/**
 * GET /api/auth/me
 * The "Who Am I?" check. Verifies the session is alive and
 * shows the data stored in the Context Suitcase.
 */

userRoutes.get('/me', (c) => {
  const user = c.get('user');
  const { NODE_ENV } = c.get('config');

  if (!user) {
    throw new UnauthorizedError();
  }

  return reply.ok(c, {
    id: user.id,
    email: user.email,
    name: user.name,
    environment: NODE_ENV,
    verified: user.emailVerified
  });
});

export default userRoutes;
