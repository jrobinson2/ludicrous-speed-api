import { createFetch, FetchError, type FetchOptions } from 'ofetch';
import type { z } from 'zod';
import { BadGatewayError, NotFoundError } from './errors.js';

type ApiOptions<T> = FetchOptions<'json'> & { schema?: z.ZodType<T> };

const $api = createFetch({
  defaults: {
    timeout: 5000,
    retryDelay: 500,
    responseType: 'json'
  }
});

/**
 * Fetch wrapper for calling upstream APIs.
 * - Retries and timeouts via ofetch
 * - Optional Zod validation of the response body
 * - Failures become AppErrors. `cause` is logged by shield, never sent to the client.
 *
 * Error mapping:
 * - Upstream 404          -> NotFoundError (404)
 * - Other 4xx/5xx         -> BadGatewayError (502), meta.upstreamStatus
 * - Timeout / network     -> BadGatewayError (502)
 * - Schema mismatch       -> BadGatewayError (502)
 */
export const api = async <T = unknown>(
  url: string,
  { schema, ...options }: ApiOptions<T> = {}
): Promise<T> => {
  let data: unknown;

  try {
    data = await $api<unknown>(url, options);
  } catch (err) {
    if (!(err instanceof FetchError)) throw err;

    // Upstream answered with a 4xx/5xx (after retries)
    if (err.response) {
      const status = err.response.status;

      // Upstream said "not found": a valid answer, not a gateway failure
      if (status === 404) {
        throw new NotFoundError('Resource not found', { cause: err });
      }

      throw new BadGatewayError(`Upstream Error: ${err.statusText || status}`, {
        code: 'UPSTREAM_RESPONSE_ERROR',
        meta: { upstreamStatus: status },
        cause: err
      });
    }

    // No response: timeout, DNS, connection reset
    throw new BadGatewayError('Upstream unreachable', {
      code: 'UPSTREAM_UNAVAILABLE',
      cause: err
    });
  }

  if (!schema) return data as T;

  const result = schema.safeParse(data);

  if (!result.success) {
    throw new BadGatewayError('Upstream provided invalid data shape', {
      code: 'UPSTREAM_SCHEMA_MISMATCH',
      cause: result.error // issues include paths and messages
    });
  }

  return result.data;
};
