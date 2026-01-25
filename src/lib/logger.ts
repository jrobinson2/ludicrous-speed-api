export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

export type Logger = {
  info: (m: unknown, d?: unknown) => void;
  error: (m: unknown, d?: unknown) => void;
  warn: (m: unknown, d?: unknown) => void;
  fatal: (m: unknown, d?: unknown) => void;
  debug: (m: unknown, d?: unknown) => void;
  child: (extraContext: Record<string, unknown>) => Logger;
};

const isObject = (val: unknown): val is Record<string, unknown> =>
  typeof val === 'object' && val !== null && !Array.isArray(val);

export class PlaidLogger implements Logger {
  constructor(
    private readonly env: string,
    private readonly context: Record<string, unknown> = {},
    private readonly minLevel: number = env === 'development' ? 0 : 1
  ) {}

  child(extraContext: Record<string, unknown>): PlaidLogger {
    return new PlaidLogger(
      this.env,
      { ...this.context, ...extraContext },
      this.minLevel
    );
  }

  private log(level: LogLevel, first: unknown, second?: unknown): void {
    if (LEVELS[level] < this.minLevel) return;

    const msg =
      typeof first === 'string'
        ? first
        : typeof second === 'string'
          ? second
          : String(first ?? '');

    const meta = isObject(first) ? first : isObject(second) ? second : {};

    const processedMeta: Record<string, unknown> = {};
    const keys = Object.keys(meta);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = meta[key];

      processedMeta[key] =
        value instanceof Error
          ? { message: value.message, stack: value.stack }
          : value;
    }

    const logPayload = {
      level,
      time: Date.now(),
      ...this.context,
      ...processedMeta,
      msg
    };

    const output = JSON.stringify(logPayload);

    if (level === 'error' || level === 'fatal') {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  debug(m: unknown, d?: unknown): void {
    this.log('debug', m, d);
  }
  info(m: unknown, d?: unknown): void {
    this.log('info', m, d);
  }
  warn(m: unknown, d?: unknown): void {
    this.log('warn', m, d);
  }
  error(m: unknown, d?: unknown): void {
    this.log('error', m, d);
  }
  fatal(m: unknown, d?: unknown): void {
    this.log('fatal', m, d);
  }
}

/**
 * CACHED LOGGER INSTANCE
 * We store the environment string alongside the instance to detect
 * infrastructure changes.
 */
let cached: { instance: PlaidLogger; env: string } | null = null;

export const getLogger = (env: string = 'development'): PlaidLogger => {
  // If we have a cached logger AND the environment matches, reuse it (Fast Path).
  if (cached && cached.env === env) {
    return cached.instance;
  }

  // If the env changed mid-lifecycle (or first run), create a fresh logger.
  // This ensures the minLevel is always correct for the current state.
  const instance = new PlaidLogger(env);
  cached = { instance, env };

  return instance;
};
