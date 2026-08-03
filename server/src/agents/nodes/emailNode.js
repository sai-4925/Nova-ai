// agents/nodes/emailNode.js
// -----------------------------------------------------------------------
// FULLY IMPLEMENTED. Mirrors reminderNode.js's action-dispatch shape.
// One real limitation, surfaced honestly rather than worked around:
// there's no contacts/address book system yet, so "email mom" without
// an actual address triggers a clarifying question - Nova cannot
// resolve a name to an address on its own.
// -----------------------------------------------------------------------

import { sendEmailTool, readRecentEmailsTool, summarizeRecentEmailsTool } from '../../tools/emailTool.js';
import { logger } from '../../utils/logger.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailNode = async (state) => {
  const { action, to, subject, body, count } = state.routeParams || {};

  try {
    let output;

    if (action === 'send') {
      if (!to || !EMAIL_REGEX.test(to)) {
        output = "What's the recipient's email address? I don't have a contacts list yet, so I need the actual address.";
      } else if (!subject || !body) {
        output = 'What should the subject and message say?';
      } else {
        output = await sendEmailTool.invoke({ to, subject, body });
      }
    } else if (action === 'read') {
      output = await readRecentEmailsTool(state.userId).invoke({ count });
    } else if (action === 'summarize') {
      output = await summarizeRecentEmailsTool(state.userId).invoke({ count });
    } else {
      output = 'I can send, read, or summarise your emails - which would you like to do?';
    }

    return { toolResults: [{ tool: 'email', input: state.routeParams, output }], needsAnotherTool: false };
  } catch (error) {
    logger.error(`Email Node failed: ${error.message}`);
    return {
      toolResults: [{ tool: 'email', input: state.routeParams, output: error.message || 'I had trouble with that email request.' }],
      needsAnotherTool: false,
    };
  }
};
