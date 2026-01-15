import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { z } from 'zod';

/**
 * Ludicrous Speed Native Fetch Wrapper
 * Leveraging Bun's high-performance native fetch with Named Exports.
 */

type FetchOptions = RequestInit & {
  params?: Record<string, string | number>;
  schema?: z.ZodSchema;
};

/**
 * Internal response handler
 * Throws Hono HTTPExceptions to be caught by the global error handler.
 */
async function handleResponse<T>(
  res: Response,
  schema?: z.ZodSchema
): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({
      message: res.statusText || 'External API Error'
    }));

    throw new HTTPException(res.status as ContentfulStatusCode, {
      message: errorData.message || 'Internal Service Request Failed'
    });
  }

  const data = await res.json();

  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.error('❌ API Validation Error:', result.error.format());
      throw new HTTPException(502, {
        message: 'Upstream service returned data that failed validation'
      });
    }
    return result.data as T;
  }

  return data as T;
}

export async function get<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const targetUrl = options.params
    ? `${url}?${new URLSearchParams(options.params as any)}`
    : url;

  return fetch(targetUrl, {
    method: 'GET',
    ...options
  }).then((res) => handleResponse<T>(res, options.schema));
}

export async function post<T>(
  url: string,
  body: any,
  options: FetchOptions = {}
): Promise<T> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(body),
    ...options
  }).then((res) => handleResponse<T>(res, options.schema));
}

export async function put<T>(
  url: string,
  body: any,
  options: FetchOptions = {}
): Promise<T> {
  return fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(body),
    ...options
  }).then((res) => handleResponse<T>(res, options.schema));
}

export async function patch<T>(
  url: string,
  body: any,
  options: FetchOptions = {}
): Promise<T> {
  return fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(body),
    ...options
  }).then((res) => handleResponse<T>(res, options.schema));
}

export async function del<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  return fetch(url, {
    method: 'DELETE',
    ...options
  }).then((res) => handleResponse<T>(res, options.schema));
}
