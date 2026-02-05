import { createMiddleware } from 'hono/factory';
import { API_POLICY } from '../lib/constraints.js';
import type { Bindings, Variables } from '../lib/env.js';
import { BadRequestError, PayloadTooLargeError } from '../lib/errors.js';

export const apiGuard = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const { method } = c.req;

  const isMutation = (API_POLICY.ALLOWED_METHODS as readonly string[]).includes(
    method
  );

  if (!isMutation) {
    return await next();
  }

  // --- Content-Type Check ---
  const contentType = c.req.header('content-type');
  if (!contentType?.includes(API_POLICY.CONTENT_TYPE_JSON)) {
    throw new BadRequestError(
      `Unsupported Media Type: Expected ${API_POLICY.CONTENT_TYPE_JSON}`,
      {
        code: 'INVALID_CONTENT_TYPE',
        meta: { received: contentType }
      }
    );
  }

  // --- Content-Length Check ---
  const length = Number(c.req.header('content-length'));
  if (length && length > API_POLICY.MAX_JSON_SIZE) {
    throw new PayloadTooLargeError('Payload exceeds maximum allowed size', {
      meta: { limit: API_POLICY.MAX_JSON_SIZE, actual: length }
    });
  }

  await next();
});
