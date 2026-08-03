// agents/graph/toolMetadata.js
// -----------------------------------------------------------------------
// The Message model (Module 3) stores ONE toolName/toolInput/toolOutput
// per message - but the graph's multi-tool loop-back (Module 9) can
// produce SEVERAL entries in state.toolResults for a single turn (e.g.
// "check weather then email it"). This pure function reconciles the
// two shapes: joining tool names, merging inputs, and combining outputs
// into the single-message-row format the database expects.
//
// Kept as a standalone pure function (no Mongoose/Express import) so it
// can be unit tested without a database connection.
// -----------------------------------------------------------------------

/**
 * @param {Array<{tool: string, input: object, output: string, error?: string}>} toolResults
 * @returns {{ toolName: string|null, toolInput: object|null, toolOutput: object|null }}
 */
export const buildToolMetadataForMessage = (toolResults) => {
  if (!toolResults || toolResults.length === 0) {
    return { toolName: null, toolInput: null, toolOutput: null };
  }

  return {
    toolName: toolResults.map((r) => r.tool).join(','),
    toolInput: toolResults.reduce((merged, r) => ({ ...merged, [r.tool]: r.input }), {}),
    toolOutput: toolResults.reduce((merged, r) => ({ ...merged, [r.tool]: r.output }), {}),
  };
};
