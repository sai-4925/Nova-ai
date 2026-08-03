// server.js
// -----------------------------------------------------------------------
// The ONLY file that starts the HTTP listener.
// Sequence: validate env (happens on import of config/env.js) -> connect
// to MongoDB -> start listening. If the DB connection fails, we never
// start accepting traffic - this avoids serving requests that will
// inevitably fail on first DB access.
// -----------------------------------------------------------------------

import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { initializeWhatsApp } from './src/config/whatsapp.js';
import { initSystemAgentRelay } from './src/config/systemAgentSocket.js';
import { logger } from './src/utils/logger.js';

const startServer = async () => {
  await connectDB();

  // Fire-and-forget: WhatsApp's Puppeteer/QR-code startup can be slow
  // or fail entirely on some hosts, and this feature is opt-in
  // (WHATSAPP_ENABLED) - the HTTP server must never wait on it or go
  // down because of it.
  initializeWhatsApp().catch((error) => {
    logger.error(`Unexpected error starting WhatsApp client: ${error.message}`);
  });

  const server = app.listen(env.port, () => {
    logger.info(`NOVA AI server running on port ${env.port} [${env.nodeEnv}]`);
  });

  // Attach the System Agent relay to the SAME HTTP server (not a
  // separate port) - this is what lets local companion apps connect
  // via wss://<this-server>/ws/system-agent behind Render's single-port model.
  initSystemAgentRelay(server);

  // Graceful shutdown - important on Render, which sends SIGTERM before
  // restarting/redeploying a container. Without this, in-flight requests
  // could be dropped abruptly.
  const shutdown = (signal) => {
    logger.info(`${signal} received - shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled promise rejections / uncaught exceptions so the
  // process doesn't silently hang - log then exit, letting Render
  // restart the container cleanly.
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
