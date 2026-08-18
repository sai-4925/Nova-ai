import { AGENT_METADATA } from '../../config/agentMetadata.js';

export const metaNode = async (state) => {
  const { action } = state.routeParams || {};

  let output;

  if (action === 'count') {
    output = `Nova has ${AGENT_METADATA.agentCount} agents/modules.`;
  } else if (action === 'list') {
    output = AGENT_METADATA.listAgentNames().join('\n');
  } else if (action === 'summary' || !action) {
    output = AGENT_METADATA.summary();
  } else if (action === 'about') {
    output = `${AGENT_METADATA.name}: ${AGENT_METADATA.description}`;
  } else {
    output = AGENT_METADATA.summary();
  }

  return {
    toolResults: [{ tool: 'meta', input: state.routeParams, output }],
    needsAnotherTool: false,
  };
};