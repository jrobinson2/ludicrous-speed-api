import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import type { Bindings, Variables } from '../lib/env.js';
import * as UserService from '../services/user.js';

// 1. Pass types to Hono to enable autocomplete for c.get('logger') and c.env
const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

// --- Routes ---

userRoutes.get('/', async (c) => {
  const logger = c.get('logger');
  logger.info('🛰️ Fetching all users at Ludicrous Speed');

  const db = getDb(c.env.DATABASE_URL);
  const data = await UserService.getAllUsers(db);

  return c.json({ success: true, data });
});

userRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = getDb(c.env.DATABASE_URL);

  // Note: If user is not found, UserService throws NotFoundError
  // which is caught by our global exception handler!
  const user = await UserService.getUserById(db, id);

  return c.json({ success: true, data: user });
});

userRoutes.post('/', zValidator('json', userSchema), async (c) => {
  const logger = c.get('logger');
  const validated = c.req.valid('json');
  const db = getDb(c.env.DATABASE_URL);

  const newUser = await UserService.createUser(db, validated);

  logger.info({ msg: '👤 New user created', userId: newUser.id });

  return c.json({ success: true, data: newUser }, 201);
});

// Example route for the GitHub API service we added
userRoutes.get('/github/:username', async (c) => {
  const username = c.req.param('username');
  const profile = await UserService.getGitHubProfile(username);

  return c.json({ success: true, data: profile });
});

export default userRoutes;
