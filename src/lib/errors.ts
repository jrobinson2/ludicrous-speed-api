import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type ErrorOptions = {
  code?: string;
  meta?: Record<string, unknown>;
  cause?: unknown; // logged by shield, never sent to the client
};

export class AppError extends Error {
  constructor(
    public override readonly message: string,
    public readonly status: ContentfulStatusCode = 500,
    public readonly code?: string,
    public readonly meta: Record<string, unknown> = {},
    cause?: unknown
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// --- DOMAIN ERRORS ---

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', options: ErrorOptions = {}) {
    super(
      message,
      400,
      options.code ?? 'BAD_REQUEST',
      options.meta,
      options.cause
    );
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Failed', options: ErrorOptions = {}) {
    super(
      message,
      400,
      options.code ?? 'VALIDATION_ERROR',
      options.meta,
      options.cause
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', options: ErrorOptions = {}) {
    super(
      message,
      401,
      options.code ?? 'UNAUTHORIZED',
      options.meta,
      options.cause
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', options: ErrorOptions = {}) {
    super(
      message,
      403,
      options.code ?? 'FORBIDDEN',
      options.meta,
      options.cause
    );
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', options: ErrorOptions = {}) {
    super(
      message,
      404,
      options.code ?? 'NOT_FOUND',
      options.meta,
      options.cause
    );
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', options: ErrorOptions = {}) {
    super(
      message,
      409,
      options.code ?? 'CONFLICT',
      options.meta,
      options.cause
    );
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Request body too large', options: ErrorOptions = {}) {
    super(
      message,
      413,
      options.code ?? 'PAYLOAD_TOO_LARGE',
      options.meta,
      options.cause
    );
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', options: ErrorOptions = {}) {
    super(
      message,
      429,
      options.code ?? 'RATE_LIMIT_EXCEEDED',
      options.meta,
      options.cause
    );
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', options: ErrorOptions = {}) {
    super(
      message,
      500,
      options.code ?? 'INTERNAL_SERVER_ERROR',
      options.meta,
      options.cause
    );
  }
}

// --- INFRASTRUCTURE ERRORS ---

export class BadGatewayError extends AppError {
  constructor(message = 'Bad Gateway', options: ErrorOptions = {}) {
    super(
      message,
      502,
      options.code ?? 'BAD_GATEWAY',
      options.meta,
      options.cause
    );
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message = 'Gateway Timeout', options: ErrorOptions = {}) {
    super(
      message,
      504,
      options.code ?? 'GATEWAY_TIMEOUT',
      options.meta,
      options.cause
    );
  }
}
