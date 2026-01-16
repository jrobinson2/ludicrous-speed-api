import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { z } from 'zod';
import type { Logger } from './logger.js';

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean>;
  schema?: z.ZodSchema;
  timeout?: number;
  logger?: Logger;
};

async function request<T>(
  url: string,
  method: string,
  options: FetchOptions = {},
  body?: unknown
): Promise<T> {
  const {
    timeout = 5000,
    params,
    headers,
    logger,
    schema,
    ...fetchInit
  } = options;

  const searchParams = params
    ? new URLSearchParams(params as Record<string, string>).toString()
    : '';
  const targetUrl = searchParams ? `${url}?${searchParams}` : url;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(targetUrl, {
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

    if (!res.ok) {
      const errorData = await res.text();
      logger?.error(
        { status: res.status, url: targetUrl, errorData },
        '❌ Upstream Fetch Failed'
      );

      throw new HTTPException(res.status as ContentfulStatusCode, {
        message: `External API Error: ${res.statusText}`
      });
    }

    const data = await res.json();

    if (schema) {
      const result = schema.safeParse(data);
      if (!result.success) {
        logger?.error(
          { err: result.error.format() },
          '❌ Upstream Schema Mismatch'
        );
        throw new HTTPException(502, { message: 'Bad Gateway: Invalid Data' });
      }
      return result.data as T;
    }

    return data as T;
  } catch (error: unknown) {
    clearTimeout(timer);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new HTTPException(504, { message: 'Gateway Timeout' });
      }
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, { message: error.message });
    }

    throw new HTTPException(500, {
      message: 'An unknown fetch error occurred'
    });
  }
}

export const get = async <T>(
  url: string,
  options?: FetchOptions
): Promise<T> => {
  return request<T>(url, 'GET', options);
};

export const post = async <T>(
  url: string,
  body: unknown,
  options?: FetchOptions
): Promise<T> => {
  return request<T>(url, 'POST', options, body);
};

export const put = async <T>(
  url: string,
  body: unknown,
  options?: FetchOptions
): Promise<T> => {
  return request<T>(url, 'PUT', options, body);
};

export const patch = async <T>(
  url: string,
  body: unknown,
  options?: FetchOptions
): Promise<T> => {
  return request<T>(url, 'PATCH', options, body);
};

export const del = async <T>(
  url: string,
  options?: FetchOptions
): Promise<T> => {
  return request<T>(url, 'DELETE', options);
};
