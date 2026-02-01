import { Hono } from 'hono';
import type { Bindings, Variables } from '../lib/env.js';
import { reply } from '../lib/response.js';

const habitRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// --- Routes ---

habitRoutes.get('/', async (c) => {
  reply.ok(c, { message: 'habits' }, 200);
});

habitRoutes.get('/:id', async (c) => {
  reply.ok(c, { message: 'habit' }, 200);
});

habitRoutes.post('/', async (c) => {
  reply.ok(c, { message: 'create habit' }, 201);
});

habitRoutes.delete('/:id', async (c) => {
  reply.ok(c, { message: `delete habit with id ${c.req.param('id')}` }, 200);
});

habitRoutes.post('/:id/complete', async (c) => {
  reply.ok(c, { message: `complete habit with id ${c.req.param('id')}` }, 200);
});

export default habitRoutes;
