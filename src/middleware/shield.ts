import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError, z } from 'zod';
import type { Bindings, Variables } from '../lib/env.js';
import { AppError } from '../lib/errors.js';
import { reply } from '../lib/response.js';

export const shield: ErrorHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = (err, c) => {
  const logger = c.get('logger');
  const isDev = c.get('isDev') ?? false;

  // 1. Structured Logging
  // We pass the raw error directly. PlaidLogger's high-speed loop
  // will handle the message, stack, and serialization for us.
  logger?.error('🛡️ SHIELD: Impact Detected (Error Caught)', {
    path: c.req.path,
    method: c.req.method,
    err,
    // If it's a custom AppError, we explicitly pull out the code and meta
    // to ensure they are top-level keys in our JSON log.
    ...(err instanceof AppError && {
      code: err.code,
      meta: err.meta
    })
  });

  // 2. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const fieldErrors = z.treeifyError(err);

    return reply.fail(c, 'Validation Failed', 400, {
      details: fieldErrors,
      code: 'VALIDATION_ERROR'
    });
  }

  // 3. Handle Custom App Errors
  if (err instanceof AppError) {
    return reply.fail(c, err.message, err.status as ContentfulStatusCode, {
      code: err.code,
      ...err.meta // Automatically spreads any meta passed during 'throw'
    });
  }

  // 4. Handle Hono HTTPExceptions
  if (err instanceof HTTPException) {
    return reply.fail(c, err.message, err.status);
  }

  // 5. Handle Database Unique Constraint Violations
  if (err instanceof Error && err.message.includes('unique constraint')) {
    return reply.fail(c, 'Resource already exists', 409, {
      code: 'CONFLICT_ERROR'
    });
  }

  // 6. Generic Fallback (500)
  const message = isDev ? err.message : 'Internal Server Error';

  return reply.fail(c, message, 500, {
    code: 'INTERNAL_SERVER_ERROR',
    ...(isDev && { stack: err.stack })
  });
};
