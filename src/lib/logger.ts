import {
  configureSync,
  getConsoleSink,
  getLogger as getLogTapeLogger
} from '@logtape/logtape';
import type { Bindings } from './env.js';

export type Logger = ReturnType<typeof getLogTapeLogger>;

let configured = false;

/**
 * LogTape is configured once per process/isolate, on first use.
 * The log level is fixed by whichever call comes first.
 */
export const getLogger = (
  nodeEnv: Bindings['NODE_ENV'] = 'development'
): Logger => {
  if (!configured) {
    configureSync({
      sinks: { console: getConsoleSink() },
      loggers: [
        {
          category: ['app'],
          lowestLevel: nodeEnv === 'development' ? 'debug' : 'info',
          sinks: ['console']
        },
        {
          category: ['logtape', 'meta'],
          lowestLevel: 'warning',
          sinks: ['console']
        }
      ]
    });
    configured = true;
  }

  return getLogTapeLogger(['app']);
};
