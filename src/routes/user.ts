import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../lib/env.js';
import { reply } from '../lib/response.js';
import * as UserService from '../services/user.js';

const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
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

  // 1. Grab the traceable child logger from context
  const logger = c.get('logger');

  // 2. Pass it into the service
  const profile = await UserService.getGitHubProfile(username, logger);

  return reply.ok(c, profile);
});

export default userRoutes;
