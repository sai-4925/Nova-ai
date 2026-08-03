// vectorstore/chromaClient.js
// -----------------------------------------------------------------------
// Thin helpers over Chroma's collection API. We always supply our OWN
// embeddings (via embeddingService.js, using Gemini) rather than
// configuring a Chroma-side embeddingFunction - this keeps embedding
// logic in one place (our code) instead of split between our service
// and Chroma's server-side config.
// -----------------------------------------------------------------------

import { chromaClient } from '../config/chroma.js';

/**
 * @param {string} collectionName
 */
const getCollection = async (collectionName) => {
  return chromaClient.getOrCreateCollection({ name: collectionName });
};

/**
 * Stores a PDF's chunks with their pre-computed embeddings.
 * @param {string} collectionName
 * @param {{ ids: string[], embeddings: number[][], documents: string[], metadatas: object[] }} data
 */
export const addChunksToCollection = async (collectionName, { ids, embeddings, documents, metadatas }) => {
  const collection = await getCollection(collectionName);
  await collection.add({ ids, embeddings, documents, metadatas });
};

/**
 * Finds the topK most similar chunks to a query embedding.
 * @param {string} collectionName
 * @param {number[]} queryEmbedding
 * @param {number} [topK]
 * @returns {Promise<string[]>} the matching chunk texts, most similar first
 */
export const querySimilarChunks = async (collectionName, queryEmbedding, topK = 4) => {
  const collection = await getCollection(collectionName);
  const result = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    include: ['documents'],
  });
  return result.documents?.[0] || [];
};

/**
 * Deletes an entire collection - used when a PdfDocument is deleted,
 * so orphaned vectors don't linger in Chroma.
 * @param {string} collectionName
 */
export const deleteCollection = async (collectionName) => {
  await chromaClient.deleteCollection({ name: collectionName });
};
