// models/Conversation.js
// -----------------------------------------------------------------------
// Represents one chat "thread" (like a sidebar item in ChatGPT).
// Deliberately stores ONLY metadata - actual chat turns live in the
// Message collection, referenced by conversationId. This keeps this
// document tiny and cheap to list ("show me all my conversations")
// without loading every message ever sent.
// -----------------------------------------------------------------------

import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // nearly every query is "this user's conversations"
    },
    title: {
      type: String,
      default: 'New conversation',
      trim: true,
      // Auto-generated from the first user message in chatService,
      // similar to how ChatGPT titles new threads.
    },
    // Which agent/mode this conversation is primarily using - lets the
    // UI show an icon (e.g. a PDF icon for RAG chats) without
    // re-deriving it from message content every render.
    mode: {
      type: String,
      enum: ['general', 'pdf-rag', 'coding', 'research'],
      default: 'general',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
