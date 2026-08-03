// agents/nodes/plannerNode.js
// -----------------------------------------------------------------------
// The Planner Node's ONLY job: decide which specialist node handles this
// turn (`route`) and extract that node's parameters (`routeParams`). It
// does NOT do the actual work (send the email, check the weather, etc.)
// - that separation is what makes graph.js's conditional edge possible.
//
// Reuses geminiService.generateOnce (Module 5) rather than calling
// Gemini directly - exactly the reuse that module was built for.
// -----------------------------------------------------------------------

import { generateOnce } from '../../services/geminiService.js';
import { buildPlannerPrompt, AVAILABLE_ROUTES } from '../prompts/plannerPrompt.js';
import { logger } from '../../utils/logger.js';

/**
 * Turns Gemini-shaped chat history into a short plain-text summary for
 * the planner prompt - the planner only needs enough context to resolve
 * references like "send that to her too", not the full transcript.
 * @param {Array<{role: string, parts: {text: string}[]}>} chatHistory
 */
const summariseRecentHistory = (chatHistory) => {
  return chatHistory
    .slice(-4) // last 4 turns is plenty for resolving pronouns/references
    .map((turn) => `${turn.role === 'model' ? 'assistant' : 'user'}: ${turn.parts[0]?.text ?? ''}`)
    .join('\n');
};

/**
 * Safely parses the planner's JSON response. Gemini occasionally wraps
 * JSON in markdown fences or adds stray whitespace despite instructions
 * not to - this strips that defensively rather than trusting the model
 * blindly, since a parse failure here would otherwise crash the graph.
 * @param {string} rawText
 */
const parsePlannerResponse = (rawText) => {
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!AVAILABLE_ROUTES.includes(parsed.route)) {
      throw new Error(`Unknown route returned: ${parsed.route}`);
    }
    return {
      route: parsed.route,
      routeParams: parsed.routeParams || {},
    };
  } catch (error) {
    logger.warn(`Planner JSON parse failed, defaulting to 'general': ${error.message}`);
    return { route: 'general', routeParams: {} };
  }
};

/**
 * The Planner Node function itself - matches the (state) => partialState
 * shape every LangGraph node must follow.
 * @param {typeof import('../graph/state.js').NovaState.State} state
 */
export const plannerNode = async (state) => {
  const historySummary = summariseRecentHistory(state.chatHistory);
  const currentDateTime = new Date().toString(); // includes timezone offset, helps Gemini resolve "tomorrow" correctly
  const prompt = buildPlannerPrompt(state.userMessage, historySummary, currentDateTime);

  let route = 'general';
  let routeParams = {};

  try {
    const rawResponse = await generateOnce(prompt);
    ({ route, routeParams } = parsePlannerResponse(rawResponse));
  } catch (error) {
    // If Gemini itself fails (rate limit, network), fail SAFE into
    // 'general' rather than crashing the whole graph - the Response
    // Node can still attempt a direct answer with no tool.
    logger.error(`Planner Node failed, defaulting to 'general': ${error.message}`);
  }

  return { route, routeParams };
};
