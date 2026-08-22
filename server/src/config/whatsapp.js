// config/whatsapp.js  – IMPROVED
import pkg from 'whatsapp-web.js';
import qrcodeTerminal from 'qrcode-terminal';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Client, LocalAuth } = pkg;

let client = null;
let isReady = false;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

export const getWhatsAppClient = () => client;
export const isWhatsAppReady = () => Boolean(isReady && client);

const createClient = () => {
  return new Client({
    authStrategy: new LocalAuth({ dataPath: env.whatsappSessionPath }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--single-process',          // helps on some VPS
      ],
      // Optional: pin a known-good Chrome if you have it
      // executablePath: process.env.CHROME_PATH,
    },
    // Helps with newer WhatsApp Web versions
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1027590052-alpha.html',
    },
  });
};

const attachListeners = (c) => {
  c.on('qr', (qr) => {
    isReady = false;
    logger.info('WhatsApp QR code – scan with the phone Nova should use:');
    qrcodeTerminal.generate(qr, { small: true });
  });

  c.on('authenticated', () => logger.info('WhatsApp authenticated'));
  c.on('ready', () => {
    isReady = true;
    reconnectAttempts = 0;
    logger.info('WhatsApp client is READY');
  });

  c.on('auth_failure', (msg) => {
    isReady = false;
    logger.error(`WhatsApp auth failure: ${msg}`);
  });

  c.on('loading_screen', (percent, message) => {
    logger.info(`WhatsApp loading: ${percent}% – ${message}`);
  });

  c.on('disconnected', async (reason) => {
    isReady = false;
    logger.warn(`WhatsApp disconnected: ${reason}`);

    if (reconnectAttempts < MAX_RECONNECT) {
      reconnectAttempts++;
      logger.info(`Attempting reconnect (${reconnectAttempts}/${MAX_RECONNECT})...`);
      setTimeout(() => initializeWhatsApp(), 5000 * reconnectAttempts);
    }
  });
};

export const initializeWhatsApp = async () => {
  if (!env.whatsappEnabled) {
    logger.info('WhatsApp Agent disabled (WHATSAPP_ENABLED=false)');
    return;
  }

  if (client) {
    try { await client.destroy(); } catch {}
    client = null;
    isReady = false;
  }

  client = createClient();
  attachListeners(client);

  try {
    await client.initialize();
  } catch (err) {
    isReady = false;
    logger.error(`WhatsApp init failed: ${err.message}`);
  }
};