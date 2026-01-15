import { Hono } from 'hono';
import type { Bindings, Variables } from './lib/env.js';
import { configMiddleware } from './middleware/config.js';
import { globalErrorHandler } from './middleware/exception.js';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', configMiddleware);
app.onError(globalErrorHandler);

app.get('/', (c) => {
  return c.json({ message: 'Welcome to the Ludicrous Speed API!' });
});

export default app;
