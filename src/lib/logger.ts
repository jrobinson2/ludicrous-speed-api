import {
  configureSync,
  getConsoleSink,
  getLogger as getLogTapeLogger
} from '@logtape/logtape';

export type Logger = ReturnType<typeof getLogTapeLogger>;

let isConfigured = false;
let cached: { instance: Logger; env: string } | null = null;

export const getLogger = (env: string = 'development'): Logger => {
  if (cached && cached.env === env) {
    return cached.instance;
  }

  if (!isConfigured) {
    configureSync({
      sinks: {
        console: getConsoleSink()
      },
      loggers: [
        {
          category: ['app'],
          lowestLevel: env === 'development' ? 'debug' : 'info',
          sinks: ['console']
        },
        {
          category: ['logtape', 'meta'],
          lowestLevel: 'warning',
          sinks: ['console']
        }
      ]
    });
    isConfigured = true;
  }

  // Bind to the 'app' category defined above
  const instance = getLogTapeLogger(['app']);

  cached = { instance, env };
  return instance;
};
