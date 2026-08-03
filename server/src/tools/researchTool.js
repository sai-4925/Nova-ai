// tools/researchTool.js
// -----------------------------------------------------------------------
// Plain tool - like weatherTool.js/searchTool.js, no user-scoped data
// involved, so the topic is safe for the LLM to fully control.
// -----------------------------------------------------------------------

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { researchTopic } from '../services/researchService.js';

export const researchTool = tool(async ({ topic }) => researchTopic(topic), {
  name: 'research_topic',
  description:
    'Researches a topic by searching multiple angles, reading real source pages, and synthesising a cited summary. Use for deeper "research X" or "tell me about the current state of Y" requests rather than a single quick fact.',
  schema: z.object({
    topic: z.string().describe('The topic or question to research'),
  }),
});
