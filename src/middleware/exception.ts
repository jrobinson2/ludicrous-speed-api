import type { ErrorHandler } from 'hono';
import { env } from 'hono/adapter'; // Added for bulletproof Env access
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod'; // Added to catch validation failures
import type { Bindings, Variables } from '../lib/env.js';
import { AppError } from '../lib/errors.js';
import { reply } from '../lib/response.js';

export const globalErrorHandler: ErrorHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = (err, c) => {
  const logger = c.get('logger');

  // Use the adapter to check environment consistently
  const runtimeEnv = env(c);
  const isDev = runtimeEnv.NODE_ENV === 'development';

  // 1. Structured Logging
  logger?.error(
    {
      path: c.req.path,
      method: c.req.method,
      err:
        err instanceof Error
          ? {
              name: err.name,
              message: err.message,
              stack: isDev ? err.stack : undefined
            }
          : err
    },
    '💥 Ludicrous Error Detected'
  );

  // 2. Handle Zod Validation Errors (NEW)
  if (err instanceof ZodError) {
    return reply.fail(c, 'Validation Failed', 400, {
      details: err.flatten().fieldErrors, // Returns exactly which fields failed
      code: 'VALIDATION_ERROR'
    });
  }

  // 3. Handle Custom App Errors (NotFoundError, etc.)
  if (err instanceof AppError) {
    return reply.fail(c, err.message, err.status as ContentfulStatusCode, {
      code: err.code
    });
  }

  // 4. Handle Hono HTTPExceptions (e.g., 401 Unauthorized from Hono middleware)
  if (err instanceof HTTPException) {
    return reply.fail(c, err.message, err.status);
  }

  // 5. Handle Database/Neon Specific Errors
  // Catching Postgres unique constraint violations (error code 23505)
  if (err instanceof Error && err.message.includes('unique constraint')) {
    return reply.fail(c, 'Resource already exists', 409, {
      code: 'CONFLICT_ERROR'
    });
  }

  // 6. Critical Failures (500)
  const message = isDev ? err.message : 'Internal Server Error';

  return c.json(
    {
      success: false,
      error: message,
      ...(isDev && { stack: err.stack })
    },
    500
  );
};
