// services/googleAuthService.js
// -----------------------------------------------------------------------
// Handles Google OAuth 2.0 for Calendar AND Gmail reading - COMPLETELY
// SEPARATE from Firebase Authentication (Module 4). A user can be
// logged into NOVA via Firebase without ever having granted this
// additional access - it's requested only when they connect Google
// services, following least privilege.
//
// access_type: 'offline' + prompt: 'consent' is what makes Google
// return a REFRESH token (not just a short-lived access token) - this
// is required so NOVA can act later (e.g. from a voice command)
// without the user re-approving every time.
//
// SCOPE NOTE (Module 16 update): originally this only requested Calendar
// access (Module 13). Gmail readonly access was added here rather than
// building a second OAuth consent flow - one "Connect Google" button
// now unlocks both Calendar and Email reading, since asking a user to
// click through two near-identical Google consent screens for the same
// personal assistant would be poor UX for no real security benefit.
// -----------------------------------------------------------------------

import { google } from 'googleapis';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const createBareOAuthClient = () =>
  new google.auth.OAuth2(env.google.clientId, env.google.clientSecret, env.google.redirectUri);

/**
 * Builds the URL the frontend redirects the user to for Google's
 * consent screen.
 */
export const generateGoogleAuthUrl = () => {
  const oauth2Client = createBareOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent', // forces a refresh token even on repeat authorisations
  });
};

/**
 * Exchanges the authorization code Google redirected back with for
 * tokens, and persists the refresh token on the user's profile.
 * @param {string} code
 * @param {string} userId - the already-authenticated (via Firebase/JWT) Mongo user
 */
export const handleGoogleOAuthCallback = async (code, userId) => {
  const oauth2Client = createBareOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    // Google only returns a refresh token on the FIRST consent, or when
    // prompt=consent forces re-issuance - if this is somehow missing,
    // fail clearly rather than silently storing an incomplete grant.
    throw ApiError.internal('Google did not return a refresh token - please try connecting your calendar again.');
  }

  await User.findByIdAndUpdate(userId, { googleRefreshToken: tokens.refresh_token });
};

/**
 * Builds an authenticated OAuth2 client for a specific user, using
 * their stored refresh token. Throws a clear, user-facing error if
 * they haven't connected Google Calendar yet, rather than letting a
 * downstream Google API call fail with a cryptic 401.
 * @param {string} userId
 */
export const getAuthenticatedClientForUser = async (userId) => {
  // googleRefreshToken has `select: false` in the schema (Module 3) -
  // must explicitly request it here.
  const user = await User.findById(userId).select('+googleRefreshToken');

  if (!user?.googleRefreshToken) {
    throw ApiError.badRequest(
      "You haven't connected your Google account yet. Connect it from Settings to use Calendar and Email features."
    );
  }

  const oauth2Client = createBareOAuthClient();
  oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
  return oauth2Client;
};
