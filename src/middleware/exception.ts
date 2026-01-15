import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Bindings, Variables } from '../lib/env.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import { reply } from '../lib/response.js';

export const globalErrorHandler: ErrorHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = (err, c) => {
  const logger = c.get('logger');
  const isDev = c.env.NODE_ENV === 'development';

  // 1. Centralized Logging (Structured for Pino)
  logger.error(
    {
      err: err instanceof Error ? err : new Error(String(err)),
      path: c.req.path,
      method: c.req.method
    },
    '💥 Ludicrous Error Detected'
  );

  // 2. Handle Hono HTTPExceptions (like those thrown by Zod validator or our API wrapper)
  if (err instanceof HTTPException) {
    // We override the default response to maintain our JSON envelope
    return reply.fail(c, err.message, err.status);
  }

  // 3. Handle Domain-Specific Errors
  if (err instanceof NotFoundError) {
    return reply.fail(c, err.message, 404);
  }

  if (err instanceof ConflictError) {
    return reply.fail(c, err.message, 409);
  }

  // 4. Critical Failures (500)
  const message = isDev ? err.message : 'Internal Server Error';

  // We manually construct the 500 to include the trace in Dev mode
  return c.json(
    {
      success: false,
      error: message,
      ...(isDev && { trace: err.stack })
    },
    500
  );
};
