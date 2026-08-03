// models/Message.js
// -----------------------------------------------------------------------
// One document per chat turn. Kept separate from Conversation (not
// embedded) because a conversation can hold hundreds of turns - embedding
// them would risk hitting MongoDB's 16MB document limit and would force
// loading the ENTIRE history just to show the conversation list.
//
// Also doubles as the audit trail for LangGraph tool calls: when the
// Tool Selection Node routes to e.g. the Weather Node, the tool name,
// its input, and its output are stored alongside the assistant's reply -
// this is what lets the UI show "Called: weather_tool" and lets us
// debug agent behavior after the fact.
// -----------------------------------------------------------------------

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true, // every message fetch is scoped to one conversation
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system', 'tool'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // Populated only when role === 'tool' or when the assistant message
    // was produced via a tool call - keeps the LangGraph execution
    // traceable per turn.
    toolName: {
      type: String,
      default: null,
    },
    toolInput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    toolOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Was this message delivered via voice (Web Speech API) - used to
    // decide whether the frontend should auto-speak the response back.
    isVoice: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index: fetching a conversation's messages in chronological
// order is the single most frequent query in the whole app.
messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
