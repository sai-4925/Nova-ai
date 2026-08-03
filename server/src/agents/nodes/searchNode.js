// agents/nodes/searchNode.js
// -----------------------------------------------------------------------
// FULLY IMPLEMENTED. Mirrors weatherNode.js's shape exactly: missing
// input -> clarifying question; tool failure -> surface the
// ApiError's user-facing message directly.
// -----------------------------------------------------------------------

import { searchTool } from '../../tools/searchTool.js';
import { logger } from '../../utils/logger.js';

export const searchNode = async (state) => {
  const query = state.routeParams?.query;

  if (!query) {
    return {
      toolResults: [{ tool: 'search', input: state.routeParams, output: 'What would you like me to search for?' }],
      needsAnotherTool: false,
    };
  }

  try {
    const output = await searchTool.invoke({ query });
    return { toolResults: [{ tool: 'search', input: { query }, output }], needsAnotherTool: false };
  } catch (error) {
    logger.error(`Search Node failed: ${error.message}`);
    return {
      toolResults: [{ tool: 'search', input: { query }, output: error.message || "I couldn't search right now." }],
      needsAnotherTool: false,
    };
  }
};
