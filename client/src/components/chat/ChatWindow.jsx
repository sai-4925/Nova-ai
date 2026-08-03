// src/components/chat/ChatWindow.jsx
// -----------------------------------------------------------------------
// Main chat panel: scrollable message list + input row. The mic button
// is a deliberate placeholder (disabled, with an explanatory title) -
// the Voice Assistant module wires its onClick to Web Speech API
// recognition without needing to touch this component's layout.
// -----------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat.js';
import { useVoice } from '../../hooks/useVoice.js';
import { MessageBubble } from './MessageBubble.jsx';
import { MicButton } from '../voice/MicButton.jsx';

export const ChatWindow = () => {
  const { messages, isStreaming, error, sendMessage, activeConversationId } = useChat();
  const { liveTranscript, voiceState } = useVoice();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    sendMessage(trimmed);
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!activeConversationId && messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 h-3 w-3 rounded-full bg-nova-amber shadow-glow animate-breathe" />
            <h2 className="font-display text-xl font-semibold">Talk to Nova</h2>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">
              Ask a question, start a new conversation, or pick up where you left off.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((message) => (
              <MessageBubble key={message._id} role={message.role} content={message.content} isVoice={message.isVoice} />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="mx-6 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {voiceState === 'active' && liveTranscript && (
        <div className="mx-auto mb-2 max-w-2xl px-6">
          <p className="rounded-lg bg-surface-raised px-4 py-2 text-sm italic text-ink-muted">{liveTranscript}...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-hairline p-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-xl border border-hairline bg-surface px-3 py-2">
          <MicButton />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Nova..."
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="shrink-0 rounded-lg bg-nova-amber px-4 py-1.5 text-sm font-semibold text-void transition-opacity disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
