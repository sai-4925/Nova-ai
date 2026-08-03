// src/pages/ChatPage.jsx
// -----------------------------------------------------------------------
// Composes the chat feature's two halves. ChatProvider is mounted HERE
// (not globally in App.jsx) since chat state only needs to exist while
// the user is actually on this page - avoids holding message arrays in
// memory across the whole app lifetime.
// -----------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { ChatProvider } from '../context/ChatContext.jsx';
import { VoiceProvider } from '../context/VoiceContext.jsx';
import { ConversationSidebar } from '../components/chat/ConversationSidebar.jsx';
import { ChatWindow } from '../components/chat/ChatWindow.jsx';

const ChatPage = () => (
  <ChatProvider>
    <VoiceProvider>
      <div className="flex h-screen flex-col bg-void">
        <header className="flex items-center gap-3 border-b border-hairline px-6 py-3">
          <Link to="/dashboard" className="text-ink-muted hover:text-ink" aria-label="Back to dashboard">
            ←
          </Link>
          <div className="h-2 w-2 rounded-full bg-nova-amber shadow-glow" />
          <span className="font-display text-base font-semibold">NOVA</span>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <ConversationSidebar />
          <ChatWindow />
        </div>
      </div>
    </VoiceProvider>
  </ChatProvider>
);

export default ChatPage;
