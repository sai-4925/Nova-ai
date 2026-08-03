// memory/shortTermMemory.js
// -----------------------------------------------------------------------
// Short-term memory is mostly ALREADY built - it's the recent
// conversation history (chatService.getRecentMessages + geminiService.
// buildGeminiHistory) that's been flowing into the graph's chatHistory
// field since Module 5/10. This file gives that concept its own clearly
// named home, matching the architecture's "short-term vs long-term"
// distinction, rather than leaving it implicit inside chatController.js.
//
// Short-term memory is SESSION-SCOPED and VERBATIM (actual transcript,
// capped to the last 20 turns) - contrast with long-term memory
// (memory/longTermMemoryService.js), which is DISTILLED facts that
// persist across every conversation, not just the current one.
// -----------------------------------------------------------------------

import * as chatService from '../services/chatService.js';
import { buildGeminiHistory } from '../services/geminiService.js';

const SHORT_TERM_WINDOW = 20;

/**
 * Builds the Gemini-shaped recent history for a conversation - this is
 * "what did we just talk about," bounded to keep token cost predictable.
 * @param {string} conversationId
 */
export const getShortTermHistory = async (conversationId) => {
  const recentMessages = await chatService.getRecentMessages(conversationId, SHORT_TERM_WINDOW);
  return buildGeminiHistory(recentMessages);
};
