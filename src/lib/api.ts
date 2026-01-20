import {
  createFetch,
  type FetchContext,
  type FetchOptions,
  type ResponseType
} from 'ofetch';
import type { z } from 'zod';
import { BadGatewayError, GatewayTimeoutError } from './errors.js';
import { getLogger, type Logger } from './logger.js';

/**
 * Options for the Ludicrous Fetch wrapper.
 * Extends ofetch options with Zod schema validation and localized logging.
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
 * High-performance Fetch wrapper designed for the Edge.
 * Features automated Zod validation, localized logging, and standardized error handling.
 */
export const api = async <T = unknown>(
  url: string,
  options: LudicrousOptions<T> = {}
): Promise<T> => {
  const { logger: providedLogger, schema, ...fetchOptions } = options;

  /**
   * Use the provided logger (likely a child logger with a reqId),
   * or fall back to the global cached logger.
   */
  const log =
    providedLogger ??
    getLogger().child({ trace: 'LOGGER_NOT_PASSED_TO_API_WRAPPER' });

  const data = await $api<unknown>(url, {
    ...fetchOptions,

    onResponseError(context: FetchContext<unknown, ResponseType>) {
      const { request, response } = context;
      const status = response?.status ?? 502;

      log.error(
        {
          status,
          url: request,
          upstreamError: response?._data
        },
        '❌ External API Failure'
      );

      throw new BadGatewayError(
        `Upstream Error: ${response?.statusText || status}`,
        {
          code: 'UPSTREAM_RESPONSE_ERROR',
          meta: {
            status,
            upstream_data: response?._data,
            url: request
          }
        }
      );
    },

    onRequestError(context: FetchContext<unknown, ResponseType>) {
      const { request, error } = context;

      log.error(
        {
          url: request,
          err: error instanceof Error ? error.message : 'Unknown network error'
        },
        '📡 Network/Connection Error'
      );

      throw new GatewayTimeoutError('Gateway Timeout or Network Failure', {
        code: 'UPSTREAM_NETWORK_ERROR',
        meta: {
          url: request,
          original_error: error instanceof Error ? error.message : 'Unknown'
        }
      });
    }
  });

  // --- 🛰️ Zod Validation Step ---
  if (schema) {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errorDetails = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }));

      log.error(
        {
          errors: errorDetails,
          url,
          receivedData: data // Helpful for debugging schema mismatches
        },
        '❌ API Response Schema Mismatch'
      );

      throw new BadGatewayError('Upstream provided invalid data shape', {
        code: 'UPSTREAM_SCHEMA_MISMATCH',
        meta: {
          details: errorDetails,
          url
        }
      });
    }

    return result.data;
  }

  return data as T;
};
