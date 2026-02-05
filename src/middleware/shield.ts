import { APIError } from 'better-auth';
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
  const { NODE_ENV } = c.get('config');
  const isDevelopment = NODE_ENV === 'development';
  const requestId = c.res.headers.get('x-request-id') ?? undefined;

  logger?.error('🛡️ SHIELD: Impact Detected (Error Caught)', {
    path: c.req.path,
    method: c.req.method,
    err,
    ...(err instanceof AppError && {
      code: err.code,
      meta: err.meta
    })
  });

  if (err instanceof ZodError) {
    const fieldErrors = z.treeifyError(err);

    return reply.fail(c, 'Validation Failed', 400, {
      details: fieldErrors,
      code: 'VALIDATION_ERROR',
      requestId
    });
  }

  if (err instanceof AppError) {
    return reply.fail(c, err.message, err.status as ContentfulStatusCode, {
      code: err.code,
      requestId,
      ...err.meta
    });
  }

  if (err instanceof APIError) {
    const authErr = err as unknown as { code?: string };

    return reply.fail(c, err.message, err.status as ContentfulStatusCode, {
      code: authErr.code ?? 'AUTH_ERROR',
      requestId
    });
  }

  if (err instanceof HTTPException) {
    return reply.fail(c, err.message, err.status, { requestId });
  }

  // Handles Postgres Unique Violations (SQLSTATE 23505)
  if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
    return reply.fail(c, 'Resource already exists', 409, {
      code: 'CONFLICT_ERROR',
      requestId
    });
  }

  if (err instanceof Error && err.message.includes('unique constraint')) {
    return reply.fail(c, 'Resource already exists', 409, {
      code: 'CONFLICT_ERROR',
      requestId
    });
  }

  const message = isDevelopment ? err.message : 'Internal Server Error';

  return reply.fail(c, message, 500, {
    code: 'INTERNAL_SERVER_ERROR',
    requestId,
    ...(isDevelopment && { stack: err.stack })
  });
};
