// agents/graph/state.js
// -----------------------------------------------------------------------
// The SHARED STATE every node in the graph reads from and writes to.
// This is the single most important contract in the whole agent system -
// every node module built from here on (Email, WhatsApp, Weather,
// Search, PDF, Research, Coding, System, Response) reads/writes THIS
// exact shape. Getting the reducers right here means nodes can run in
// sequence (e.g. loop back to Tool Selection for multi-tool requests)
// without one node's update accidentally overwriting another's.
//
// Reducer behaviour, explained field by field below:
//   - Fields with a `reducer` function MERGE updates (e.g. messages
//     accumulate, never overwrite).
//   - Fields WITHOUT a reducer are simply overwritten by whichever node
//     returns them last - correct for single-value fields like `route`.
// -----------------------------------------------------------------------

import { Annotation } from '@langchain/langgraph';

export const NovaState = Annotation.Root({
  // The raw text the user just sent (via chat or voice) this turn.
  userMessage: Annotation({
    reducer: (_current, update) => update,
    default: () => '',
  }),

  // Whether this turn originated from voice input - some nodes (e.g.
  // Response Node) may shape output differently for speech (shorter,
  // less markdown) vs. text.
  isVoice: Annotation({
    reducer: (_current, update) => update,
    default: () => false,
  }),

  // Mongo IDs identifying who's talking and in which conversation -
  // every node that touches the database (Reminder, Calendar, PDF,
  // Memory) needs these for scoping queries to the right user.
  userId: Annotation({ reducer: (_current, update) => update, default: () => null }),
  conversationId: Annotation({ reducer: (_current, update) => update, default: () => null }),

  // Prior turns loaded by the Memory Node, in Gemini's {role, parts}
  // history shape (see geminiService.buildGeminiHistory) - read-only
  // context for whichever node ends up generating the final reply.
  chatHistory: Annotation({
    reducer: (_current, update) => update,
    default: () => [],
  }),

  // Long-term facts recalled by the Memory Node (Module 12) relevant to
  // this specific message - kept separate from chatHistory since these
  // are DISTILLED facts, not literal transcript (see models/Memory.js).
  recalledMemories: Annotation({
    reducer: (_current, update) => update,
    default: () => [],
  }),

  // Set by the Planner Node - tells the graph's conditional edge which
  // specialist node to run next. One of: 'email' | 'whatsapp' |
  // 'reminder' | 'calendar' | 'weather' | 'search' | 'pdf' | 'research'
  // | 'coding' | 'system' | 'general' (general = no tool needed, answer
  // directly).
  route: Annotation({ reducer: (_current, update) => update, default: () => 'general' }),

  // Free-form parameters the Planner extracted for the chosen route
  // (e.g. { city: 'Delhi' } for weather, { recipient: 'mom', subject: ... }
  // for email) - each specialist node knows how to read its own shape.
  routeParams: Annotation({ reducer: (_current, update) => update, default: () => ({}) }),

  // Accumulates a human-readable trace of which tools ran and what they
  // returned THIS turn - mirrors the toolName/toolInput/toolOutput
  // fields on the Message model (Module 3), so the Response Node (and
  // later, the saved Message document) can show what actually happened.
  toolResults: Annotation({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),

  // The final natural-language reply, set by the Response Node - this
  // is what gets streamed back to the client and optionally spoken
  // aloud by the Voice Assistant.
  finalResponse: Annotation({ reducer: (_current, update) => update, default: () => '' }),

  // Set to true by Tool Selection when a request needs more than one
  // tool in sequence (e.g. "check the weather, then email it to me") -
  // this is what drives the conditional loop back to Tool Selection
  // instead of going straight to Response after one tool runs.
  needsAnotherTool: Annotation({ reducer: (_current, update) => update, default: () => false }),
});
