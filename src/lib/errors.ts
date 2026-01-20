import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type ErrorOptions = {
  code?: string;
  meta?: Record<string, unknown>;
};

export class AppError extends Error {
  constructor(
    public override readonly message: string,
    public readonly status: ContentfulStatusCode = 500,
    public readonly code?: string,
    public readonly meta: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// --- DOMAIN ERRORS (Your Logic) ---

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', options: ErrorOptions = {}) {
    super(message, 400, options.code ?? 'BAD_REQUEST', options.meta);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation Failed', options: ErrorOptions = {}) {
    super(message, 400, options.code ?? 'VALIDATION_ERROR', options.meta);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', options: ErrorOptions = {}) {
    super(message, 401, options.code ?? 'UNAUTHORIZED', options.meta);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', options: ErrorOptions = {}) {
    super(message, 403, options.code ?? 'FORBIDDEN', options.meta);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', options: ErrorOptions = {}) {
    super(message, 404, options.code ?? 'NOT_FOUND', options.meta);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', options: ErrorOptions = {}) {
    super(message, 409, options.code ?? 'CONFLICT', options.meta);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', options: ErrorOptions = {}) {
    super(message, 429, options.code ?? 'RATE_LIMIT_EXCEEDED', options.meta);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', options: ErrorOptions = {}) {
    super(message, 500, options.code ?? 'INTERNAL_SERVER_ERROR', options.meta);
  }
}

// --- INFRASTRUCTURE ERRORS (External Services) ---

export class BadGatewayError extends AppError {
  constructor(message = 'Bad Gateway', options: ErrorOptions = {}) {
    super(message, 502, options.code ?? 'BAD_GATEWAY', options.meta);
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message = 'Gateway Timeout', options: ErrorOptions = {}) {
    super(message, 504, options.code ?? 'GATEWAY_TIMEOUT', options.meta);
  }
}
