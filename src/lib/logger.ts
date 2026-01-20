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

// Helper to narrow types for TypeScript
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

    // 1. Normalize: Identify which argument is the message and which is the meta
    const msg =
      typeof first === 'string'
        ? first
        : typeof second === 'string'
          ? second
          : String(first ?? '');
    const meta = isObject(first) ? first : isObject(second) ? second : {};

    // 2. Handle Error objects by extracting message and stack
    const processedMeta = Object.entries(meta).reduce(
      (acc, [key, value]) => {
        if (value instanceof Error) {
          acc[key] = { message: value.message, stack: value.stack };
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );

    // 3. Compose: Single source of truth for the object structure
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

let cachedLogger: PlaidLogger | null = null;

export const getLogger = (env: string = 'development'): PlaidLogger => {
  if (cachedLogger) return cachedLogger;

  cachedLogger = new PlaidLogger(env);
  return cachedLogger;
};
