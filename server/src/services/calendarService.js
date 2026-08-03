// services/calendarService.js
// -----------------------------------------------------------------------
// Pure Google Calendar API v3 integration. Deliberately takes an
// ALREADY-AUTHENTICATED oauth2Client as a parameter rather than
// building one itself - keeps this file testable and decoupled from
// how/where auth happens (see googleAuthService.js).
// -----------------------------------------------------------------------

import { google } from 'googleapis';
import { ApiError } from '../utils/ApiError.js';

const getCalendarClient = (oauth2Client) => google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * @param {import('google-auth-library').OAuth2Client} oauth2Client
 * @param {{ title: string, startISO: string, endISO: string, location?: string }} params
 */
export const createCalendarEvent = async (oauth2Client, { title, startISO, endISO, location }) => {
  const start = new Date(startISO);
  const end = new Date(endISO);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw ApiError.badRequest("I couldn't understand the start or end time for that event.");
  }
  if (end.getTime() <= start.getTime()) {
    throw ApiError.badRequest('The event end time must be after the start time.');
  }

  const calendar = getCalendarClient(oauth2Client);
  try {
    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title,
        location,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      },
    });
    return data; // includes Google's own event id, used for later update/delete
  } catch (error) {
    throw ApiError.internal(`Failed to create the calendar event: ${error.message}`);
  }
};

/**
 * Lists upcoming events, soonest first.
 * @param {import('google-auth-library').OAuth2Client} oauth2Client
 * @param {number} [maxResults]
 */
export const listUpcomingCalendarEvents = async (oauth2Client, maxResults = 10) => {
  const calendar = getCalendarClient(oauth2Client);
  try {
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return data.items || [];
  } catch (error) {
    throw ApiError.internal(`Failed to fetch calendar events: ${error.message}`);
  }
};

/**
 * Finds events whose title contains the given text (case-insensitive) -
 * Google's API doesn't support a direct title-substring filter server
 * side for this use case, so we list upcoming events and filter here.
 * Fine at personal-assistant scale (tens of upcoming events, not thousands).
 * @param {import('google-auth-library').OAuth2Client} oauth2Client
 * @param {string} titleQuery
 */
export const findCalendarEventsByTitleQuery = async (oauth2Client, titleQuery) => {
  const events = await listUpcomingCalendarEvents(oauth2Client, 50);
  const lowerQuery = titleQuery.toLowerCase();
  return events.filter((event) => event.summary?.toLowerCase().includes(lowerQuery));
};

/**
 * @param {import('google-auth-library').OAuth2Client} oauth2Client
 * @param {string} googleEventId
 */
export const deleteCalendarEvent = async (oauth2Client, googleEventId) => {
  const calendar = getCalendarClient(oauth2Client);
  try {
    await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
  } catch (error) {
    throw ApiError.internal(`Failed to delete the calendar event: ${error.message}`);
  }
};
