import pino from 'pino';

/**
 * Factory for creating configured pino instances.
 * @param env - The current NODE_ENV
 * @param isInternal - If true, uses sync mode to ensure logs appear during crashes/shutdowns
 */
export const getLogger = (env: string, isInternal = false) =>
  pino({
    level: env === 'development' ? 'debug' : 'info',
    transport:
      env === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              sync: isInternal, // Forced sync for lifecycle logs
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
