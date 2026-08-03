// services/whatsappService.js
// -----------------------------------------------------------------------
// Pure functions over the shared WhatsApp client (config/whatsapp.js).
// Every function checks isWhatsAppReady() first and throws a clear,
// actionable error if not - "the admin needs to scan a QR code" is a
// completely different failure mode from "invalid phone number", and
// callers (whatsappNode.js) should be able to tell them apart from the
// message alone.
// -----------------------------------------------------------------------

import { getWhatsAppClient, isWhatsAppReady } from '../config/whatsapp.js';
import { ApiError } from '../utils/ApiError.js';

const assertReady = () => {
  if (!isWhatsAppReady()) {
    throw ApiError.internal(
      'WhatsApp is not connected - an admin needs to enable WHATSAPP_ENABLED and scan the QR code shown in the server logs.'
    );
  }
};

/**
 * Converts a phone number (with or without a leading +) into the chat
 * ID format whatsapp-web.js expects.
 * @param {string} phoneNumber
 */
const toChatId = (phoneNumber) => {
  const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
  if (!digitsOnly) {
    throw ApiError.badRequest(`"${phoneNumber}" doesn't look like a valid phone number.`);
  }
  return `${digitsOnly}@c.us`;
};

/**
 * @param {string} phoneNumber - with country code, e.g. "+15551234567"
 * @param {string} message
 */
export const sendWhatsAppMessage = async (phoneNumber, message) => {
  assertReady();
  const chatId = toChatId(phoneNumber);
  try {
    await getWhatsAppClient().sendMessage(chatId, message);
  } catch (error) {
    throw ApiError.internal(`Failed to send the WhatsApp message: ${error.message}`);
  }
};

/**
 * Searches the connected account's contact list by name (case-insensitive
 * substring match) - whatsapp-web.js has no server-side search, so this
 * fetches all contacts and filters client-side (fine at personal-contact-
 * list scale).
 * @param {string} nameQuery
 */
export const searchContacts = async (nameQuery) => {
  assertReady();
  const contacts = await getWhatsAppClient().getContacts();
  const lowerQuery = nameQuery.toLowerCase();
  return contacts
    .filter((c) => (c.name || c.pushname || '').toLowerCase().includes(lowerQuery))
    .map((c) => ({ name: c.name || c.pushname || 'Unknown', number: c.number }));
};

/**
 * Reads the most recent messages from a chat matching the given name.
 * @param {string} chatNameQuery
 * @param {number} [count]
 */
export const readRecentMessagesFromChat = async (chatNameQuery, count = 10) => {
  assertReady();
  const chats = await getWhatsAppClient().getChats();
  const lowerQuery = chatNameQuery.toLowerCase();
  const matchingChat = chats.find((c) => c.name?.toLowerCase().includes(lowerQuery));

  if (!matchingChat) {
    throw ApiError.notFound(`No chat found matching "${chatNameQuery}".`);
  }

  const messages = await matchingChat.fetchMessages({ limit: count });
  return messages.map((m) => ({
    fromMe: m.fromMe,
    body: m.body,
    timestamp: new Date(m.timestamp * 1000),
  }));
};
