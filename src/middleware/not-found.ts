import type { NotFoundHandler } from 'hono';
import { reply } from '../lib/response.js';

export const notFound: NotFoundHandler = (c) => {
  return reply.fail(c, 'Not Found', 404);
};
