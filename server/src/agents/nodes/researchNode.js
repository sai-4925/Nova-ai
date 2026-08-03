// agents/nodes/researchNode.js
// -----------------------------------------------------------------------
// FULLY IMPLEMENTED. Mirrors weatherNode.js/searchNode.js's shape.
// -----------------------------------------------------------------------

import { researchTool } from '../../tools/researchTool.js';
import { logger } from '../../utils/logger.js';

export const researchNode = async (state) => {
  const topic = state.routeParams?.topic;

  if (!topic) {
    return {
      toolResults: [{ tool: 'research', input: state.routeParams, output: 'What topic would you like me to research?' }],
      needsAnotherTool: false,
    };
  }

  try {
    const output = await researchTool.invoke({ topic });
    return { toolResults: [{ tool: 'research', input: { topic }, output }], needsAnotherTool: false };
  } catch (error) {
    logger.error(`Research Node failed: ${error.message}`);
    return {
      toolResults: [{ tool: 'research', input: { topic }, output: error.message || "I couldn't research that right now." }],
      needsAnotherTool: false,
    };
  }
};
