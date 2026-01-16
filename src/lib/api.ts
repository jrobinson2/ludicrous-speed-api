import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
  createFetch,
  type FetchContext,
  type FetchOptions,
  type ResponseType
} from 'ofetch';
import type { z } from 'zod';
import type { Logger } from './logger.js';

/**
 * 🛸 Ludicrous Options
 * Explicitly setting the ResponseType to 'json' to satisfy strict checking.
 */
type LudicrousOptions<T = unknown> = FetchOptions<'json'> & {
  logger?: Logger;
  schema?: z.Schema<T>;
};

const $api = createFetch({
  defaults: {
    retry: 2,
    retryDelay: 500,
    timeout: 5000,
    responseType: 'json'
  }
});

/**
 * 🛸 The Universal Fetch Instance
 */
export const api = async <T = unknown>(
  url: string,
  options: LudicrousOptions<T> = {}
): Promise<T> => {
  const { logger, schema, ...fetchOptions } = options;

  // Type-safe fallback
  const log = (logger ?? console) as unknown as Logger;

  const data = await $api<unknown>(url, {
    ...fetchOptions,

    // Replace <any, any> with specific FetchContext requirements
    onResponseError(context: FetchContext<unknown, ResponseType>) {
      const { request, response } = context;
      const status = (response?.status ?? 500) as ContentfulStatusCode;

      log.error(
        { status, url: request, error: response?._data },
        '❌ External API Failure'
      );

      throw new HTTPException(status, {
        message: `Upstream Error: ${response?.statusText || status}`
      });
    },

    onRequestError(context: FetchContext<unknown, ResponseType>) {
      const { request, error } = context;

      log.error(
        {
          url: request,
          err: error instanceof Error ? error.message : 'Unknown'
        },
        '📡 Network/Connection Error'
      );

      throw new HTTPException(504, {
        message: 'Gateway Timeout or Network Failure'
      });
    }
  });

  // --- 🛰️ Validation Step ---
  if (schema) {
    const result = schema.safeParse(data);

    if (!result.success) {
      log.error(
        { err: result.error.format(), url },
        '❌ API Response Schema Mismatch'
      );

      throw new HTTPException(502, {
        message: 'Bad Gateway: Upstream provided invalid data'
      });
    }

    return result.data;
  }

  return data as T;
};
