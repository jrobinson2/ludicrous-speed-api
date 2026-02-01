import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Bindings, Variables } from '../lib/env.js';
import { reply } from '../lib/response.js';
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

export default userRoutes;
