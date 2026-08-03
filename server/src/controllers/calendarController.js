// controllers/calendarController.js
// -----------------------------------------------------------------------
// Two concerns in one controller (small enough to not warrant
// splitting): the OAuth connect/callback handshake, and plain REST CRUD
// once connected - both needed for the dashboard's "Calendar" widget to
// work independently of chat.
// -----------------------------------------------------------------------

import {
  generateGoogleAuthUrl,
  handleGoogleOAuthCallback,
  getAuthenticatedClientForUser,
} from '../services/googleAuthService.js';
import {
  createCalendarEvent,
  listUpcomingCalendarEvents,
  deleteCalendarEvent,
} from '../services/calendarService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// GET /api/calendar/oauth/connect
// Returns the Google consent URL for the frontend to redirect the user to.
export const getGoogleAuthUrl = asyncHandler(async (req, res) => {
  const url = generateGoogleAuthUrl();
  new ApiResponse(200, { url }).send(res);
});

// GET /api/calendar/oauth/callback
// -----------------------------------------------------------------------
// Google redirects the user's BROWSER here directly (not an API call
// from our own frontend), so this handler must itself redirect back to
// the client app rather than returning JSON - there's no frontend code
// waiting to parse a JSON response at this URL.
// -----------------------------------------------------------------------
export const googleOAuthCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) {
    throw ApiError.badRequest('Missing authorization code from Google');
  }

  try {
    await handleGoogleOAuthCallback(code, req.user._id);
    res.redirect(`${env.clientUrl}/dashboard?calendarConnected=true`);
  } catch (error) {
    logger.error(`Google OAuth callback failed: ${error.message}`);
    res.redirect(`${env.clientUrl}/dashboard?calendarConnected=false`);
  }
});

// GET /api/calendar/events
export const listEvents = asyncHandler(async (req, res) => {
  const client = await getAuthenticatedClientForUser(req.user._id);
  const events = await listUpcomingCalendarEvents(client);
  new ApiResponse(200, { events }).send(res);
});

// POST /api/calendar/events
export const createEvent = asyncHandler(async (req, res) => {
  const { title, startISO, endISO, location } = req.body;
  if (!title || !startISO || !endISO) {
    throw ApiError.badRequest('title, startISO, and endISO are required');
  }
  const client = await getAuthenticatedClientForUser(req.user._id);
  const event = await createCalendarEvent(client, { title, startISO, endISO, location });
  new ApiResponse(201, { event }, 'Event created').send(res);
});

// DELETE /api/calendar/events/:googleEventId
export const removeEvent = asyncHandler(async (req, res) => {
  const client = await getAuthenticatedClientForUser(req.user._id);
  await deleteCalendarEvent(client, req.params.googleEventId);
  new ApiResponse(200, null, 'Event deleted').send(res);
});
