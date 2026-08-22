// services/whatsappService.js  – IMPROVED
import { getWhatsAppClient, isWhatsAppReady } from '../config/whatsapp.js';
import { ApiError } from '../utils/ApiError.js';

const assertReady = () => {
  if (!isWhatsAppReady()) {
    throw ApiError.internal(
      'WhatsApp is not connected – admin needs to enable WHATSAPP_ENABLED and scan the QR code.'
    );
  }
};

const toChatId = (phoneNumber) => {
  const digits = String(phoneNumber).replace(/[^\d]/g, '');
  if (!digits || digits.length < 10 || digits.length > 15) {
    throw ApiError.badRequest(`"${phoneNumber}" is not a valid phone number with country code.`);
  }
  return `${digits}@c.us`;
};

/** Safe helper – works even when library returns $1 instead of _serialized */
const getSerialized = (id) => id?._serialized || id?.$1 || id?.user || null;

export const sendWhatsAppMessage = async (phoneNumber, message) => {
  assertReady();
  const chatId = toChatId(phoneNumber);
  const result = await getWhatsAppClient().sendMessage(chatId, message);
  if (!result) throw ApiError.internal('WhatsApp returned no message object');
  return result;
};

export const searchContacts = async (nameQuery) => {
  assertReady();
  const client = getWhatsAppClient();
  let contacts = [];
  try {
    contacts = await client.getContacts();
  } catch (err) {
    // Fallback: try getChats and extract participants
    const chats = await client.getChats().catch(() => []);
    contacts = chats.map(c => c.contact || c).filter(Boolean);
  }

  const lower = nameQuery.toLowerCase();
  const matches = [];

  for (const c of contacts) {
    const name = (c.name || c.pushname || c.formattedName || '').trim();
    if (!name.toLowerCase().includes(lower)) continue;

    const serialized = getSerialized(c.id);
    if (!serialized || serialized.endsWith('@lid')) continue;

    let number = null;
    if (serialized.endsWith('@c.us') && c.id?.user) {
      number = String(c.id.user).replace(/[^\d]/g, '');
    } else if (c.number) {
      const digits = String(c.number).replace(/[^\d]/g, '');
      if (digits.length >= 10 && digits.length <= 15) number = digits;
    }

    if (number) matches.push({ name: name || 'Unknown', number });
  }

  // Deduplicate
  const seen = new Set();
  return matches.filter(m => {
    if (seen.has(m.number)) return false;
    seen.add(m.number);
    return true;
  });
};

/**
 * Much more robust message reading
 */
export const readRecentMessagesFromChat = async (chatNameQuery, count = 10) => {
  assertReady();
  const client = getWhatsAppClient();
  const query = (chatNameQuery || '').trim();
  if (!query) throw ApiError.badRequest('Please give a chat name or phone number.');

  const limit = Math.min(count || 10, 50);
  const digits = query.replace(/[^\d]/g, '');
  let chat = null;
  let messages = [];
  const tried = [];

  // Strategy 1: phone number path
  if (digits.length >= 10) {
    // Try getNumberId first (handles LID)
    try {
      const numberId = await client.getNumberId(digits);
      const serialized = getSerialized(numberId);
      tried.push(`getNumberId → ${serialized}`);
      if (serialized) {
        chat = await client.getChatById(serialized).catch(() => null);
      }
    } catch (e) {
      tried.push(`getNumberId error: ${e.message}`);
    }

    // Classic @c.us fallback
    if (!chat) {
      try {
        chat = await client.getChatById(`${digits}@c.us`);
        tried.push('getChatById @c.us → ok');
      } catch (e) {
        tried.push(`@c.us error: ${e.message}`);
      }
    }
  }

  // Strategy 2: search by name via getChats
  if (!chat) {
    try {
      const chats = await client.getChats();
      const lower = query.toLowerCase();
      chat = chats.find(c =>
        (c.name || '').toLowerCase().includes(lower) ||
        (c.formattedTitle || '').toLowerCase().includes(lower)
      );
      if (chat) tried.push('found via getChats name match');
    } catch (e) {
      tried.push(`getChats error: ${e.message}`);
    }
  }

  if (!chat) {
    throw ApiError.notFound(`Could not find chat for "${chatNameQuery}". Tried: ${tried.join(' | ')}`);
  }

  // Fetch messages with multiple fallbacks
  try {
    messages = await chat.fetchMessages({ limit });
  } catch (e) {
    tried.push(`fetchMessages failed: ${e.message}`);
    // Last resort – searchMessages
    try {
      const ser = getSerialized(chat.id);
      if (ser && typeof client.searchMessages === 'function') {
        messages = await client.searchMessages('', { chatId: ser, limit });
      }
    } catch (e2) {
      tried.push(`searchMessages also failed: ${e2.message}`);
    }
  }

  if (!messages || messages.length === 0) {
    throw ApiError.notFound(`No messages found. Debug: ${tried.join(' | ')}`);
  }

  return messages.map(m => ({
    fromMe: m.fromMe,
    body: m.body || (m.hasMedia ? '[media]' : ''),
    timestamp: new Date((m.timestamp || 0) * 1000),
    hasMedia: !!m.hasMedia,
  }));
};

/** NEW – list unread chats */
export const getUnreadChats = async (limit = 10) => {
  assertReady();
  const chats = await getWhatsAppClient().getChats();
  return chats
    .filter(c => c.unreadCount > 0)
    .slice(0, limit)
    .map(c => ({
      name: c.name || c.formattedTitle || 'Unknown',
      unreadCount: c.unreadCount,
      id: getSerialized(c.id),
    }));
};

/** NEW – mark chat as read */
export const markChatAsRead = async (chatNameQuery) => {
  assertReady();
  // Re-use the robust finder
  const messages = await readRecentMessagesFromChat(chatNameQuery, 1);
  // The chat object is not returned, so we re-resolve quickly
  const client = getWhatsAppClient();
  const digits = chatNameQuery.replace(/[^\d]/g, '');
  let chat = null;
  if (digits.length >= 10) {
    chat = await client.getChatById(`${digits}@c.us`).catch(() => null);
  }
  if (!chat) {
    const chats = await client.getChats();
    chat = chats.find(c => (c.name || '').toLowerCase().includes(chatNameQuery.toLowerCase()));
  }
  if (chat) await chat.sendSeen();
  return true;
};