// config/gemini.js
// -----------------------------------------------------------------------
// Initializes the Google Generative AI (Gemini) client ONCE.
// Exported so both the plain chat feature (this module) AND the
// LangGraph agent nodes (built in a later module) reuse the exact same
// configured client instead of each re-reading env vars and
// re-instantiating their own copy.
// -----------------------------------------------------------------------

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env.js';

const genAI = new GoogleGenerativeAI(env.gemini.apiKey);

/**
 * Returns a configured Gemini model instance.
 * Accepts an optional systemInstruction so different callers (plain
 * chat vs. a specialised agent node like the Coding Node) can shape
 * the model's behaviour without creating a whole new client.
 * @param {string} [systemInstruction]
 */
export const getGeminiModel = (systemInstruction) =>
  genAI.getGenerativeModel({
    model: env.gemini.model,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
