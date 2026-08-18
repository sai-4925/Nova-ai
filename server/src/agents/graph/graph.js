// agents/graph/graph.js
// -----------------------------------------------------------------------
// The actual graph definition: START -> Planner -> Memory -> Tool
// Selection -> (conditional fan-out) -> [specialist node] -> Response
// -> END, with a conditional loop back to Tool Selection when a
// specialist node sets `needsAnotherTool: true`.
//
// WHY the routing function lives here (not inside toolSelectionNode):
// LangGraph's addConditionalEdges takes a pure function of state that
// returns the NAME of the next node - it's the graph's job to know its
// own topology, not any single node's. Keeping it here also means
// adding a brand-new specialist node later is a two-line change: one
// `.addNode(...)` call and one entry in `routeMap`.
// -----------------------------------------------------------------------

import { StateGraph, START, END } from '@langchain/langgraph';
import { NovaState } from './state.js';

import { plannerNode } from '../nodes/plannerNode.js';
import { memoryNode } from '../nodes/memoryNode.js';
import { toolSelectionNode } from '../nodes/toolSelectionNode.js';
import { emailNode } from '../nodes/emailNode.js';
import { whatsappNode } from '../nodes/whatsappNode.js';
import { reminderNode } from '../nodes/reminderNode.js';
import { calendarNode } from '../nodes/calendarNode.js';
import { weatherNode } from '../nodes/weatherNode.js';
import { searchNode } from '../nodes/searchNode.js';
import { pdfNode } from '../nodes/pdfNode.js';
import { researchNode } from '../nodes/researchNode.js';
import { codingNode } from '../nodes/codingNode.js';
import { systemNode } from '../nodes/systemNode.js';
import { responseNode } from '../nodes/responseNode.js';
import { metaNode } from '../nodes/metaNode.js';
// Maps a `route` value (set by Planner/Tool Selection) to the actual
// node name to run next. 'general' skips straight to the Response node
// since no specialist tool is needed - this is the one route with no
// corresponding "doing work" node.
const routeMap = {
  email: 'email',
  whatsapp: 'whatsapp',
  reminder: 'reminder',
  calendar: 'calendar',
  weather: 'weather',
  search: 'search',
  pdf: 'pdf',
  research: 'research',
  coding: 'coding',
  system: 'system',
  meta: 'meta',
  general: 'response',
};

// After ANY specialist node runs, decide whether to loop back to Tool
// Selection (multi-tool request still in progress) or move on to
// Response (this turn's work is done).
const afterToolEdge = (state) => (state.needsAnotherTool ? 'toolSelection' : 'response');

const buildGraph = () => {
  const graph = new StateGraph(NovaState)
    .addNode('planner', plannerNode)
    .addNode('memory', memoryNode)
    .addNode('toolSelection', toolSelectionNode)
    .addNode('email', emailNode)
    .addNode('whatsapp', whatsappNode)
    .addNode('reminder', reminderNode)
    .addNode('calendar', calendarNode)
    .addNode('weather', weatherNode)
    .addNode('search', searchNode)
    .addNode('pdf', pdfNode)
    .addNode('research', researchNode)
    .addNode('coding', codingNode)
    .addNode('system', systemNode)
    .addNode('response', responseNode)
    .addNode('meta', metaNode)
    .addEdge(START, 'planner')
    .addEdge('planner', 'memory')
    .addEdge('memory', 'toolSelection')

    // Fan-out: Tool Selection's outgoing edge picks the specialist node
    // (or skips straight to Response for 'general').
    .addConditionalEdges('toolSelection', (state) => routeMap[state.route] || 'response', {
      email: 'email',
      whatsapp: 'whatsapp',
      reminder: 'reminder',
      calendar: 'calendar',
      weather: 'weather',
      search: 'search',
      pdf: 'pdf',
      research: 'research',
      coding: 'coding',
      system: 'system',
      meta: 'meta',
      general: 'response',
      response: 'response',
    })

    // Every specialist node's outgoing edge is conditional too - either
    // loop back for another tool, or proceed to Response.
    .addConditionalEdges('email', afterToolEdge, { toolSelection: 'toolSelection', response: 'response' })
    .addConditionalEdges('whatsapp', afterToolEdge, { toolSelection: 'toolSelection', response: 'response' })
    .addConditionalEdges('reminder', afterToolEdge, { toolSelection: 'toolSelection', response: 'response' })
    .addConditionalEdges('calendar', afterToolEdge, { toolSelection: 'toolSelection', response: 'response' })
    .addConditionalEdges('weather', afterToolEdge, { toolSelection: 'toolSelection', response: 'response' })
    .addConditionalEdges('search', afterToolEdge, { toolSelection: 'toolSelection', response: 'response' })
    .addConditionalEdges('pdf', afterToolEdge, { toolSelection: 'toolSelection', response: 'response' })
    .addConditionalEdges('research', afterToolEdge, { toolSelection: 'toolSelection', response: 'response' })
    .addConditionalEdges('coding', afterToolEdge, { toolSelection: 'toolSelection', response: 'response' })
    .addConditionalEdges('system', afterToolEdge, { toolSelection: 'toolSelection', response: 'response' })
    .addConditionalEdges('meta', afterToolEdge, {toolSelection: 'toolSelection',response: 'response',
})

    .addEdge('response', END);

  return graph.compile();
};

// Compiled once at module load and reused across requests - recompiling
// per-request would be wasted work, since the graph's SHAPE never
// changes between calls (only the state flowing through it does).
export const novaGraph = buildGraph();
