// src/components/chat/ConversationSidebar.jsx
// -----------------------------------------------------------------------
// Left rail of the chat page. Purely presentational over useChat() -
// doesn't know how conversations are fetched/streamed, only how to
// list, select, and delete them.
// -----------------------------------------------------------------------

import { useEffect } from 'react';
import { useChat } from '../../hooks/useChat.js';

export const ConversationSidebar = () => {
  const { conversations, activeConversationId, refreshConversations, startNewConversation, selectConversation, removeConversation } =
    useChat();

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  return (
    <aside className="flex h-full w-72 flex-col border-r border-hairline bg-surface">
      <div className="p-4">
        <button
          onClick={startNewConversation}
          className="w-full rounded-lg border border-nova-amber/40 bg-nova-amber/10 px-4 py-2.5 text-sm font-medium text-nova-amber transition-colors hover:bg-nova-amber/20"
        >
          + New conversation
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-ink-faint">No conversations yet. Say hello to Nova.</p>
        )}
        {conversations.map((conversation) => (
          <div
            key={conversation._id}
            className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors ${
              activeConversationId === conversation._id ? 'bg-surface-raised text-ink' : 'text-ink-muted hover:bg-surface-raised/60'
            }`}
            onClick={() => selectConversation(conversation._id)}
          >
            <span className="truncate">{conversation.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeConversation(conversation._id);
              }}
              className="ml-2 hidden shrink-0 text-ink-faint hover:text-red-400 group-hover:block"
              aria-label={`Delete conversation: ${conversation.title}`}
            >
              ✕
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
};
