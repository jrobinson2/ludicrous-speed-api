import app from './app.js';
import { getDb } from './db/reactor.js';
import { envSchema } from './lib/env.js';
import { closeWithGrace } from './lib/grace.js';
import { getLogger } from './lib/logger.js';
import { isRuntime } from './lib/runtime.js';

const env = envSchema.parse(process.env);

const logger = getLogger(env.NODE_ENV);

const PORT = env.PORT;

const server = Bun.serve({
  fetch: app.fetch,
  port: PORT
});

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
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
  logger.info(
    { status: 'PLAID', runtime: Bun.version, port: PORT },
    'Server Started - Lone Starr is in flight 🚀'
  );
}

const supportsTcp = isRuntime.Bun || isRuntime.Node;

closeWithGrace(logger, async () => {
  server.stop(false);
  logger.info('Airlock sealed. Draining remaining connections...');

  // Only try to close DB pool if running in TCP environment
  if (supportsTcp) {
    const db = getDb(env.DATABASE_URL);

    if ('end' in db && typeof db.end === 'function') {
      await db.end();
      logger.info('TCP database pool closed gracefully.');
    }
  }
});
