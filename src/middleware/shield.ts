import { APIError } from 'better-auth';
import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { type ZodError, z } from 'zod';
import type { Bindings, Variables } from '../lib/env.js';
import { AppError } from '../lib/errors.js';
import { reply } from '../lib/response.js';

type Mapped = {
  status: ContentfulStatusCode;
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
};

const pgCode = (e: unknown) =>
  e && typeof e === 'object' && 'code' in e ? e.code : undefined;

// Drizzle may wrap driver errors, so check `cause` too
const isUniqueViolation = (err: unknown) =>
  pgCode(err) === '23505' ||
  pgCode((err as { cause?: unknown } | null)?.cause) === '23505';

// Pure: maps an error to a response shape. No logging, no Hono context.
const mapError = (err: Error, isDev: boolean): Mapped => {
  if (err.name === 'ZodError') {
    return {
      status: 400,
      message: 'Validation Failed',
      code: 'VALIDATION_ERROR',
      details: z.treeifyError(err as ZodError)
    };
  }

  if (err instanceof AppError) {
    return {
      status: err.status,
      message: err.message,
      code: err.code,
      // meta is client-safe by contract; `cause` never leaves the server
      details: Object.keys(err.meta).length > 0 ? err.meta : undefined
    };
  }

  if (err instanceof APIError) {
    return {
      // verify: better-auth's `status` may be a string, `statusCode` the number
      status: (err.statusCode ?? 500) as ContentfulStatusCode,
      message: err.message,
      code: (err as { code?: string }).code ?? 'AUTH_ERROR'
    };
  }

  if (err instanceof HTTPException) {
    return { status: err.status, message: err.message };
  }

  if (isUniqueViolation(err)) {
    return {
      status: 409,
      message: 'Resource already exists',
      code: 'CONFLICT'
    };
  }

  return {
    status: 500,
    message: isDev ? err.message : 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR',
    stack: isDev ? err.stack : undefined
  };
};

export const shield: ErrorHandler<{
  Bindings: Bindings;
  Variables: Variables;
}> = (err, c) => {
  const logger = c.get('logger');
  // Optional chain on purpose: configMiddleware may have failed before setting these
  const isDev = c.get('config')?.NODE_ENV === 'development';

  const { status, message, code, details, stack } = mapError(err, isDev);

  const ctx = {
    status,
    code,
    path: c.req.path,
    method: c.req.method,
    cause: err.cause
  };

  // One log line per error, severity by status
  if (status >= 500) {
    logger?.error('🛡️ SHIELD: Server error', { ...ctx, err });
  } else {
    logger?.warn(`🛡️ SHIELD: ${message}`, ctx);
  }

  return reply.fail(c, message, status, { code, details, stack });
};
