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
  const digitsOnly = String(phoneNumber).replace(/[^\d]/g, '');
  if (!digitsOnly || digitsOnly.length < 10 || digitsOnly.length > 15) {
    throw ApiError.badRequest(
      `"${phoneNumber}" doesn't look like a valid phone number with country code. Use e.g. +919849453086.`
    );
  }
  return `${digitsOnly}@c.us`;
};

export const sendWhatsAppMessage = async (phoneNumber, message) => {
  assertReady();
  const chatId = toChatId(phoneNumber);
  try {
    const result = await getWhatsAppClient().sendMessage(chatId, message);
    // Basic sanity: library returned something
    if (!result) {
      throw new Error('WhatsApp accepted the call but returned no message object');
    }
    return result;
  } catch (error) {
    throw ApiError.internal(`Failed to send the WhatsApp message: ${error.message}`);
  }
};

/**
 * Searches contacts by name. Prefers real phone numbers over LIDs.
 * @param {string} nameQuery
 */
export const searchContacts = async (nameQuery) => {
  assertReady();
  const contacts = await getWhatsAppClient().getContacts();
  const lowerQuery = nameQuery.toLowerCase();

  const matches = [];

  for (const c of contacts) {
    const name = (c.name || c.pushname || '').trim();
    if (!name.toLowerCase().includes(lowerQuery)) continue;

    const serialized = c.id?._serialized || '';

    // Always skip Linked IDs
    if (serialized.endsWith('@lid')) continue;

    let number = null;

    if (serialized.endsWith('@c.us') && c.id?.user) {
      number = String(c.id.user).replace(/[^\d]/g, '');
    } else if (c.number) {
      const digits = String(c.number).replace(/[^\d]/g, '');
      // Normal international mobile: 10–15 digits, and not a known LID pattern
      if (digits.length >= 10 && digits.length <= 15) number = digits;
    }

    if (!number) continue;

    matches.push({ name: name || 'Unknown', number });
  }

  const seen = new Set();
  return matches.filter((m) => {
    if (seen.has(m.number)) return false;
    seen.add(m.number);
    return true;
  });
};
/**
 * Reads recent messages from a chat by name OR phone number.
 * @param {string} chatNameQuery - contact name or phone number
 * @param {number} [count]
 */
export const readRecentMessagesFromChat = async (chatNameQuery, count = 10) => {
  assertReady();
  const client = getWhatsAppClient();
  const query = (chatNameQuery || '').trim();

  if (!query) {
    throw ApiError.badRequest('Please give a chat name or phone number.');
  }

  const digits = query.replace(/[^\d]/g, '');
  const limit = count || 10;
  let chat = null;
  let messages = null;
  const tried = [];

  if (digits.length >= 10) {
    // 1) Resolve to WhatsApp id (often @lid now)
    let serialized = null;
    try {
      const numberId = await client.getNumberId(digits);
      serialized = numberId?._serialized || null;
      tried.push(`getNumberId → ${serialized || 'null'}`);
    } catch (err) {
      tried.push(`getNumberId error: ${err.message}`);
    }

    // 2) Load chat by resolved id (LID or @c.us)
    if (serialized) {
      try {
        chat = await client.getChatById(serialized);
        tried.push(`getChatById(${serialized}) → ok`);
      } catch (err) {
        tried.push(`getChatById(${serialized}) error: ${err.message}`);
      }
    }

    // 3) Fallback searchMessages by chatId (skips getChats)
    if (!chat && serialized && typeof client.searchMessages === 'function') {
      try {
        messages = await client.searchMessages('', { chatId: serialized, limit });
        tried.push(`searchMessages → ${messages?.length ?? 0}`);
      } catch (err) {
        tried.push(`searchMessages error: ${err.message}`);
      }
    }

    // 4) Last resort: classic @c.us
    if (!chat && !messages) {
      try {
        chat = await client.getChatById(`${digits}@c.us`);
        tried.push('getChatById @c.us → ok');
      } catch (err) {
        tried.push(`getChatById @c.us error: ${err.message}`);
      }
    }
  }

  if (chat && !messages) {
    messages = await chat.fetchMessages({ limit });
  }

  if (!messages) {
    throw ApiError.notFound(
      `No chat/messages for "${chatNameQuery}". Debug: ${tried.join(' | ')}`
    );
  }

  return messages.map((m) => ({
    fromMe: m.fromMe,
    body: m.body || (m.hasMedia ? '[media]' : ''),
    timestamp: new Date((m.timestamp || 0) * 1000),
  }));
};