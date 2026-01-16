import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Standardized API Response for Ludicrous Speed
 */
export const reply = {
  /**
   * Success: 2xx
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
   */
  fail: (
    c: Context,
    message: string,
    status: ContentfulStatusCode = 400,
    extra: Record<string, unknown> = {}
  ) => {
    return c.json(
      {
        success: false,
        error: message,
        meta: extra
      },
      status
    );
  }
};
