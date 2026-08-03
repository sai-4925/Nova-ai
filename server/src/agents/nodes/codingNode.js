// agents/nodes/codingNode.js
// -----------------------------------------------------------------------
// Unlike the other specialist nodes in this module, Coding does NOT need
// a stub - it only depends on Gemini (already fully wired via
// geminiService.js), no new external API or credential. This is a real,
// working node from day one.
// -----------------------------------------------------------------------

import { generateOnce } from '../../services/geminiService.js';
import { CODING_SYSTEM_INSTRUCTION } from '../prompts/codingPrompt.js';
import { logger } from '../../utils/logger.js';

export const codingNode = async (state) => {
  try {
    const output = await generateOnce(state.userMessage, CODING_SYSTEM_INSTRUCTION);
    return {
      toolResults: [{ tool: 'coding', input: { userMessage: state.userMessage }, output }],
      needsAnotherTool: false,
    };
  } catch (error) {
    logger.error(`Coding Node failed: ${error.message}`);
    return {
      toolResults: [{ tool: 'coding', input: { userMessage: state.userMessage }, output: null, error: error.message }],
      needsAnotherTool: false,
    };
  }
};
