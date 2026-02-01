import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { Bindings, Variables } from './lib/env.js';
import { configMiddleware } from './middleware/config.js';
import { shield } from './middleware/shield.js';
import authRoutes from './routes/auth.routes.js';
import habitRoutes from './routes/habit.routes.js';
import userRoutes from './routes/user.routes.js';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(secureHeaders());
app.use(cors());
app.use(configMiddleware);

app.onError(shield);

app.route('/api/auth', authRoutes);
app.route('/api/habits', habitRoutes);
app.route('/api/users', userRoutes);

export default app;
