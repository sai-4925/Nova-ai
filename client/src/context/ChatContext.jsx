// src/context/ChatContext.jsx
// -----------------------------------------------------------------------
// Single source of truth for chat state. `sendMessage` is where the
// live "typing" effect happens: it appends the user's message
// immediately (optimistic UI), then appends ONE placeholder assistant
// message and grows its `content` string as chunks arrive - components
// just render `messages` and never touch streaming mechanics directly.
// -----------------------------------------------------------------------

import { createContext, useState, useCallback } from 'react';
import * as chatApi from '../services/chatApi.js';

export const ChatContext = createContext(null);

// A temporary client-side ID for the in-progress assistant message,
// swapped for the real Mongo _id once the stream's "done" event arrives.
const STREAMING_ID = 'streaming-in-progress';

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const refreshConversations = useCallback(async () => {
    const { data } = await chatApi.listConversations();
    setConversations(data.data.conversations);
  }, []);

  const startNewConversation = useCallback(async () => {
    const { data } = await chatApi.createConversation();
    const conversation = data.data.conversation;
    setConversations((prev) => [conversation, ...prev]);
    setActiveConversationId(conversation._id);
    setMessages([]);
    return conversation._id;
  }, []);

  const selectConversation = useCallback(async (conversationId) => {
    setActiveConversationId(conversationId);
    const { data } = await chatApi.getMessages(conversationId);
    setMessages(data.data.messages);
  }, []);

  const removeConversation = useCallback(
    async (conversationId) => {
      await chatApi.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    },
    [activeConversationId]
  );

  /**
   * @param {string} content
   * @param {boolean} [isVoice] - true when submitted via the Voice Assistant module
   */
  const sendMessage = useCallback(
    async (content, isVoice = false) => {
      let conversationId = activeConversationId;
      if (!conversationId) {
        conversationId = await startNewConversation();
      }

      setError(null);

      // Optimistic UI: show the user's message immediately, then a
      // placeholder assistant bubble that will grow as chunks arrive.
      setMessages((prev) => [
        ...prev,
        { _id: `local-user-${Date.now()}`, role: 'user', content, isVoice },
        { _id: STREAMING_ID, role: 'assistant', content: '' },
      ]);
      setIsStreaming(true);

      await chatApi.streamMessage(
        conversationId,
        { content, isVoice },
        {
          onChunk: (text) => {
            setMessages((prev) =>
              prev.map((m) => (m._id === STREAMING_ID ? { ...m, content: m.content + text } : m))
            );
          },
          onDone: (messageId) => {
            setMessages((prev) => prev.map((m) => (m._id === STREAMING_ID ? { ...m, _id: messageId } : m)));
            setIsStreaming(false);
            refreshConversations(); // pick up the auto-generated title
          },
          onError: (message) => {
            setError(message);
            setIsStreaming(false);
          },
        }
      );
    },
    [activeConversationId, startNewConversation, refreshConversations]
  );

  const value = {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    error,
    refreshConversations,
    startNewConversation,
    selectConversation,
    removeConversation,
    sendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
