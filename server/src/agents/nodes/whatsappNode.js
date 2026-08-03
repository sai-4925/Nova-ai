// agents/nodes/whatsappNode.js
// -----------------------------------------------------------------------
// FULLY IMPLEMENTED. Mirrors emailNode.js's action-dispatch shape. The
// most common failure mode is WhatsApp simply not being connected yet
// (feature disabled, or QR not scanned) - whatsappService.js's
// assertReady() already writes that message clearly, so it's surfaced
// as-is rather than wrapped further.
// -----------------------------------------------------------------------

import { sendWhatsAppTool, searchWhatsAppContactTool, readWhatsAppMessagesTool } from '../../tools/whatsappTool.js';
import { logger } from '../../utils/logger.js';

export const whatsappNode = async (state) => {
  const { action, phoneNumber, message, nameQuery, chatNameQuery, count } = state.routeParams || {};

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
    } else {
      output = 'I can send a WhatsApp message, search a contact, or read recent messages - which would you like to do?';
    }

    return { toolResults: [{ tool: 'whatsapp', input: state.routeParams, output }], needsAnotherTool: false };
  } catch (error) {
    logger.error(`WhatsApp Node failed: ${error.message}`);
    return {
      toolResults: [
        { tool: 'whatsapp', input: state.routeParams, output: error.message || 'I had trouble with that WhatsApp request.' },
      ],
      needsAnotherTool: false,
    };
  }
};
