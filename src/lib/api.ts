import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { z } from 'zod';

/**
 * Ludicrous Speed Native Fetch Wrapper
 */

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean>;
  schema?: z.ZodSchema;
  timeout?: number;
};

/**
 * Type guard to check if an unknown error has a message property
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Internal response handler
 */
async function handleResponse<T>(
  res: Response,
  schema?: z.ZodSchema
): Promise<T> {
  const contentType = res.headers.get('content-type');
  let data: unknown;

  if (contentType?.includes('application/json')) {
    data = await res.json().catch(() => ({ message: 'Failed to parse JSON' }));
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    // Narrowing the 'unknown' data for error reporting
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : String(data);

    throw new HTTPException(res.status as ContentfulStatusCode, {
      message: message || `External API Error: ${res.statusText}`
    });
  }

  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.error('❌ Upstream Validation Error:', result.error.format());
      throw new HTTPException(502, {
        message: 'Upstream service returned data that failed validation'
      });
    }
    return result.data as T;
  }

  return data as T;
}

/**
 * Core Request Wrapper
 */
async function request<T>(
  url: string,
  method: string,
  options: FetchOptions = {},
  body?: unknown
): Promise<T> {
  const { timeout = 5000, params, headers, ...fetchInit } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const targetUrl = new URL(url);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      targetUrl.searchParams.append(key, String(value));
    }
  }

  try {
    const res = await fetch(targetUrl.toString(), {
      ...fetchInit,
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timer);
    return await handleResponse<T>(res, options.schema);
  } catch (error: unknown) {
    clearTimeout(timer);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new HTTPException(504, {
        message: `Request timeout after ${timeout}ms`
      });
    }

    if (error instanceof HTTPException) throw error;

    throw new HTTPException(500, {
      message: getErrorMessage(error) || 'Fetch request failed'
    });
  }
}

// --- Named Exports ---

export const get = <T>(url: string, options?: FetchOptions) =>
  request<T>(url, 'GET', options);

export const post = <T>(url: string, body: unknown, options?: FetchOptions) =>
  request<T>(url, 'POST', options, body);

export const put = <T>(url: string, body: unknown, options?: FetchOptions) =>
  request<T>(url, 'PUT', options, body);

export const patch = <T>(url: string, body: unknown, options?: FetchOptions) =>
  request<T>(url, 'PATCH', options, body);

export const del = <T>(url: string, options?: FetchOptions) =>
  request<T>(url, 'DELETE', options);
