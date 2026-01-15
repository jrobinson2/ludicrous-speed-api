import app from './app.js';
import { closeWithGrace } from './lib/grace.js';
import { getLogger } from './lib/logger.js';

const logger = getLogger(process.env.NODE_ENV || 'development', true);

const server = Bun.serve({
  fetch: app.fetch,
  port: process.env.PORT
});

logger.info(`
🚀 LUDICROUS SPEED: ACTIVE
--------------------------
Status: They've gone to plaid.
Runtime: Bun ${Bun.version}
Endpoint: http://localhost:${server.port}
--------------------------
"Secure all animals in the zoo!"
`);

// Manage server lifecycle and process signals
closeWithGrace(logger, { delay: 5000 }, async () => {
  server.stop(false);
  logger.info('Airlock sealed. Draining remaining connections...');
});
