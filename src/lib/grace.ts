/**
 * Shape of a compatible logger instance (Strict Mode)
 */
interface Logger {
  info: (msg: string, ...args: unknown[]) => void;
  error: (obj: object, msg: string) => void;
  warn: (msg: string) => void;
  fatal: (obj: object, msg: string) => void;
  flush?: () => void;
}

interface GraceParams {
  signal?: string;
  err?: Error;
}

type GraceCallback = (params: GraceParams) => Promise<void> | void;

export function closeWithGrace(
  logger: Logger,
  options: { delay?: number } | GraceCallback,
  maybeFn?: GraceCallback
) {
  const fn = typeof options === 'function' ? options : maybeFn;
  const delay = typeof options === 'object' ? (options.delay ?? 5000) : 5000;

  if (!fn) throw new Error('closeWithGrace: No cleanup function provided');

  let isShuttingDown = false;
  let lastSignalTime = 0;

  const handle = async (params: GraceParams) => {
    const now = Date.now();

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
      await fn(params);
      clearTimeout(timeout);
      logger.info('✅ Spaceball One has come to a full stop.');
      if (logger.flush) logger.flush();
      setTimeout(() => process.exit(err ? 1 : 0), 100);
    } catch (cleanupErr) {
      logger.error({ err: cleanupErr }, '💥 Error during cleanup');
      if (logger.flush) logger.flush();
      setTimeout(() => process.exit(1), 100);
    }
  };

  ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((sig) => {
    process.on(sig, () => handle({ signal: sig }));
  });

  process.once('uncaughtException', (err) => handle({ err }));
  process.once('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    handle({ err });
  });
}
