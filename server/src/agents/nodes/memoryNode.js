// agents/nodes/memoryNode.js
// -----------------------------------------------------------------------
// FULLY IMPLEMENTED (recall side). Embeds the current message and
// similarity-searches the user's long-term memory collection for
// relevant durable facts - see memory/longTermMemoryService.js for the
// full design. The WRITE side (distilling new memories) deliberately
// does NOT happen here - it runs after the response exists, from
// chatController.js, since this node runs before any reply has been
// generated.
// -----------------------------------------------------------------------

import { recallRelevantMemories } from '../../memory/longTermMemoryService.js';

export const memoryNode = async (state) => {
  const recalledMemories = await recallRelevantMemories(state.userId, state.userMessage);
  return { recalledMemories };
};
