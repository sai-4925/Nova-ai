// tools/calendarTool.js
// -----------------------------------------------------------------------
// Same trusted-factory pattern as reminderTool.js: userId is bound at
// creation time (never an LLM-controlled schema field). Each tool
// resolves the user's authenticated Google client itself before calling
// calendarService - if the user hasn't connected Google Calendar,
// getAuthenticatedClientForUser's clear error propagates straight up
// through .invoke(), which calendarNode.js surfaces directly.
// -----------------------------------------------------------------------

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getAuthenticatedClientForUser } from '../services/googleAuthService.js';
import {
  createCalendarEvent,
  listUpcomingCalendarEvents,
  findCalendarEventsByTitleQuery,
  deleteCalendarEvent,
} from '../services/calendarService.js';

const formatEvent = (event) => {
  const start = event.start?.dateTime || event.start?.date;
  return `- "${event.summary}" at ${new Date(start).toLocaleString()}`;
};

/** @param {string} userId */
export const createCalendarEventTool = (userId) =>
  tool(
    async ({ title, startISO, endISO, location }) => {
      const client = await getAuthenticatedClientForUser(userId);
      const event = await createCalendarEvent(client, { title, startISO, endISO, location });
      return `Event created: "${event.summary}" on ${new Date(event.start.dateTime).toLocaleString()}.`;
    },
    {
      name: 'create_calendar_event',
      description: "Creates a new event on the current user's Google Calendar.",
      schema: z.object({
        title: z.string().describe('Event title, e.g. "Dentist appointment"'),
        startISO: z.string().describe('Event start time as an absolute ISO 8601 datetime'),
        endISO: z.string().describe('Event end time as an absolute ISO 8601 datetime'),
        location: z.string().optional(),
      }),
    }
  );

/** @param {string} userId */
export const listCalendarEventsTool = (userId) =>
  tool(
    async () => {
      const client = await getAuthenticatedClientForUser(userId);
      const events = await listUpcomingCalendarEvents(client);
      if (events.length === 0) return "You don't have any upcoming events.";
      return events.map(formatEvent).join('\n');
    },
    {
      name: 'list_calendar_events',
      description: "Lists the current user's upcoming Google Calendar events.",
      schema: z.object({}),
    }
  );

/** @param {string} userId */
export const deleteCalendarEventTool = (userId) =>
  tool(
    async ({ titleQuery }) => {
      const client = await getAuthenticatedClientForUser(userId);
      const matches = await findCalendarEventsByTitleQuery(client, titleQuery);

      if (matches.length === 0) {
        return `I couldn't find an event matching "${titleQuery}".`;
      }
      if (matches.length > 1) {
        return `I found multiple matching events, please be more specific:\n${matches.map(formatEvent).join('\n')}`;
      }

      await deleteCalendarEvent(client, matches[0].id);
      return `Deleted the event "${matches[0].summary}".`;
    },
    {
      name: 'delete_calendar_event',
      description: "Deletes one of the current user's Google Calendar events by matching its title text.",
      schema: z.object({
        titleQuery: z.string().describe('Text to search for in the event\'s title'),
      }),
    }
  );
