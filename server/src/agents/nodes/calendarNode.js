// agents/nodes/calendarNode.js
// -----------------------------------------------------------------------
// FULLY IMPLEMENTED. Mirrors reminderNode.js's action-dispatch shape.
// The most common failure mode here is the user simply not having
// connected Google Calendar yet - that error message (from
// googleAuthService.getAuthenticatedClientForUser, surfaced through
// the tool) is shown to the user as-is, since it already includes clear
// next steps ("Connect it from Settings...").
// -----------------------------------------------------------------------

import { createCalendarEventTool, listCalendarEventsTool, deleteCalendarEventTool } from '../../tools/calendarTool.js';
import { logger } from '../../utils/logger.js';

export const calendarNode = async (state) => {
  const { action, title, startISO, endISO, location, titleQuery } = state.routeParams || {};

  try {
    let output;

    if (action === 'create') {
      if (!title || !startISO || !endISO) {
        output = 'What is the event, and what start and end time should I use?';
      } else {
        output = await createCalendarEventTool(state.userId).invoke({ title, startISO, endISO, location });
      }
    } else if (action === 'list') {
      output = await listCalendarEventsTool(state.userId).invoke({});
    } else if (action === 'delete') {
      if (!titleQuery) {
        output = 'Which event would you like me to delete?';
      } else {
        output = await deleteCalendarEventTool(state.userId).invoke({ titleQuery });
      }
    } else {
      output = 'I can add, list, or delete calendar events - which would you like to do?';
    }

    return { toolResults: [{ tool: 'calendar', input: state.routeParams, output }], needsAnotherTool: false };
  } catch (error) {
    logger.error(`Calendar Node failed: ${error.message}`);
    return {
      toolResults: [
        { tool: 'calendar', input: state.routeParams, output: error.message || 'I had trouble with that calendar request.' },
      ],
      needsAnotherTool: false,
    };
  }
};
