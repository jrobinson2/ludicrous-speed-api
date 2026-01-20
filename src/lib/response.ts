import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Standardized API Response Vessel (JSend-Inspired)
 * * DESIGN PRINCIPLES:
 * 1. Consistent Structure: Every response returns a `success` boolean.
 * 2. Frontend-Friendly: Error metadata is "flattened" at the top level.
 * This allows TanStack Query, SWR, or Axios to access error codes
 * directly (e.g., `error.code`) without nesting (e.g., `error.meta.code`).
 * 3. Type Safety: Uses Generics to ensure metadata remains type-safe
 * without resorting to 'any'.
 * * @see https://github.com/omniti-labs/jsend
 */
export const reply = {
  /**
   * Success: 2xx
   * Returns data wrapped in a success object.
   * * @param c - Hono Context
   * @param data - The payload to return
   * @param status - HTTP Status Code (Default: 200)
   */
  ok: <T>(c: Context, data: T, status: ContentfulStatusCode = 200) => {
    return c.json(
      {
        success: true,
        data
      },
      status
    );
  },

  /**
   * Error: 4xx / 5xx
   * Returns an error message and flattens additional metadata.
   * * @param c - Hono Context
   * @param message - Human-readable error message
   * @param status - HTTP Status Code (Default: 400)
   * @param meta - Optional object containing 'code', 'trace', or 'details'
   */
  fail: <P extends Record<string, unknown>>(
    c: Context,
    message: string,
    status: ContentfulStatusCode = 400,
    meta?: P
  ) => {
    return c.json(
      {
        success: false,
        error: message,
        ...meta
      },
      status
    );
  }
};
