import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { insertUserSchema } from '../db/schema/index.js';
import { getAuth } from '../lib/auth.instance.js';
import type { Bindings, Variables } from '../lib/env.js';
import { reply } from '../lib/response.js';
import * as AuthService from '../services/auth.service.js';

const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

authRoutes.post(
  '/magic-link',
  zValidator('json', insertUserSchema.pick({ email: true })),
  async (c) => {
    const { email } = c.req.valid('json');
    const db = c.get('db');
    const config = c.get('config');
    const logger = c.get('logger');
    const headers = c.req.raw.headers;

    logger.debug({ email }, '🔐 Requesting magic link');

    await AuthService.sendMagicLink(db, config, email, headers);

    return reply.ok(c, { message: 'Check your inbox for a login link.' });
  }
);

/**
 * Better Auth Universal Handler
 * * This catch-all route captures all GET and POST requests directed to the auth sub-router.
 * It acts as a proxy, passing the standard Web Request to Better Auth's internal
 * router to handle core logic, session management, and plugin endpoints.
 * * @example
 * - GET  /callback/magic-link  (Verifies magic link tokens)
 * - GET  /session             (Returns the current user session)
 * - POST /sign-in/email       (Standard email/password entry)
 * - POST /sign-out            (Clears session cookies)
 * * @param {string} path - "/**" catches all sub-paths.
 * @returns {Promise<Response>} The Response object returned by Better Auth.
 */
authRoutes.on(['POST', 'GET'], '/**', async (c) => {
  const auth = getAuth(c.get('db'), c.get('config'));
  return auth.handler(c.req.raw);
});

export default authRoutes;
