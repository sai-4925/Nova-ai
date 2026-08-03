// tools/reminderTool.js
// -----------------------------------------------------------------------
// SECURITY NOTE: unlike weatherTool.js (where every parameter is safe
// for the LLM to control), these tools operate on a specific user's
// data. `userId` is deliberately NOT part of any tool's Zod schema -
// if it were, a confused or manipulated Planner output could point one
// user's reminder operations at another user's records. Instead, each
// function below is a FACTORY: it takes the trusted `userId` (always
// read from state.userId, set server-side from the authenticated JWT -
// see reminderNode.js) and returns a tool bound to that user, with only
// the reminder CONTENT (title, time, recurrence) left as LLM-fillable
// fields.
// -----------------------------------------------------------------------

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  createReminder,
  listUpcomingReminders,
  findRemindersByTitleQuery,
} from '../services/reminderService.js';

/** @param {string} userId */
export const createReminderTool = (userId) =>
  tool(
    async ({ title, remindAtISO, recurrence }) => {
      const reminder = await createReminder({
        userId,
        title,
        remindAt: remindAtISO,
        recurrence: recurrence || 'none',
        createdVia: 'voice',
      });
      return `Reminder set: "${reminder.title}" at ${reminder.remindAt.toLocaleString()}.`;
    },
    {
      name: 'create_reminder',
      description: 'Creates a new reminder for the current user at a specific date and time.',
      schema: z.object({
        title: z.string().describe('What the reminder is about, e.g. "call mom"'),
        remindAtISO: z.string().describe('The absolute date and time as an ISO 8601 string'),
        recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
      }),
    }
  );

/** @param {string} userId */
export const listRemindersTool = (userId) =>
  tool(
    async () => {
      const reminders = await listUpcomingReminders(userId);
      if (reminders.length === 0) return "You don't have any upcoming reminders.";
      return reminders.map((r) => `- "${r.title}" at ${r.remindAt.toLocaleString()}`).join('\n');
    },
    {
      name: 'list_reminders',
      description: "Lists the current user's upcoming reminders.",
      schema: z.object({}), // no input needed - scoping comes entirely from the bound userId
    }
  );

/** @param {string} userId */
export const deleteReminderTool = (userId) =>
  tool(
    async ({ titleQuery }) => {
      const matches = await findRemindersByTitleQuery(userId, titleQuery);

      if (matches.length === 0) {
        return `I couldn't find a reminder matching "${titleQuery}".`;
      }
      if (matches.length > 1) {
        // Ambiguous - never guess which one to delete. Ask the user to
        // be more specific rather than silently deleting the wrong one.
        const list = matches.map((r) => `- "${r.title}" at ${r.remindAt.toLocaleString()}`).join('\n');
        return `I found multiple matching reminders, please be more specific:\n${list}`;
      }

      await matches[0].deleteOne();
      return `Deleted the reminder "${matches[0].title}".`;
    },
    {
      name: 'delete_reminder',
      description: "Deletes one of the current user's reminders by matching its title text.",
      schema: z.object({
        titleQuery: z.string().describe('Text to search for in the reminder\'s title, e.g. "call mom"'),
      }),
    }
  );
