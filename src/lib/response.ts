import type { Context } from 'hono';
// Change 'StatusCode' to 'ContentfulStatusCode'
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
  fail: (c: Context, message: string, status: ContentfulStatusCode = 400) => {
    return c.json(
      {
        success: false,
        error: message
      },
      status
    );
  }
};
