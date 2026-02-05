import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { API_POLICY } from './lib/constraints.js';
import type { Bindings, Variables } from './lib/env.js';
import { PayloadTooLargeError } from './lib/errors.js';

import { configMiddleware } from './middleware/config.js';
import { apiGuard } from './middleware/metadata.guard.js';
import { sessionMiddleware } from './middleware/session.js';
import { shield } from './middleware/shield.js';

import authRoutes from './routes/auth.routes.js';
import habitRoutes from './routes/habit.routes.js';
import userRoutes from './routes/user.routes.js';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(secureHeaders());
app.use(cors());

app.use(configMiddleware);

app.on(
  [...API_POLICY.ALLOWED_METHODS],
  '/api/*',
  apiGuard,
  bodyLimit({
    maxSize: API_POLICY.MAX_JSON_SIZE,
    onError: () => {
      throw new PayloadTooLargeError();
    }
  })
);

app.use('/api/users/*', sessionMiddleware);
app.use('/api/habits/*', sessionMiddleware);

app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/habits', habitRoutes);

app.onError(shield);

export default app;
