import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Optional error fields. Only these well-known keys are flattened to the top
 * level of the response, so free-form data goes under `details` and can never
 * collide with `success` or `error`.
 */
export type ErrorMeta = {
  code?: string;
  requestId?: string;
  details?: unknown; // Zod tree, AppError.meta, etc.
  stack?: string; // development only
};

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: string } & ErrorMeta;

/**
 * Standardized API Response Vessel (JSend-Inspired)
 *
 * DESIGN PRINCIPLES:
 * 1. Consistent Structure: Every response returns a `success` boolean.
 * 2. Frontend-Friendly: `code` and `requestId` sit at the top level, so
 *    TanStack Query, SWR, or Axios can read `error.code` directly without
 *    nesting (e.g., `error.meta.code`).
 * 3. Type Safety: `ErrorMeta` limits the extra fields to a known set, and
 *    `ApiSuccess` / `ApiFailure` can be shared with the frontend and tests.
 *
 * @see https://github.com/omniti-labs/jsend
 */
export const reply = {
  /**
   * Success: 2xx
   *
   * @param c - Hono Context
   * @param data - The payload to return
   * @param status - HTTP Status Code (Default: 200)
   */
  ok: <T>(c: Context, data: T, status: ContentfulStatusCode = 200) =>
    c.json({ success: true, data } satisfies ApiSuccess<T>, status),

  /**
   * Error: 4xx / 5xx
   *
   * @param c - Hono Context
   * @param message - Human-readable error message
   * @param status - HTTP Status Code (Default: 400)
   * @param meta - Optional `code`, `requestId`, `details`, `stack`.
   *   `requestId` defaults to the `x-request-id` response header.
   */
  fail: (
    c: Context,
    message: string,
    status: ContentfulStatusCode = 400,
    meta: ErrorMeta = {}
  ) =>
    c.json(
      {
        ...meta,
        requestId:
          meta.requestId ?? c.res.headers.get('x-request-id') ?? undefined,
        // Spread first, so nothing in `meta` can overwrite these two
        success: false,
        error: message
      } satisfies ApiFailure,
      status
    )
};
