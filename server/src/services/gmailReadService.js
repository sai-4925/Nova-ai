// services/gmailReadService.js
// -----------------------------------------------------------------------
// READING only - uses the Gmail API with the user's OWN authenticated
// OAuth client (from googleAuthService.js, same client Calendar uses).
// Kept separate from emailService.js (sending) since they operate under
// completely different trust models: sending uses one shared service
// account; reading accesses a specific user's actual private inbox.
// -----------------------------------------------------------------------

import { google } from 'googleapis';
import { ApiError } from '../utils/ApiError.js';

const getGmailClient = (oauth2Client) => google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Decodes a Gmail message's plain-text body from its base64url-encoded
 * payload. Gmail messages can be multipart (text + HTML) - this walks
 * the parts looking for the text/plain part, falling back to the
 * snippet if no plain-text part is found.
 * @param {object} message - a Gmail API message resource
 */
const extractPlainTextBody = (message) => {
  const findTextPart = (parts) => {
    if (!parts) return null;
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) return part.body.data;
      if (part.parts) {
        const nested = findTextPart(part.parts);
        if (nested) return nested;
      }
    }
    return null;
  };

  const encoded = message.payload?.body?.data || findTextPart(message.payload?.parts);
  if (!encoded) return message.snippet || '';

  return Buffer.from(encoded, 'base64url').toString('utf-8');
};

/**
 * Lists the user's most recent inbox messages with basic metadata and
 * plain-text bodies (truncated) - enough context for Gemini to
 * summarise without pulling full raw MIME content.
 * @param {import('google-auth-library').OAuth2Client} oauth2Client
 * @param {number} [maxResults]
 */
export const listRecentEmails = async (oauth2Client, maxResults = 5) => {
  const gmail = getGmailClient(oauth2Client);

  try {
    const { data: listData } = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX'],
    });

    if (!listData.messages || listData.messages.length === 0) return [];

    // Gmail's list endpoint only returns IDs - each message needs a
    // separate get() call for its actual content.
    const messages = await Promise.all(
      listData.messages.map(async ({ id }) => {
        const { data: message } = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
        const headers = message.payload?.headers || [];
        const getHeader = (name) => headers.find((h) => h.name === name)?.value || '';

        return {
          id: message.id,
          from: getHeader('From'),
          subject: getHeader('Subject'),
          date: getHeader('Date'),
          body: extractPlainTextBody(message).slice(0, 1500), // cap length fed into Gemini
        };
      })
    );

    return messages;
  } catch (error) {
    throw ApiError.internal(`Failed to read your emails: ${error.message}`);
  }
};
