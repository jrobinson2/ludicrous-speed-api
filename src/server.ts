import closeWithGrace from 'close-with-grace';
import app from './app.js';
import { closeDb } from './db/reactor.js';
import { getConfig } from './lib/env.js';
import { getLogger } from './lib/logger.js';

const env = getConfig(process.env);

const logger = getLogger(env.NODE_ENV);

const PORT = env.PORT;

const server = Bun.serve({
  fetch: app.fetch,
  port: PORT
});

if (env.NODE_ENV === 'development') {
  console.log(`
🚀 LUDICROUS SPEED: ACTIVE
--------------------------
Status: They've gone to plaid.
Runtime: Bun ${Bun.version}
Endpoint: http://localhost:${PORT}
--------------------------
"What's the matter, Colonel Sandurz? Chicken?"
  `);
} else {
  logger.info('Server Started - Lone Starr is in flight 🚀', {
    status: 'PLAID',
    runtime: Bun.version,
    port: PORT
  });
}

closeWithGrace({ delay: 5000 }, async ({ signal, err }) => {
  if (err) {
    logger.error('💥 Unhandled Crash Detected.', { err });
  } else {
    logger.warn('🛑 {signal} detected.', { signal: signal || 'Shutdown' });
  }

  // Stop accepting new traffic and wait for in-flight requests to finish
  logger.info('Airlock sealed. Draining remaining connections...');
  await server.stop();

  // No-op (returns false) if we never built a pool
  const closed = await closeDb();
  logger.info(
    closed
      ? '🛡️ Shields down, fuel lines sealed. Database pool closed.'
      : '🚀 Eagle 5 is flying light. No database pool to close.'
  );

  logger.info('✅ Spaceball One has come to a full stop.');
});
