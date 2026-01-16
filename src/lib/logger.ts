import pino from 'pino';

/**
 * Factory for creating configured pino instances.
 * @param env - The current NODE_ENV
 * @param isInternal - If true, uses sync mode to ensure logs appear during crashes/shutdowns
 */

// Cache the logger instance
let logger: pino.Logger | null = null;

export const getLogger = (env: string = 'development', isInternal = false) => {
  // Return the existing logger if it exists
  if (logger && !isInternal) return logger;

  const instance = pino({
    level: env === 'development' ? 'debug' : 'info',
    transport:
      env === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              sync: isInternal,
              colorize: true,
              levelFirst: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              customColors:
                'info:cyan,warn:magenta,error:red,fatal:bgRed,debug:white',
              useOnlyCustomProps: false
            }
          }
        : undefined
  });

  // Only cache the "standard" logger, not the "internal/sync" one
  if (!isInternal) {
    logger = instance;
  }

  return instance;
};

export type Logger = ReturnType<typeof getLogger>;
