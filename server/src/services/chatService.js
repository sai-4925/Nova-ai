// services/chatService.js
// -----------------------------------------------------------------------
// PURE persistence logic for conversations/messages - no Gemini calls,
// no HTTP response handling. Kept separate from geminiService.js so
// each file has exactly one reason to change.
// -----------------------------------------------------------------------

import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { generateOnce } from './geminiService.js';

/**
 * Creates a new empty conversation for a user.
 */
export const createConversation = async (userId, mode = 'general') => {
  return Conversation.create({ userId, mode });
};

/**
 * Lists a user's conversations, most recently updated first - matches
 * how a typical chat sidebar orders threads.
 */
export const listConversations = async (userId) => {
  return Conversation.find({ userId, isArchived: false }).sort({ updatedAt: -1 });
};

/**
 * Fetches a conversation and verifies it belongs to the requesting
 * user - prevents one user from reading/writing another's chat via a
 * guessed conversation ID (IDOR protection).
 */
export const getOwnedConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw ApiError.notFound('Conversation not found');
  }
  return conversation;
};

/**
 * Returns the most recent N messages for a conversation, oldest first -
 * this becomes both the UI's rendered history AND the context window
 * sent to Gemini. Capped at 20 turns to keep the Gemini context (and
 * token cost) bounded; the Memory Node (later module) handles anything
 * that needs to be remembered beyond this window.
 */
export const getRecentMessages = async (conversationId, limit = 20) => {
  const messages = await Message.find({ conversationId }).sort({ createdAt: -1 }).limit(limit);
  return messages.reverse(); // back to chronological order
};

/**
 * Persists a single message (user or assistant turn).
 */
export const saveMessage = async ({ conversationId, userId, role, content, isVoice = false, toolName, toolInput, toolOutput }) => {
  return Message.create({ conversationId, userId, role, content, isVoice, toolName, toolInput, toolOutput });
};

/**
 * Auto-titles a conversation from its first user message, mirroring
 * how ChatGPT-style UIs label new threads without requiring the user
 * to type a title themselves. Only runs once - if a title already
 * differs from the default, we leave it alone (user may have renamed it).
 */
export const maybeAutoTitleConversation = async (conversation, firstUserMessage) => {
  if (conversation.title !== 'New conversation') return conversation;

  try {
    const titlePrompt = `Summarise this message into a short 4-6 word chat title, no punctuation, no quotes: "${firstUserMessage}"`;
    const title = await generateOnce(titlePrompt);
    conversation.title = title.trim().slice(0, 60);
    await conversation.save();
  } catch {
    // Non-critical - if title generation fails, keep the default title
    // rather than failing the whole chat request over a cosmetic feature.
  }

  return conversation;
};

export const deleteConversation = async (conversationId, userId) => {
  const conversation = await getOwnedConversation(conversationId, userId);
  await Message.deleteMany({ conversationId: conversation._id });
  await conversation.deleteOne();
};
