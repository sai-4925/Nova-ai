// services/geminiService.js
// -----------------------------------------------------------------------
// PURE AI logic - deliberately knows nothing about Express, SSE, or
// MongoDB. This is what lets the exact same function be called from:
//   (a) the plain chat controller (this module), and
//   (b) the LangGraph Response/Coding/Research nodes (later modules)
// without duplicating Gemini setup or history-formatting logic in two
// places.
// -----------------------------------------------------------------------

import { getGeminiModel } from '../config/gemini.js';

export const DEFAULT_SYSTEM_INSTRUCTION =
  'You are NOVA, a helpful, concise voice-and-text AI assistant. ' +
  'Keep spoken-style answers natural since some replies may be read ' +
  'aloud via text-to-speech - avoid heavy markdown when the user is in voice mode.';

/**
 * Converts our stored Message documents into the {role, parts} shape
 * the Gemini SDK's chat history expects. Gemini only recognises 'user'
 * and 'model' roles, so 'assistant' messages map to 'model', and
 * 'system'/'tool' rows (audit trail only) are excluded from the
 * literal conversation history sent to the model.
 * @param {Array<{role: string, content: string}>} messages
 */
export const buildGeminiHistory = (messages) =>
  messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

/**
 * Streams a Gemini response chunk-by-chunk, invoking `onChunk` for each
 * piece of text as it arrives. Returns the full accumulated text once
 * the stream finishes, so the caller can persist the complete message.
 *
 * @param {Array<{role: string, parts: {text: string}[]}>} history - prior turns (Gemini format)
 * @param {string} userMessage - the new message to send
 * @param {(chunkText: string) => void} onChunk - called for every streamed piece
 * @param {string} [systemInstruction] - optional override (e.g. for the Coding Node)
 * @returns {Promise<string>} the full assistant response text
 */
export const streamChatResponse = async (history, userMessage, onChunk, systemInstruction) => {
  const model = getGeminiModel(systemInstruction || DEFAULT_SYSTEM_INSTRUCTION);
  const chat = model.startChat({ history });

  const result = await chat.sendMessageStream(userMessage);

  let fullText = '';
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      fullText += chunkText;
      onChunk(chunkText);
    }
  }

  return fullText;
};

/**
 * Non-streaming single-shot generation - used by places that need one
 * complete answer rather than token-by-token output, e.g. auto-titling
 * a conversation or summarising a PDF (later modules).
 * @param {string} prompt
 * @param {string} [systemInstruction]
 */
export const generateOnce = async (prompt, systemInstruction) => {
  const model = getGeminiModel(systemInstruction);
  const result = await model.generateContent(prompt);
  return result.response.text();
};
