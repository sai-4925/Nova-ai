// vectorstore/embeddingService.js
// -----------------------------------------------------------------------
// Wraps Gemini's embedding model. Distinguishes RETRIEVAL_DOCUMENT
// (used when embedding PDF chunks for storage) from RETRIEVAL_QUERY
// (used when embedding a user's question) - Gemini's embedding model
// produces measurably better retrieval results when told which side of
// the search a given embedding is for, rather than treating both
// identically.
// -----------------------------------------------------------------------

import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { env } from '../config/env.js';

const genAI = new GoogleGenerativeAI(env.gemini.apiKey);
const EMBEDDING_MODEL = 'text-embedding-004';

const getEmbeddingModel = () => genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

/**
 * Embeds a batch of PDF chunks for storage.
 * @param {string[]} chunks
 * @returns {Promise<number[][]>}
 */
export const embedDocumentChunks = async (chunks) => {
  const model = getEmbeddingModel();
  const { embeddings } = await model.batchEmbedContents({
    requests: chunks.map((chunk) => ({
      content: { role: 'user', parts: [{ text: chunk }] },
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    })),
  });
  return embeddings.map((e) => e.values);
};

/**
 * Embeds a single user query for similarity search.
 * @param {string} query
 * @returns {Promise<number[]>}
 */
export const embedQuery = async (query) => {
  const model = getEmbeddingModel();
  const { embedding } = await model.embedContent({
    content: { role: 'user', parts: [{ text: query }] },
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  return embedding.values;
};
