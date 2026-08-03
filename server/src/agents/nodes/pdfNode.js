// agents/nodes/pdfNode.js
// -----------------------------------------------------------------------
// FULLY IMPLEMENTED. Thin wrapper over pdfTool - the tool itself
// handles document disambiguation and the "no documents yet" case, so
// this node's job is just: require a query, call the tool, surface
// whatever it returns (including its own clarifying questions).
// -----------------------------------------------------------------------

import { pdfQueryTool } from '../../tools/pdfTool.js';
import { logger } from '../../utils/logger.js';

export const pdfNode = async (state) => {
  const { query, documentTitle } = state.routeParams || {};

  if (!query) {
    return {
      toolResults: [{ tool: 'pdf', input: state.routeParams, output: 'What would you like to know from your document?' }],
      needsAnotherTool: false,
    };
  }

  try {
    const output = await pdfQueryTool(state.userId).invoke({ query, documentTitle });
    return { toolResults: [{ tool: 'pdf', input: { query, documentTitle }, output }], needsAnotherTool: false };
  } catch (error) {
    logger.error(`PDF Node failed: ${error.message}`);
    return {
      toolResults: [
        { tool: 'pdf', input: { query, documentTitle }, output: error.message || "I couldn't search your documents right now." },
      ],
      needsAnotherTool: false,
    };
  }
};
