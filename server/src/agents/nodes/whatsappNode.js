// agents/nodes/whatsappNode.js
import {
  sendWhatsAppTool,
  searchWhatsAppContactTool,
  readWhatsAppMessagesTool,
} from '../../tools/whatsappTool.js';
import { logger } from '../../utils/logger.js';

export const whatsappNode = async (state) => {
  const params = state.routeParams || {};
  const { action, phoneNumber, message, nameQuery, chatNameQuery, count } = params;

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
        console.log('WA READ routeParams:', params);
        output = await readWhatsAppMessagesTool.invoke({ chatNameQuery, count });
        console.log('WA READ output:', output);
      }
    } else {
      output =
        'I can send a WhatsApp message, search a contact, or read recent messages - which would you like to do?';
    }

    return {
      toolResults: [{ tool: 'whatsapp', input: params, output }],
      needsAnotherTool: false,
    };
  } catch (error) {
    console.error('WA NODE full error:', error);
    logger.error(`WhatsApp Node failed: ${error?.message || error}`);
    return {
      toolResults: [
        {
          tool: 'whatsapp',
          input: params, // ✅ always defined
          output: error?.message || String(error) || 'WhatsApp request failed.',
        },
      ],
      needsAnotherTool: false,
    };
  }
};