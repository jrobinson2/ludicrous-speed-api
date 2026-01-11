import type { Logger } from './logger.js';

type GraceParams = {
  signal?: string;
  err?: Error;
};

type GraceCallback = (params: GraceParams) => Promise<void> | void;

/**
 * Manages graceful shutdown for the Bun server.
 */
export function closeWithGrace(logger: Logger, fn: GraceCallback) {
  const delay = 5000;

  if (!fn) throw new Error('closeWithGrace: No cleanup function provided');

  let isShuttingDown = false;
  let lastSignalTime = 0;

  const handle = async (params: GraceParams) => {
    const now = Date.now();

    // If already shutting down and we get another signal, force kill
    if (isShuttingDown) {
      if ((params.err || params.signal) && now - lastSignalTime > 500) {
        process.stderr.write(`\n🚨 Emergency override: Force exiting.\n`);
        process.exit(1);
      }
      return;
    }

    isShuttingDown = true;
    lastSignalTime = now;

    const { signal, err } = params;

    if (err) {
      logger.fatal({ err }, '💥 Unhandled Crash Detected.');
    } else {
      logger.warn(`🛑 ${signal || 'Shutdown'} detected.`);
    }

    const timeout = setTimeout(() => {
      process.stderr.write('🚨 Force-quit: Shutdown timed out!\n');
      process.exit(1);
    }, delay);

    try {
      // Execute the cleanup function (e.g., server.stop())
      await fn(params);

      clearTimeout(timeout);
      logger.info('✅ Spaceball One has come to a full stop.');

      // Short delay to ensure the OS pipe finishes the final log write
      setTimeout(() => process.exit(err ? 1 : 0), 50);
    } catch (cleanupErr) {
      logger.error({ err: cleanupErr }, '💥 Error during cleanup');
      setTimeout(() => process.exit(1), 50);
    }
  };

  // Listen for common termination signals
  ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((sig) => {
    process.on(sig, () => handle({ signal: sig }));
  });

  // Handle runtime crashes
  process.once('uncaughtException', (err) => handle({ err }));
  process.once('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    handle({ err });
  });
}
