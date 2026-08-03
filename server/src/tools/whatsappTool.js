// tools/whatsappTool.js
// -----------------------------------------------------------------------
// Plain tools (not factory-bound) - like sendEmailTool.js, these operate
// on the ONE shared WhatsApp account, not a specific user's own data,
// so there's no per-user trust boundary to enforce here the way
// reminders/calendar/PDF require.
// -----------------------------------------------------------------------

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { sendWhatsAppMessage, searchContacts, readRecentMessagesFromChat } from '../services/whatsappService.js';

export const sendWhatsAppTool = tool(
  async ({ phoneNumber, message }) => {
    await sendWhatsAppMessage(phoneNumber, message);
    return `WhatsApp message sent to ${phoneNumber}.`;
  },
  {
    name: 'send_whatsapp_message',
    description: "Sends a WhatsApp message to a specific phone number via Nova's connected WhatsApp account.",
    schema: z.object({
      phoneNumber: z.string().describe('Recipient phone number with country code, e.g. "+15551234567"'),
      message: z.string().describe('The message text to send'),
    }),
  }
);

export const searchWhatsAppContactTool = tool(
  async ({ nameQuery }) => {
    const matches = await searchContacts(nameQuery);
    if (matches.length === 0) return `No contacts found matching "${nameQuery}".`;
    return matches.map((c) => `- ${c.name}: ${c.number}`).join('\n');
  },
  {
    name: 'search_whatsapp_contact',
    description: "Searches Nova's connected WhatsApp account's contacts by name.",
    schema: z.object({ nameQuery: z.string().describe('Name or partial name to search for') }),
  }
);

export const readWhatsAppMessagesTool = tool(
  async ({ chatNameQuery, count }) => {
    const messages = await readRecentMessagesFromChat(chatNameQuery, count || 10);
    if (messages.length === 0) return `No recent messages found in the chat with "${chatNameQuery}".`;
    return messages.map((m) => `${m.fromMe ? 'You' : chatNameQuery}: ${m.body}`).join('\n');
  },
  {
    name: 'read_whatsapp_messages',
    description: "Reads recent messages from a specific chat in Nova's connected WhatsApp account.",
    schema: z.object({
      chatNameQuery: z.string().describe('Name of the contact/chat to read messages from'),
      count: z.number().optional().describe('How many recent messages to read, default 10'),
    }),
  }
);
