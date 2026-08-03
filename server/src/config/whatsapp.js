// config/whatsapp.js
// -----------------------------------------------------------------------
// A SINGLE shared WhatsApp session for the entire app - not one per
// user (see Module 17's design note: per-user sessions would each need
// their own Puppeteer/Chromium process, impractical on free-tier
// hosting). Whoever administers this NOVA deployment scans the QR code
// ONCE with their own phone; after that, Nova can send/read WhatsApp
// messages on behalf of any user who chats with it - the same
// shared-account trade-off Module 16 made for email sending.
//
// This client is created once and kept alive for the server's entire
// lifetime (like the Mongo connection), NOT per-request like a normal
// tool - initialize() is called from server.js at boot, without
// blocking the HTTP server on it (see the comment there).
// -----------------------------------------------------------------------

import pkg from 'whatsapp-web.js';
import qrcodeTerminal from 'qrcode-terminal';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Client, LocalAuth } = pkg;

let client = null;
let isReady = false;

export const getWhatsAppClient = () => client;
export const isWhatsAppReady = () => isReady;

/**
 * Creates and starts the shared WhatsApp client. Safe to call once at
 * server boot; does nothing if WHATSAPP_ENABLED isn't "true", since this
 * feature is opt-in given its hosting constraints (see Module 17 notes).
 */
export const initializeWhatsApp = async () => {
  if (!env.whatsappEnabled) {
    logger.info('WhatsApp Agent is disabled (WHATSAPP_ENABLED=false) - skipping initialization.');
    return;
  }

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: env.whatsappSessionPath }),
    puppeteer: {
      // Required flags for running Chromium inside most containerized/
      // Linux server environments (including Render) where the default
      // sandbox can't run as expected.
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', (qr) => {
    logger.info('WhatsApp QR code received - scan this with the account you want Nova to use:');
    qrcodeTerminal.generate(qr, { small: true });
  });

  client.on('authenticated', () => {
    logger.info('WhatsApp authenticated successfully.');
  });

  client.on('ready', () => {
    isReady = true;
    logger.info('WhatsApp client is ready.');
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    logger.warn(`WhatsApp client disconnected: ${reason}`);
  });

  try {
    await client.initialize();
  } catch (error) {
    logger.error(`WhatsApp client failed to initialize: ${error.message}`);
  }
};
