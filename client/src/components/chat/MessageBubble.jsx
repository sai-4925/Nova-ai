// src/components/chat/MessageBubble.jsx
// -----------------------------------------------------------------------
// User messages align right in amber-tinted bubbles; assistant messages
// align left with a small static nova-orb avatar, reusing the same
// signature dot used in the header/auth pages for visual continuity.
// -----------------------------------------------------------------------

export const MessageBubble = ({ role, content, isVoice }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <div className="mb-1 h-2 w-2 shrink-0 rounded-full bg-nova-amber shadow-glow" />}

      <div
        className={`max-w-[70%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-nova-amber text-void'
            : 'rounded-bl-sm border border-hairline bg-surface-raised text-ink'
        }`}
      >
        {content || (
          // Empty content means the assistant's reply hasn't started
          // streaming yet - show a subtle typing indicator instead of
          // a blank bubble.
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint [animation-delay:300ms]" />
          </span>
        )}
      </div>

      {isUser && isVoice && (
        <span className="mb-1 text-xs text-ink-faint" title="Sent by voice">
          🎙
        </span>
      )}
    </div>
  );
};
