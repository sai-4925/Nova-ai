// services/researchService.js
// -----------------------------------------------------------------------
// Orchestrates existing pieces rather than adding a new external API:
//   1. Ask Gemini to break the topic into a few focused sub-questions
//   2. Search each sub-question (reusing searchService.js from Module 14)
//   3. Fetch and extract real text from the top result per sub-question -
//      search snippets alone are too thin for a proper research answer
//   4. If a fetch fails (many sites block bots/timeout - this is
//      EXPECTED and common), fall back to that result's snippet rather
//      than failing the whole research task over one blocked site
//   5. Synthesise everything into a cited summary via Gemini, explicitly
//      instructed to paraphrase rather than reproduce source text verbatim
// -----------------------------------------------------------------------

import axios from 'axios';
import * as cheerio from 'cheerio';
import { searchWeb } from './searchService.js';
import { generateOnce } from './geminiService.js';
import { logger } from '../utils/logger.js';

const MAX_SUBQUERIES = 3;
const MAX_EXTRACTED_CHARS = 4000;

/**
 * Asks Gemini to break a broad topic into a few focused, searchable
 * sub-questions - a single search for "AI in healthcare" is much
 * shallower than searching its distinct angles separately.
 * @param {string} topic
 */
const generateSubQueries = async (topic) => {
  const prompt = `Break this research topic into ${MAX_SUBQUERIES} distinct, focused search queries that together would cover it well. Respond with ONLY a JSON array of strings, no commentary.\n\nTopic: "${topic}"`;
  try {
    const raw = await generateOnce(prompt);
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, MAX_SUBQUERIES);
  } catch (error) {
    logger.warn(`Research sub-query generation failed, falling back to the raw topic: ${error.message}`);
  }
  return [topic]; // fail safe - research the topic directly rather than crashing
};

/**
 * Fetches a URL and extracts its main visible text, stripping scripts/
 * styles/nav noise. Returns null (not throws) on any failure - the
 * caller falls back to the search snippet, since page fetching fails
 * often and unpredictably in the real world (paywalls, bot blocking,
 * timeouts) and that shouldn't sink the whole research task.
 * @param {string} url
 */
const tryExtractPageText = async (url) => {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 6000,
      maxContentLength: 2 * 1024 * 1024, // 2MB cap - avoid downloading huge pages
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaAI-Research/1.0)' },
    });

    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    return text.slice(0, MAX_EXTRACTED_CHARS) || null;
  } catch (error) {
    logger.warn(`Research: could not fetch/extract ${url}: ${error.message}`);
    return null;
  }
};

/**
 * Builds a Gemini prompt that synthesises gathered source material into
 * a coherent answer, explicitly instructed to paraphrase rather than
 * quote sources at length.
 * @param {string} topic
 * @param {Array<{ title: string, link: string, content: string }>} sources
 */
const buildSynthesisPrompt = (topic, sources) => `
Research topic: "${topic}"

Using the source material below, write a well-organised summary (3-5 short paragraphs)
that answers the topic. PARAPHRASE in your own words rather than quoting sources at
length - use at most one short quote (under 15 words) per source if a direct quote is
genuinely needed. Mention which source(s) support each key point by name.

${sources.map((s, i) => `[Source ${i + 1}: ${s.title} - ${s.link}]\n${s.content}`).join('\n\n')}
`.trim();

/**
 * Runs the full research pipeline for a topic.
 * @param {string} topic
 * @returns {Promise<string>} the synthesised report, including a source list
 */
export const researchTopic = async (topic) => {
  const subQueries = await generateSubQueries(topic);

  const sources = [];
  for (const subQuery of subQueries) {
    const results = await searchWeb(subQuery, 2);
    const topResult = results[0];
    if (!topResult) continue;

    const extractedText = await tryExtractPageText(topResult.link);
    sources.push({
      title: topResult.title,
      link: topResult.link,
      // Fall back to the snippet if the full page couldn't be fetched -
      // still gives Gemini SOMETHING for that source rather than nothing.
      content: extractedText || topResult.snippet,
    });
  }

  if (sources.length === 0) {
    return "I couldn't find any sources to research that topic right now.";
  }

  const report = await generateOnce(buildSynthesisPrompt(topic, sources));
  const sourceList = sources.map((s, i) => `[${i + 1}] ${s.title} - ${s.link}`).join('\n');

  return `${report}\n\nSources:\n${sourceList}`;
};
