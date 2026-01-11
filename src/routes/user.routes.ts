import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../lib/env.js';
import { reply } from '../lib/response.js';
import * as UserService from '../services/user.service.js';

const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const userSchema = z.object({
  name: z.string().min(2),
  email: z.email()
});

// --- Routes ---

userRoutes.get('/', async (c) => {
  const logger = c.get('logger');
  logger.info('🛰️ Fetching all users at Ludicrous Speed');

  const db = c.get('db');
  const data = await UserService.getAllUsers(db);

  return reply.ok(c, data);
});

userRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = c.get('db');

  const user = await UserService.getUserById(db, id);

  return reply.ok(c, user);
});

userRoutes.post('/', zValidator('json', userSchema), async (c) => {
  const logger = c.get('logger');
  const validated = c.req.valid('json');
  const db = c.get('db');

  const newUser = await UserService.createUser(db, validated);

  logger.info({ msg: '👤 New user created', userId: newUser.id });

  return reply.ok(c, newUser, 201);
});

userRoutes.get('/github/:username', async (c) => {
  const username = c.req.param('username');
  const logger = c.get('logger'); // Traceable child logger from configMiddleware

  // Pass logger into the service to maintain the trace through the external fetch
  const profile = await UserService.getGitHubProfile(username, logger);

  return reply.ok(c, profile);
});

export default userRoutes;
