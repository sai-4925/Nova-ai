// services/searchService.js
// -----------------------------------------------------------------------
// Pure integration with Google's Custom Search JSON API (free tier:
// 100 queries/day). Requires BOTH an API key and a Search Engine ID
// (cx) - the engine ID comes from a Programmable Search Engine
// configured at programmablesearchengine.google.com to search the
// whole web. Same layering as weatherService.js: knows nothing about
// LangChain or Express.
// -----------------------------------------------------------------------

import axios from 'axios';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const SEARCH_BASE_URL = 'https://www.googleapis.com/customsearch/v1';

/**
 * @param {string} query
 * @param {number} [numResults] - max 10 per Google's API limit
 * @returns {Promise<Array<{ title: string, link: string, snippet: string }>>}
 */
export const searchWeb = async (query, numResults = 5) => {
  if (!env.googleSearch.apiKey || !env.googleSearch.engineId) {
    throw ApiError.internal(
      'Search Agent is not configured - GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID are required.'
    );
  }

  if (!query || !query.trim()) {
    throw ApiError.badRequest('A search query is required.');
  }

  try {
    const { data } = await axios.get(SEARCH_BASE_URL, {
      params: {
        key: env.googleSearch.apiKey,
        cx: env.googleSearch.engineId,
        q: query.trim(),
        num: Math.min(numResults, 10),
      },
      timeout: 8000,
    });

    return (data.items || []).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));
  } catch (error) {
    if (error.response?.status === 429) {
      throw ApiError.internal("Search quota exceeded for today - the free tier allows 100 searches/day.");
    }
    throw ApiError.internal(`Web search failed: ${error.message}`);
  }
};

/**
 * Formats search results as a readable numbered list - kept here (not
 * in the tool or node) so the exact presentation changes in one place.
 * @param {Array<{ title: string, link: string, snippet: string }>} results
 */
export const formatSearchResultsAsText = (results) => {
  if (results.length === 0) return "I couldn't find any results for that search.";
  return results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.link}`).join('\n\n');
};
