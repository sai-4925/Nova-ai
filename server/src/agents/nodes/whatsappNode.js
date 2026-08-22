// agents/nodes/whatsappNode.js
import {
  sendWhatsAppTool,
  searchWhatsAppContactTool,
  readWhatsAppMessagesTool,
  getUnreadWhatsAppChatsTool,
  markWhatsAppChatReadTool,
} from '../../tools/whatsappTool.js';
import { logger } from '../../utils/logger.js';

export const whatsappNode = async (state) => {
  const params = state.routeParams || {};
  const { action, phoneNumber, message, nameQuery, chatNameQuery, count, limit } = params;

  try {
    let output;

    if (action === 'send') {
      if (!phoneNumber || !message) {
        output = "What's the phone number, and what should the message say?";
      } else {
        output = await sendWhatsAppTool.invoke({ phoneNumber, message });
      }
    } else if (action === 'search_contact') {
      if (!nameQuery) {
        output = 'Which contact would you like me to search for?';
      } else {
        output = await searchWhatsAppContactTool.invoke({ nameQuery });
      }
    } else if (action === 'read') {
      if (!chatNameQuery) {
        output = 'Whose messages would you like me to read?';
      } else {
        output = await readWhatsAppMessagesTool.invoke({ chatNameQuery, count });
      }
    } else if (action === 'get_unread' || action === 'unread') {
      output = await getUnreadWhatsAppChatsTool.invoke({ limit });
    } else if (action === 'mark_read' || action === 'mark_as_read') {
      if (!chatNameQuery) {
        output = 'Which chat should I mark as read?';
      } else {
        output = await markWhatsAppChatReadTool.invoke({ chatNameQuery });
      }
    } else {
      output =
        'I can send a message, search a contact, read messages, list unread chats, or mark a chat as read — which would you like?';
    }

    return {
      toolResults: [{ tool: 'whatsapp', input: params, output }],
      needsAnotherTool: false,
    };
  } catch (error) {
    logger.error(`WhatsApp Node failed: ${error?.message || error}`);
    return {
      toolResults: [
        {
          tool: 'whatsapp',
          input: params,
          output: error?.message || String(error) || 'WhatsApp request failed.',
        },
      ],
      needsAnotherTool: false,
    };
  }
};