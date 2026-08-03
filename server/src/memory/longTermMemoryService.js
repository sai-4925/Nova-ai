// memory/longTermMemoryService.js
// -----------------------------------------------------------------------
// Long-term memory is DISTILLED and PERSISTENT: not the literal
// transcript (that's short-term memory), but durable facts about the
// user ("prefers concise answers", "working on a React project called
// Nova") that should influence responses in conversations that happen
// weeks apart. Two operations:
//
//   1. RECALL (read) - runs at the START of every turn, inside
//      memoryNode.js. Embeds the current message and similarity-searches
//      the user's own Chroma collection for relevant past facts.
//
//   2. DISTILL (write) - runs AFTER a turn completes, fire-and-forget
//      from chatController.js (same pattern as auto-titling). Asks
//      Gemini whether the exchange contained anything worth
//      remembering long-term, and if so, stores it.
//
// Each user gets ONE Chroma collection (`memory_<userId>`), not one per
// memory - unlike PdfDocument (Module 15), which is one collection per
// document. Mongo's Memory model (Module 3) stores the readable/
// manageable side (for a future "what does Nova remember about me"
// settings screen); Chroma stores the embeddings for similarity search.
// -----------------------------------------------------------------------

import { randomUUID } from 'crypto';
import { Memory } from '../models/Memory.js';
import { embedQuery, embedDocumentChunks } from '../vectorstore/embeddingService.js';
import { addChunksToCollection, querySimilarChunks } from '../vectorstore/chromaClient.js';
import { generateOnce } from '../services/geminiService.js';
import { logger } from '../utils/logger.js';

const memoryCollectionName = (userId) => `memory_${userId}`;

/**
 * Finds long-term memories relevant to the current message.
 * @param {string} userId
 * @param {string} userMessage
 * @param {number} [topK]
 * @returns {Promise<string[]>} relevant fact strings, most relevant first
 */
export const recallRelevantMemories = async (userId, userMessage, topK = 3) => {
  try {
    const hasAny = await Memory.exists({ userId });
    if (!hasAny) return []; // skip the embedding/query round-trip entirely for a brand-new user

    const queryEmbedding = await embedQuery(userMessage);
    const facts = await querySimilarChunks(memoryCollectionName(userId), queryEmbedding, topK);
    return facts;
  } catch (error) {
    // Memory recall is an ENHANCEMENT, not a critical path - if Chroma
    // is briefly unavailable, the turn should still proceed without
    // recalled context rather than failing the whole conversation.
    logger.warn(`Memory recall failed (continuing without it): ${error.message}`);
    return [];
  }
};

/**
 * Asks Gemini whether a completed exchange contains a durable fact
 * worth remembering, and stores it if so. Fire-and-forget from the
 * caller - never blocks the response the user is waiting on.
 * @param {string} userId
 * @param {string} conversationId
 * @param {string} userMessage
 * @param {string} assistantMessage
 */
export const distillAndStoreMemory = async (userId, conversationId, userMessage, assistantMessage) => {
  try {
    const prompt = `
A user said: "${userMessage}"
The assistant replied: "${assistantMessage}"

Does this exchange reveal a DURABLE fact worth remembering about the user
long-term (a stated preference, personal detail, ongoing project, recurring
habit, etc) - something that would still be useful to know in a completely
different conversation weeks from now?

If yes, respond with ONLY a single short factual sentence stating the fact
(third person, e.g. "Prefers concise, non-technical explanations."). If no
durable fact is present, respond with exactly: NONE
`.trim();

    const response = (await generateOnce(prompt)).trim();
    if (response === 'NONE' || !response) return;

    const chromaId = randomUUID();
    const [embedding] = await embedDocumentChunks([response]);

    await addChunksToCollection(memoryCollectionName(userId), {
      ids: [chromaId],
      embeddings: [embedding],
      documents: [response],
      metadatas: [{ userId: userId.toString() }],
    });

    await Memory.create({
      userId,
      content: response,
      sourceConversationId: conversationId,
      chromaId,
    });

    logger.info(`Stored new long-term memory for user ${userId}: "${response}"`);
  } catch (error) {
    // Same principle as recall - distillation failing should never
    // surface to the user or affect the conversation they're having.
    logger.warn(`Memory distillation failed (non-critical): ${error.message}`);
  }
};

/** @param {string} userId */
export const listMemories = async (userId) => Memory.find({ userId }).sort({ createdAt: -1 });

/**
 * @param {string} userId
 * @param {string} memoryId
 */
export const deleteMemory = async (userId, memoryId) => {
  const memory = await Memory.findOne({ _id: memoryId, userId });
  if (!memory) return;
  await memory.deleteOne();
  // Note: the corresponding Chroma vector (memory.chromaId) is left in
  // place here for simplicity - it becomes unreachable via Mongo but
  // isn't actively harmful. A future cleanup job could periodically
  // reconcile orphaned Chroma entries against Mongo's Memory collection.
};
