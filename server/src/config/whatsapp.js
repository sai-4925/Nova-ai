// config/whatsapp.js
import pkg from 'whatsapp-web.js';
import qrcodeTerminal from 'qrcode-terminal';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Client, LocalAuth } = pkg;

let client = null;
let isReady = false;

export const getWhatsAppClient = () => client;

/** Ready only if flag is set AND client exists */
export const isWhatsAppReady = () => Boolean(isReady && client);

/**
 * Call once at server boot.
 */
export const initializeWhatsApp = async () => {
  logger.info(`WhatsApp init starting (enabled=${env.whatsappEnabled}, path=${env.whatsappSessionPath})`);

  if (!env.whatsappEnabled) {
    logger.info('WhatsApp Agent is disabled (WHATSAPP_ENABLED=false) - skipping initialization.');
    return;
  }

  if (client) {
    try {
      await client.destroy();
    } catch {
      // ignore
    }
    client = null;
    isReady = false;
  }

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: env.whatsappSessionPath }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', (qr) => {
    isReady = false;
    logger.info('WhatsApp QR code received - scan with the phone Nova should use:');
    qrcodeTerminal.generate(qr, { small: true });
  });

  client.on('authenticated', () => {
    logger.info('WhatsApp authenticated successfully.');
  });

  client.on('ready', () => {
    isReady = true;
    logger.info('WhatsApp client is ready.');
  });

  client.on('auth_failure', (msg) => {
    isReady = false;
    logger.error(`WhatsApp auth failure: ${msg}`);
  });

  client.on('loading_screen', (percent, message) => {
    logger.info(`WhatsApp loading: ${percent}% - ${message}`);
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    logger.warn(`WhatsApp client disconnected: ${reason}`);
  });

  try {
    logger.info('WhatsApp client.initialize() calling...');
    await client.initialize();
    logger.info('WhatsApp client.initialize() resolved (ready event may still be pending)');
  } catch (error) {
    isReady = false;
    logger.error(`WhatsApp client failed to initialize: ${error.message}`);
    console.error(error);
  }
};