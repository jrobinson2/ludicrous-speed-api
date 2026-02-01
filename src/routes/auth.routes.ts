import { Hono } from 'hono';
import type { Bindings, Variables } from '../lib/env.js';
import { reply } from '../lib/response.js';

// import * as AuthService from '../services/auth.service.js';

const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// --- Routes ---

authRoutes.post('/register', async (c) => {
  const logger = c.get('logger');
  logger.info('🔐 Registering a new user');

  reply.ok(c, { message: 'User registration endpoint' }, 201);
});

authRoutes.post('/login', async (c) => {
  reply.ok(c, { message: 'User log in endpoint' });
});

export default authRoutes;
