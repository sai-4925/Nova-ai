// src/services/chatApi.js
// -----------------------------------------------------------------------
// REST calls use the shared `api` axios instance. Streaming is the one
// exception: axios doesn't expose a raw byte stream reader, so
// `streamMessage` uses the Fetch API directly against the same
// endpoint, parsing the "event: X\ndata: Y\n\n" frames written by the
// backend's utils/sseHelper.js (Module 5). The wire format is shared -
// only the transport (fetch vs axios) differs.
// -----------------------------------------------------------------------

import { api } from './axiosInstance.js';
import { env } from '../config/env.js';

export const createConversation = (mode = 'general') => api.post('/chat/conversations', { mode });

export const listConversations = () => api.get('/chat/conversations');

export const getMessages = (conversationId) => api.get(`/chat/conversations/${conversationId}/messages`);

export const deleteConversation = (conversationId) => api.delete(`/chat/conversations/${conversationId}`);

/**
 * Parses a single SSE frame ("event: X\ndata: Y") into its event name
 * and JSON-parsed data payload. Pure and exported so it's directly unit
 * testable without needing a real fetch/ReadableStream - this is the
 * highest-risk hand-written piece of the streaming client, since a bug
 * here would silently corrupt every chat response.
 * @param {string} frame
 * @returns {{ eventName: string, data: object } | null} null if the frame is malformed/incomplete
 */
export const parseSSEFrame = (frame) => {
  const lines = frame.split('\n');
  const eventLine = lines.find((l) => l.startsWith('event:'));
  const dataLine = lines.find((l) => l.startsWith('data:'));
  if (!eventLine || !dataLine) return null;

  const eventName = eventLine.replace('event:', '').trim();
  const data = JSON.parse(dataLine.replace('data:', '').trim());
  return { eventName, data };
};

/**
 * Sends a message and streams the assistant's reply back chunk by chunk.
 * Uses fetch (not axios) because we need direct access to the response
 * body's ReadableStream, which axios doesn't expose in the browser.
 *
 * @param {string} conversationId
 * @param {{ content: string, isVoice?: boolean }} payload
 * @param {{ onChunk: (text: string) => void, onDone: (messageId: string) => void, onError: (message: string) => void }} handlers
 */
export const streamMessage = async (conversationId, payload, { onChunk, onDone, onError }) => {
  let response;
  try {
    response = await fetch(`${env.apiBaseUrl}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // send the httpOnly session cookie
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    onError('Could not reach Nova. Check your connection and try again.');
    return;
  }

  if (!response.ok || !response.body) {
    onError('Nova had trouble responding. Please try again.');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Reads the stream until the backend closes it (see controllers/chatController.js -> endSSE).
  // Frames are separated by a blank line; each frame has an "event:" line
  // and a "data:" line, matching utils/sseHelper.js exactly.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop(); // last piece may be incomplete - keep it for the next read

    for (const frame of frames) {
      const parsed = parseSSEFrame(frame);
      if (!parsed) continue;

      const { eventName, data } = parsed;
      if (eventName === 'chunk') onChunk(data.text);
      else if (eventName === 'done') onDone(data.messageId);
      else if (eventName === 'error') onError(data.message);
    }
  }
};
