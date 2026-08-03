// agents/nodes/toolSelectionNode.js
// -----------------------------------------------------------------------
// Sits between Memory and the specialist nodes. For a single-tool
// request, it simply trusts the route the Planner already decided.
// Its real purpose becomes visible on the LOOP-BACK path (see
// graph.js): when a specialist node sets `needsAnotherTool: true`
// (e.g. after checking the weather, the user also wanted it emailed),
// execution returns HERE rather than going to Response - this node is
// where a future module adds logic to pick the NEXT tool given what's
// already been done (state.toolResults), without re-running the full
// Planner LLM call from scratch.
// -----------------------------------------------------------------------

export const toolSelectionNode = async (state) => {
  // For now: trust state.route as set by the Planner Node. Multi-tool
  // re-routing logic (inspecting state.toolResults to decide the NEXT
  // tool) is added once specialist nodes exist that can actually chain
  // (e.g. Weather -> Email in Module 10+).
  return { route: state.route };
};
