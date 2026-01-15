import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Bindings, Variables } from '../lib/env.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';

export const globalErrorHandler: ErrorHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = (err, c) => {
  const logger = c.get('logger');
  const isDev = c.env.NODE_ENV === 'development';

  // 1. Centralized Logging
  logger.error({
    msg: '💥 Ludicrous Error Detected',
    error: err.message,
    path: c.req.path,
    method: c.req.method,
    stack: isDev ? err.stack : undefined
  });

  // 2. Handle Known Exceptions
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  if (err instanceof NotFoundError) {
    return c.json({ success: false, error: err.message }, 404);
  }

  if (err instanceof ConflictError) {
    return c.json({ success: false, error: err.message }, 409);
  }

  return c.json(
    {
      success: false,
      message: 'Internal Server Error',
      ...(isDev && { trace: err.stack })
    },
    500
  );
};
