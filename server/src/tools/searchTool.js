// tools/searchTool.js
// -----------------------------------------------------------------------
// Same shape as weatherTool.js - no user-scoped data involved, so a
// plain (non-factory) tool is safe here: the query is the only input
// and it's fine for the LLM to control it entirely.
// -----------------------------------------------------------------------

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { searchWeb, formatSearchResultsAsText } from '../services/searchService.js';

export const searchTool = tool(
  async ({ query }) => {
    const results = await searchWeb(query);
    return formatSearchResultsAsText(results);
  },
  {
    name: 'web_search',
    description: 'Searches the web for current information, facts, news, or anything not in your own knowledge.',
    schema: z.object({
      query: z.string().describe('The search query'),
    }),
  }
);
