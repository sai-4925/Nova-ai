// agents/nodes/reminderNode.js
// -----------------------------------------------------------------------
// FULLY IMPLEMENTED. Dispatches on routeParams.action (set by the
// Planner) to the matching tool. Each tool is created via its factory,
// bound to state.userId - the ONE trusted source of user identity (see
// the security note atop tools/reminderTool.js). action is never
// trusted blindly either: an unrecognised value falls through to a
// clarifying response rather than throwing.
// -----------------------------------------------------------------------

import { createReminderTool, listRemindersTool, deleteReminderTool } from '../../tools/reminderTool.js';
import { logger } from '../../utils/logger.js';

export const reminderNode = async (state) => {
  const { action, title, remindAtISO, recurrence, titleQuery } = state.routeParams || {};

  try {
    let output;

    if (action === 'create') {
      if (!title || !remindAtISO) {
        output = 'What should I remind you about, and when?';
      } else {
        output = await createReminderTool(state.userId).invoke({ title, remindAtISO, recurrence });
      }
    } else if (action === 'list') {
      output = await listRemindersTool(state.userId).invoke({});
    } else if (action === 'delete') {
      if (!titleQuery) {
        output = 'Which reminder would you like me to delete?';
      } else {
        output = await deleteReminderTool(state.userId).invoke({ titleQuery });
      }
    } else {
      output = "I can create, list, or delete reminders - which would you like to do?";
    }

    return { toolResults: [{ tool: 'reminder', input: state.routeParams, output }], needsAnotherTool: false };
  } catch (error) {
    logger.error(`Reminder Node failed: ${error.message}`);
    return {
      toolResults: [
        { tool: 'reminder', input: state.routeParams, output: error.message || 'I had trouble with that reminder.' },
      ],
      needsAnotherTool: false,
    };
  }
};
