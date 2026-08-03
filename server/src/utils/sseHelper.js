// utils/sseHelper.js
// -----------------------------------------------------------------------
// Tiny reusable wrapper around Server-Sent Events (SSE), so controllers
// never hand-write the "data: ...\n\n" wire format themselves. Using SSE
// (not WebSockets) because the data only flows server -> client for
// chat streaming - no bidirectional channel is needed, and SSE works
// over plain HTTP on both Vercel and Render without extra infra.
// -----------------------------------------------------------------------

/**
 * Initialises the response for SSE streaming. Call once at the start
 * of a streaming controller before any events are sent.
 * @param {import('express').Response} res
 */
export const initSSE = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Disable any upstream proxy buffering (relevant on Render) so
  // chunks reach the browser as soon as they're written, not batched.
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
};

/**
 * Sends one named SSE event with a JSON-serialisable payload.
 * @param {import('express').Response} res
 * @param {string} event - event name the client's EventSource listens for
 * @param {object} data
 */
export const sendSSEEvent = (res, event, data) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

/**
 * Ends the SSE stream cleanly.
 * @param {import('express').Response} res
 */
export const endSSE = (res) => {
  res.end();
};
