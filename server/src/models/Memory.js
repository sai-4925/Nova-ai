// models/Memory.js
// -----------------------------------------------------------------------
// Long-term memory: DISTILLED facts about a user, not raw transcript.
//
// A Message is "user said: I love hiking in the Himalayas on weekends."
// A Memory is the distilled fact: "User enjoys hiking, prefers weekends,
// interested in the Himalayas region" - promoted by the Memory Node when
// it decides something is worth remembering beyond the current session.
//
// Each memory is also embedded and stored in ChromaDB (see
// memory/longTermMemory.js) - `chromaId` links the two so we can delete
// or update both sides together. Mongo holds the readable fact + metadata
// (importance, source conversation); Chroma holds the vector for
// similarity retrieval ("what do I know that's relevant to THIS message").
// -----------------------------------------------------------------------

import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    // Which conversation this fact was distilled from - lets a user
    // trace "why does Nova think I like hiking" back to the source chat.
    sourceConversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    // The corresponding vector's ID inside ChromaDB's long-term-memory
    // collection - the join key between Mongo (readable) and Chroma
    // (searchable) storage.
    chromaId: {
      type: String,
      required: true,
      unique: true,
    },
    // A rough 1-5 importance score the Memory Node assigns, used to
    // decide what to keep when pruning old/low-value memories over time.
    importance: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    lastRecalledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Memory = mongoose.model('Memory', memorySchema);
